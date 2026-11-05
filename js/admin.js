// CMS dashboard. The lock screen below is UX only — Row Level Security decides what the
// database accepts, so a bypassed guard still cannot read-write protected data.
import { configured, onAuth, listPosts, savePost, deletePost, setFeatured, upload } from "./api.js";
import { openLogin } from "./auth.js";
import { esc, clean, toast, embedHTML } from "./ui.js";

const $ = (s, r = document) => r.querySelector(s);
const root = $("#cms");

const TYPES = [
  { id: "photography", label: "Photography" },
  { id: "journalism", label: "Journalism" },
  { id: "video", label: "Video Editing" },
];
const TAG_SUGGESTIONS = ["Events", "Creative", "Cosplay"];
const PLATFORMS = ["YouTube", "TikTok", "Instagram Reels", "Facebook", "X/Twitter"];
const MAX_MB = 10;

// Single source of truth for UI state.
const state = { type: "photography", editing: null, posts: [], tags: [], quill: null, busy: false };

/* ------------------------------------------------------------------ helpers */
const f = (label, control, hint = "") => `<label class="field"><span>${label}</span>${control}${hint ? `<small>${hint}</small>` : ""}</label>`;
const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const int = (v) => Math.max(0, parseInt(v, 10) || 0);

function checkImage(file) {
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" is not an image.`);
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`"${file.name}" is over ${MAX_MB} MB.`);
}
const up = (file, folder) => (checkImage(file), upload(file, folder));

function setBusy(b) {
  state.busy = b;
  const btn = $("#submitBtn");
  if (btn) { btn.disabled = b; btn.textContent = b ? "Saving…" : state.editing ? "Save changes" : "Publish post"; }
}

function askCredit() {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "auth-dialog";
    d.setAttribute("aria-labelledby", "creditTitle");
    d.innerHTML = `<form class="auth-form" method="dialog">
      <h2 id="creditTitle">Image credit</h2>
      <label class="field"><span>Credit / source</span><input name="credit" placeholder="e.g. Photo by Your Name / Publisher" autofocus></label>
      <div class="auth-actions"><button type="button" class="btn btn-ghost" data-skip>Cancel</button><button class="btn btn-primary" value="ok">Insert image</button></div></form>`;
    document.body.append(d);
    let result = null;
    d.querySelector("[data-skip]").addEventListener("click", () => d.close());
    d.querySelector("form").addEventListener("submit", () => (result = d.querySelector("input").value.trim()));
    d.addEventListener("close", () => { d.remove(); resolve(result); });
    d.showModal();
  });
}

/* --------------------------------------------------------------- form views */
const tagInput = () => `
  <fieldset class="field"><legend>Tags</legend>
    <div class="chips" id="chips"></div>
    <input id="tagEntry" list="tagList" placeholder="Type a tag and press Enter" autocomplete="off">
    <datalist id="tagList">${TAG_SUGGESTIONS.map((t) => `<option value="${t}">`).join("")}</datalist>
    <div class="chip-suggest">${TAG_SUGGESTIONS.map((t) => `<button type="button" class="chip" data-add="${t}">+ ${t}</button>`).join("")}</div>
  </fieldset>`;

