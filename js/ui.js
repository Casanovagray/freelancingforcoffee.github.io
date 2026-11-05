// Shared helpers: escaping, sanitising, toasts, number formatting, video embeds.
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm";

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ENT[c]);
export const clean = (html) => DOMPurify.sanitize(html ?? "");

export function toast(msg, type = "success", ms = 4000) {
  let host = document.getElementById("toasts");
  if (!host) {
    host = document.createElement("div");
    host.id = "toasts";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.append(host);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  host.append(t);
  setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export function fmtNum(n) {
  n = Number(n) || 0;
  const k = (v, u) => v.toFixed(1).replace(/\.0$/, "") + u;
  return n >= 1e6 ? k(n / 1e6, "M") : n >= 1e3 ? k(n / 1e3, "K") : String(n);
}

export function fmtDate(d) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
}

/** Turns a pasted link (or <iframe> snippet) into a safe embed descriptor, or null. */
export function toEmbed(input) {
  let url = String(input || "").trim();
  const frame = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (frame) url = frame[1];
  if (url.startsWith("//")) url = "https:" + url;
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const path = u.pathname;
  let m;
  if (/\.(mp4|webm|ogg)$/i.test(path)) return { kind: "video", src: u.href };
  if (host === "youtu.be" && (m = path.match(/^\/([\w-]{11})/))) return { kind: "iframe", src: `https://www.youtube.com/embed/${m[1]}` };
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
    const id = u.searchParams.get("v") || (m = path.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)) && m[1];
    if (id && /^[\w-]{11}$/.test(id)) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  if ((host === "vimeo.com" || host === "player.vimeo.com") && (m = path.match(/(\d{6,})/))) return { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}` };
  if (host === "tiktok.com" && (m = path.match(/\/video\/(\d+)/))) return { kind: "iframe", src: `https://www.tiktok.com/embed/v2/${m[1]}` };
  if (host === "instagram.com" && (m = path.match(/\/(reel|p)\/([\w-]+)/))) return { kind: "iframe", src: `https://www.instagram.com/${m[1]}/${m[2]}/embed` };
  if (host === "facebook.com" || host === "fb.watch") return { kind: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.href)}` };
  return null;
}

export function embedHTML(input) {
  const e = toEmbed(input);
  if (!e) return "";
  return e.kind === "video"
    ? `<video src="${esc(e.src)}" controls preload="metadata"></video>`
    : `<iframe src="${esc(e.src)}" title="Video embed" loading="lazy" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>`;
}
