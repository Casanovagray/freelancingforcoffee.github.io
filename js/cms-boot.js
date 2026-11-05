// Public-site CMS layer. Every renderer is a no-op unless the backend is configured AND
// returns posts, so the existing static content remains the fallback.
import "./auth.js";
import { configured, listPosts } from "./api.js";
import { esc, clean, fmtNum, fmtDate, embedHTML } from "./ui.js";

/* ---------- Journalism: CMS articles in the shape script.js expects ---------- */
export async function journalismArticles() {
  if (!configured) return [];
  const posts = await listPosts("journalism");
  return posts
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map((p) => ({
      id: p.id,
      featured: p.featured,
      tag: esc(p.tags[0] || "Journalism"),
      title: esc(p.title),
      dek: esc(p.dek),
      date: esc(fmtDate(p.date)),
      byline: esc(p.byline),
      image: esc(p.heroImage),
      credit: p.heroCredit ? esc(p.heroCredit) : "",
      tint: "ph-1",
      content: clean(p.bodyHtml),
    }));
}

/* ---------- Photography: gallery + tag filter ---------- */
const TAG_ORDER = ["Events", "Creative", "Cosplay"];

function applyFilter(grid, tag) {
  const cards = [...grid.children];
  const match = (c) => tag === "All" || c.dataset.tags.split("|").includes(tag);
  cards.forEach((c) => !match(c) && c.classList.add("is-out"));        // 1. fade out non-matches
  setTimeout(() => {
    cards.forEach((c) => (c.hidden = !match(c)));                      // 2. reflow the grid
    requestAnimationFrame(() => cards.forEach((c) => match(c) && c.classList.remove("is-out"))); // 3. fade in matches
  }, 220);
}

async function photography() {
  const grid = document.querySelector(".photo-grid");
  if (!grid || !configured) return;
  let posts;
  try { posts = await listPosts("photography"); } catch (e) { return console.warn("Photography load failed:", e); }
  if (!posts.length) return;

  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => {
    const ia = TAG_ORDER.indexOf(a), ib = TAG_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  grid.innerHTML = posts.map((p, i) => {
    const imgs = (p.images?.length ? p.images : [p.thumbnail]).filter(Boolean);
    const count = `${imgs.length} photo${imgs.length === 1 ? "" : "s"}`;
    return `<article class="album-card anim-fade-up" style="--i:${i}" tabindex="0" role="button"
        data-album="${esc(p.title)}" data-tags="${esc(p.tags.join("|"))}"
        data-images="${esc(imgs.map((u) => u.replace(/,/g, "%2C")).join(","))}">
      <img class="thumb-img" src="${esc(p.thumbnail || imgs[0])}" alt="${esc(p.title)}" loading="lazy">
      <div class="info"><h3>${esc(p.title)}</h3><span>${esc([p.client, count].filter(Boolean).join(" · "))}</span></div>
    </article>`;
  }).join("");

  if (tags.length) {
    const bar = document.createElement("div");
    bar.className = "filter-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Filter albums by tag");
    bar.innerHTML = ["All", ...tags].map((t, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tag]");
      if (!b) return;
      bar.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      applyFilter(grid, b.dataset.tag);
    });
    grid.before(bar);
  }
}

/* ---------- Editing: video blocks ---------- */
async function editing() {
  const host = document.querySelector(".video-block")?.parentElement;
  if (!host || !configured) return;
  let videos;
  try { videos = await listPosts("video"); } catch (e) { return console.warn("Video load failed:", e); }
  if (!videos.length) return;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  host.innerHTML = videos.map((v) => `
    <div class="video-block">
      <div class="video-embed">${embedHTML(v.embedUrl) || '<div class="embed-placeholder"><p>Video unavailable</p></div>'}</div>
      <div class="stats-card">
        <div class="pill-row">${(v.platforms || []).map((p) => `<span class="platform-pill">${esc(p)}</span>`).join("")}</div>
        <h4>Performance</h4>
        ${["views", "likes", "shares", "comments"].map((k) => `<div class="stat-row"><span class="label">${cap(k)}</span><span class="value">${fmtNum(v.metrics?.[k])}</span></div>`).join("")}
      </div>
      <div class="video-desc">
        <h3>${esc(v.title)}</h3>
        ${v.role ? `<span class="eyebrow">${esc(v.role)}</span>` : ""}
        <p>${esc(v.description)}</p>
      </div>
    </div>`).join("");
}

photography();
editing();