const VIEWS = {
  photography: (v) => `
    ${f("Title *", `<input name="title" required value="${esc(v.title)}">`)}
    <div class="row2">${f("Date", `<input type="date" name="date" value="${esc(v.date)}">`)}${f("Client / Event", `<input name="client" value="${esc(v.client)}">`)}</div>
    ${f("Description", `<textarea name="description" rows="3">${esc(v.description)}</textarea>`)}
    <fieldset class="field"><legend>Primary thumbnail</legend>
      <input name="thumbnail" placeholder="Image URL" value="${esc(v.thumbnail)}">
      <input type="file" name="thumbnailFile" accept="image/*"><small>A chosen file overrides the URL.</small></fieldset>
    <fieldset class="field"><legend>Gallery (carousel)</legend>
      <textarea name="images" rows="4" placeholder="One image URL per line">${esc((v.images || []).join("\n"))}</textarea>
      <input type="file" name="imageFiles" accept="image/*" multiple><small>Uploaded files are appended after the URLs.</small></fieldset>
    ${tagInput()}`,

  journalism: (v) => `
    ${f("Title *", `<input name="title" required value="${esc(v.title)}">`)}
    ${f("Subheadline", `<input name="dek" value="${esc(v.dek)}">`)}
    <div class="row2">${f("Byline", `<input name="byline" value="${esc(v.byline)}" placeholder="By … · Published on …">`)}${f("Date", `<input type="date" name="date" value="${esc(v.date)}">`)}</div>
    <fieldset class="field"><legend>Hero image</legend>
      <input name="heroImage" placeholder="Image URL" value="${esc(v.heroImage)}">
      <input type="file" name="heroFile" accept="image/*">
      <input name="heroCredit" placeholder="Hero image credit" value="${esc(v.heroCredit)}"></fieldset>
    ${tagInput()}
    <div class="field"><span>Article body</span><div id="editor"></div>
      <small>Insert or paste an image and you'll be asked for its credit.</small></div>
    <label class="check"><input type="checkbox" name="featured" ${v.featured ? "checked" : ""}> Feature as Highlighted Article
      <small>Only one article can be highlighted — saving this un-features the current one.</small></label>`,

  video: (v) => `
    ${f("Title *", `<input name="title" required value="${esc(v.title)}">`)}
    ${f("Role", `<input name="role" value="${esc(v.role)}" placeholder="Editor, Motion Graphics…">`)}
    ${f("Short description", `<textarea name="description" rows="3">${esc(v.description)}</textarea>`)}
    ${f("Video link or embed code *", `<input name="embedUrl" value="${esc(v.embedUrl)}" placeholder="YouTube / Vimeo / TikTok / Instagram / Facebook link, <iframe>, or .mp4 URL">`)}
    <div class="embed-preview" id="preview" aria-live="polite"></div>
    <fieldset class="field"><legend>Platforms</legend><div class="checks">${PLATFORMS.map((p) => `<label class="check"><input type="checkbox" name="platforms" value="${p}" ${(v.platforms || []).includes(p) ? "checked" : ""}> ${p}</label>`).join("")}</div></fieldset>
    <fieldset class="field"><legend>Metrics</legend><div class="row4">${["views", "likes", "shares", "comments"].map((k) => f(k[0].toUpperCase() + k.slice(1), `<input type="number" min="0" name="${k}" value="${v.metrics?.[k] ?? 0}">`)).join("")}</div></fieldset>`,
};

/* ----------------------------------------------- per-type payload builders */
const BUILD = {
  async photography(fd) {
    const thumbFile = fd.get("thumbnailFile");
    const files = fd.getAll("imageFiles").filter((x) => x.size);
    let thumbnail = (fd.get("thumbnail") || "").trim();
    if (thumbFile?.size) thumbnail = await up(thumbFile, "photography");
    const images = [...lines(fd.get("images")), ...(await Promise.all(files.map((x) => up(x, "photography"))))];
    thumbnail ||= images[0] || "";
    if (!thumbnail) throw new Error("Add a thumbnail (file or URL).");
    return { type: "photography", date: fd.get("date"), client: fd.get("client").trim(), description: fd.get("description").trim(), thumbnail, images, tags: state.tags };
  },
  async journalism(fd) {
    const q = state.quill;
    if (!q.getText().trim() && !q.root.querySelector("figure")) throw new Error("The article body is empty.");
    const heroFile = fd.get("heroFile");
    const heroImage = heroFile?.size ? await up(heroFile, "articles") : (fd.get("heroImage") || "").trim();
    return { type: "journalism", date: fd.get("date"), dek: fd.get("dek").trim(), byline: fd.get("byline").trim(), heroImage, heroCredit: fd.get("heroCredit").trim(), bodyHtml: clean(q.root.innerHTML), featured: fd.get("featured") === "on", tags: state.tags };
  },
  async video(fd) {
    const embedUrl = (fd.get("embedUrl") || "").trim();
    if (!embedHTML(embedUrl)) throw new Error("That video link isn't supported. Use a YouTube, Vimeo, TikTok, Instagram or Facebook link, an <iframe> snippet, or an .mp4 URL.");
    return { type: "video", role: fd.get("role").trim(), description: fd.get("description").trim(), embedUrl, platforms: fd.getAll("platforms"), metrics: { views: int(fd.get("views")), likes: int(fd.get("likes")), shares: int(fd.get("shares")), comments: int(fd.get("comments")) } };
  },
};

