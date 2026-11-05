// Data + auth layer (Supabase). All authorisation is enforced by Row Level Security
// in schema.sql — nothing in this file is a security boundary.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from "./config.js";

export const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON");
export const sb = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/* ---------- auth ---------- */
export async function isAdmin(user) {
  if (!sb || !user) return false;
  const { data, error } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return !error && !!data;
}

export async function login(email, password) {
  if (!sb) throw new Error("Backend not configured — see js/config.js.");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid email or password.");
  if (!(await isAdmin(data.user))) {
    await sb.auth.signOut();
    throw new Error("This account does not have admin access.");
  }
  return data.user;
}

export const logout = () => sb?.auth.signOut();

/** cb(adminUser | null) fires for the initial session and every later change. */
export function onAuth(cb) {
  if (!sb) return;
  sb.auth.onAuthStateChange((_event, session) => {
    // Deferred: calling supabase inside this callback synchronously can deadlock.
    setTimeout(async () => cb(session && (await isAdmin(session.user)) ? session.user : null), 0);
  });
}

/* ---------- posts ---------- */
// DB row  { id, type, title, post_date, tags[], featured, data{} }  <->  flat object
const fromRow = (r) => ({ id: r.id, type: r.type, title: r.title, date: r.post_date, tags: r.tags ?? [], featured: r.featured, ...r.data });

export async function listPosts(type) {
  if (!sb) return [];
  let q = sb.from("posts").select("*").order("post_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(fromRow);
}

export async function savePost(post, id) {
  const { type, title, date, tags, featured, ...data } = post;
  const row = { type, title, post_date: date || null, tags: tags || [], featured: !!featured, data };
  const { error } = id ? await sb.from("posts").update(row).eq("id", id) : await sb.from("posts").insert(row);
  if (error) throw error;
}

export async function deletePost(id) {
  const { error } = await sb.from("posts").delete().eq("id", id);
  if (error) throw error;
}

// The DB trigger un-features every other article, so this is a single atomic write.
export async function setFeatured(id, on) {
  const { error } = await sb.from("posts").update({ featured: on }).eq("id", id);
  if (error) throw error;
}

export async function upload(file, folder = "uploads") {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