/* --------------------------------------------------------------- components */
function initTags() {
  const chips = $("#chips"), entry = $("#tagEntry");
  if (!chips) return;
  const draw = () => {
    chips.innerHTML = state.tags.map((t) => `<span class="chip on">${esc(t)}<button type="button" data-rm="${esc(t)}" aria-label="Remove tag ${esc(t)}">×</button></span>`).join("");
  };
  const add = (raw) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t || state.tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    state.tags.push(TAG_SUGGESTIONS.find((s) => s.toLowerCase() === t.toLowerCase()) || t);
    draw();
  };
  entry.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(entry.value); entry.value = ""; } // Enter must not submit the form
  });
  entry.addEventListener("change", () => { add(entry.value); entry.value = ""; });
  chips.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { state.tags = state.tags.filter((x) => x !== b.dataset.rm); draw(); } });
  $(".chip-suggest").addEventListener("click", (e) => { const b = e.target.closest("[data-add]"); if (b) add(b.dataset.add); });
  draw();
}

let figureRegistered = false;
function initEditor(html) {
  /* eslint-disable no-undef */ // Quill is loaded via <script> in admin.html
  if (!figureRegistered) {
    const Block = Quill.import("blots/block/embed");
    class Figure extends Block {
      static create(v) {
        const n = super.create();
        const img = document.createElement("img");
        img.src = v.src; img.alt = v.credit || "";
        const cap = document.createElement("figcaption");
        cap.textContent = v.credit ? `Credit: ${v.credit}` : "";
        n.append(img, cap);
        return n;
      }
      static value(n) {
        return { src: n.querySelector("img")?.getAttribute("src") || "", credit: (n.querySelector("figcaption")?.textContent || "").replace(/^Credit:\s*/, "") };
      }
    }
    Figure.blotName = "figure"; Figure.tagName = "figure";
    Quill.register(Figure);
    figureRegistered = true;
  }
  const Delta = Quill.import("delta");
  const q = new Quill("#editor", {
    theme: "snow",
    placeholder: "Write the article…",
    modules: { toolbar: { container: [[{ header: [2, 3, false] }], ["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], ["link", "image"], ["clean"]], handlers: { image: () => pickImage() } } },
  });
  q.clipboard.addMatcher("FIGURE", (node) => new Delta().insert({ figure: { src: node.querySelector("img")?.getAttribute("src") || "", credit: (node.querySelector("figcaption")?.textContent || "").replace(/^Credit:\s*/, "") } }));
  state.quill = q;

  async function insertFigure(file) {
    const idx = (q.getSelection() || { index: Math.max(0, q.getLength() - 1) }).index;
    try {
      checkImage(file);
      const credit = await askCredit();
      if (credit === null) return;
      toast("Uploading image…", "info", 2000);
      const src = await upload(file, "articles");
      q.insertEmbed(idx, "figure", { src, credit }, "user");
      q.setSelection(idx + 1, 0, "silent");
      toast("Image added");
    } catch (e) { toast(e.message || "Image upload failed", "error"); }
  }
  function pickImage() {
    const i = document.createElement("input");
    i.type = "file"; i.accept = "image/*";
    i.onchange = () => i.files[0] && insertFigure(i.files[0]);
    i.click();
  }
  // Direct image pasting: intercept before Quill inlines a base64 copy.
  q.container.addEventListener("paste", (e) => {
    const file = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
    if (file) { e.preventDefault(); e.stopPropagation(); insertFigure(file); }
  }, true);
  if (html) q.clipboard.dangerouslyPasteHTML(clean(html));
}

function initPreview() {
  const input = $("input[name=embedUrl]"), box = $("#preview");
  if (!input) return;
  let t;
  const draw = () => {
    const v = input.value.trim();
    box.innerHTML = !v ? "" : embedHTML(v) || '<p class="cms-note">Unsupported link — nothing to preview.</p>';
  };
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(draw, 350); });
  draw();
}

/* ------------------------------------------------------------------ views */
function renderForm() {
  const v = state.editing || {};
  state.tags = [...(v.tags || [])];
  state.quill = null;
  const form = $("#postForm");
  form.innerHTML = `<h2>${state.editing ? "Edit post" : "New post"}</h2>${VIEWS[state.type](v)}
    <div class="form-actions"><button type="submit" id="submitBtn" class="btn btn-primary">${state.editing ? "Save changes" : "Publish post"}</button>
    ${state.editing ? '<button type="button" id="cancelEdit" class="btn btn-ghost">Cancel edit</button>' : ""}</div>`;
  initTags();
  if (state.type === "journalism") initEditor(v.bodyHtml);
  if (state.type === "video") initPreview();
  $("#cancelEdit")?.addEventListener("click", () => { state.editing = null; renderForm(); });
}

function renderList() {
  const rows = state.posts.filter((p) => p.type === state.type);
  $("#postList").innerHTML = rows.length
    ? rows.map((p) => `<div class="cms-row"><div><strong>${esc(p.title)}</strong>${p.featured ? ' <span class="badge-feat">★ Highlighted</span>' : ""}<small>${esc([p.date, p.tags.join(", ")].filter(Boolean).join(" · "))}</small></div>
        <div class="cms-row-actions">
          ${p.type === "journalism" ? `<button data-act="feature" data-id="${p.id}" data-on="${!p.featured}">${p.featured ? "Remove highlight" : "Set as highlight"}</button>` : ""}
          <button data-act="edit" data-id="${p.id}">Edit</button><button data-act="delete" data-id="${p.id}" class="danger">Delete</button></div></div>`).join("")
    : '<p class="cms-note">No posts in this category yet.</p>';
}

async function refreshList() {
  try { state.posts = await listPosts(); } catch (e) { toast("Couldn't load posts: " + e.message, "error"); }
  renderList();
}

async function onSubmit(e) {
  e.preventDefault();
  if (state.busy) return;
  const fd = new FormData(e.currentTarget);
  const title = (fd.get("title") || "").trim();
  if (!title) return toast("Title is required.", "error");
  setBusy(true);
  try {
    const post = { title, ...(await BUILD[state.type](fd)) };
    await savePost(post, state.editing?.id);
    toast(state.editing ? "Post updated" : "Post published");
    state.editing = null;
    renderForm();
    await refreshList();
  } catch (err) {
    console.error(err);
    toast(err.message || "Save failed", "error", 6000);
  } finally { setBusy(false); }
}

async function onListClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b || state.busy) return;
  const post = state.posts.find((p) => p.id === b.dataset.id);
  try {
    if (b.dataset.act === "edit") { state.editing = post; renderForm(); $("#postForm").scrollIntoView({ behavior: "smooth" }); }
    if (b.dataset.act === "delete" && confirm(`Delete "${post.title}"? This can't be undone.`)) {
      await deletePost(post.id); toast("Post deleted"); if (state.editing?.id === post.id) { state.editing = null; renderForm(); } await refreshList();
    }
    if (b.dataset.act === "feature") {
      await setFeatured(post.id, b.dataset.on === "true");
      toast(b.dataset.on === "true" ? "Highlight updated" : "Highlight removed"); await refreshList();
    }
  } catch (err) { toast(err.message || "Action failed", "error"); }
}

function mount() {
  root.innerHTML = `
    <div class="seg" role="radiogroup" aria-label="Post category">${TYPES.map((t) => `<label class="seg-item"><input type="radio" name="type" value="${t.id}" ${t.id === state.type ? "checked" : ""}><span>${t.label}</span></label>`).join("")}</div>
    <form id="postForm" class="cms-form" novalidate></form>
    <section class="cms-list"><h2>Existing posts</h2><div id="postList"></div></section>`;
  $(".seg").addEventListener("change", (e) => { if (state.busy) return; state.type = e.target.value; state.editing = null; renderForm(); renderList(); });
  $("#postForm").addEventListener("submit", onSubmit);
  $("#postList").addEventListener("click", onListClick);
  renderForm();
  refreshList();
}

function lock() {
  root.innerHTML = configured
    ? '<div class="cms-locked"><h2>Admin only</h2><p>Sign in to manage your content.</p><button class="btn btn-primary" id="lockLogin">Admin login</button></div>'
    : '<div class="cms-locked"><h2>Backend not configured</h2><p>Add your Supabase URL and anon key to <code>js/config.js</code>, then run <code>schema.sql</code>.</p></div>';
  $("#lockLogin")?.addEventListener("click", openLogin);
}

let mountedFor = null; // token refreshes re-fire auth events — don't wipe an in-progress form
if (!configured) lock();
onAuth((user) => {
  if (!user) { mountedFor = null; return lock(); }
  if (mountedFor === user.id) return;
  mountedFor = user.id;
  mount();
});
