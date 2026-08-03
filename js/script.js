/* =========================================================
   Freelancing for coffee — shared behaviour
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initNavDrawer();
  setActiveLink();
  initPhotographyCarousel();
  initJournalism();
});

/* ---------------- Nav drawer ---------------- */
function initNavDrawer() {
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-drawer]");
  const overlay = document.querySelector("[data-drawer-overlay]");
  if (!burger || !drawer || !overlay) return;

  const links = drawer.querySelectorAll(".drawer-links li");
  links.forEach((li, i) => li.style.setProperty("--i", i));

  const open = () => {
    burger.classList.add("is-open");
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    burger.classList.remove("is-open");
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  burger.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? close() : open();
  });
  overlay.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* ---------------- Active nav link ---------------- */
function setActiveLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".drawer-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
}

/* ---------------- Photography: album carousel ---------------- */
function initPhotographyCarousel() {
  const cards = document.querySelectorAll("[data-album]");
  const overlay = document.querySelector("[data-carousel-overlay]");
  if (!cards.length || !overlay) return;

  const track = overlay.querySelector("[data-carousel-track]");
  const dotsWrap = overlay.querySelector("[data-carousel-dots]");
  const titleEl = overlay.querySelector("[data-carousel-title]");
  const countEl = overlay.querySelector("[data-carousel-count]");
  const prevBtn = overlay.querySelector(".carousel-arrow.prev");
  const nextBtn = overlay.querySelector(".carousel-arrow.next");
  const closeBtn = overlay.querySelector(".modal-close");

  let slides = [];
  let index = 0;

  function render() {
    track.style.transform = `translateX(-${index * 100}%)`;
    countEl.textContent = `${index + 1} / ${slides.length}`;
    dotsWrap.querySelectorAll("button").forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function openAlbum(card) {
    const name = card.dataset.album;
    const count = parseInt(card.dataset.count || "6", 10);
    const tint = card.querySelector(".ph")?.className.match(/ph-\d/)?.[0] || "ph-1";

    titleEl.textContent = name;
    slides = Array.from({ length: count }, (_, i) => i + 1);
    track.innerHTML = slides
      .map(
        (n) => `
      <div class="carousel-slide">
        <div class="tint ${tint}" style="position:absolute;inset:0;"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="position:relative;color:#fff;"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>
        <span class="tag" style="position:relative;">${name} — photo ${n} (replace with real image)</span>
      </div>`
      )
      .join("");
    dotsWrap.innerHTML = slides.map((_, i) => `<button aria-label="Go to photo ${i + 1}"></button>`).join("");
    dotsWrap.querySelectorAll("button").forEach((d, i) => d.addEventListener("click", () => goTo(i)));

    index = 0;
    render();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  cards.forEach((card) => card.addEventListener("click", () => openAlbum(card)));
  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });
}

/* ---------------- Journalism: featured + article modal ---------------- */
function initJournalism() {
  const featuredEl = document.querySelector("[data-featured]");
  const sidebarEl = document.querySelector("[data-article-list]");
  if (!featuredEl && !sidebarEl) return;

  /* EDIT ME — replace with your real articles.
     tint: any of ph-1..ph-6 (see style.css) used as a colour placeholder
     until you swap in a real photo/screenshot. */
  const articles = [
    {
      id: 1,
      tag: "Esports",
      title: "Inside the grassroots scene rebuilding local competitive gaming",
      excerpt: "A look at the organisers, venues and players keeping community tournaments alive.",
      date: "Jul 12, 2026",
      tint: "ph-1",
      content:
        "Replace this paragraph with your real article text. Write two or three paragraphs covering the story, quotes from sources, and any context readers need. Keep paragraphs short for readability on mobile.",
    },
    {
      id: 2,
      tag: "Feature",
      title: "What it takes to freelance full-time in a small city",
      excerpt: "Notes from a year of chasing bylines, invoices, and reliable wifi.",
      date: "Jun 28, 2026",
      tint: "ph-2",
      content:
        "Replace this paragraph with your real article text. This is placeholder body copy — swap it out for the actual reporting, interviews, and analysis for this piece.",
    },
    {
      id: 3,
      tag: "Interview",
      title: "A conversation with a local photojournalist on access and trust",
      excerpt: "On building relationships with sources before ever raising a camera.",
      date: "Jun 14, 2026",
      tint: "ph-3",
      content:
        "Replace this paragraph with your real article text. Add the full interview transcript or narrative summary here.",
    },
    {
      id: 4,
      tag: "Report",
      title: "Tracking a season of change at the community sports league",
      excerpt: "Six months following coaches and players through wins, losses, and everything after.",
      date: "May 30, 2026",
      tint: "ph-4",
      content: "Replace this paragraph with your real article text.",
    },
    {
      id: 5,
      tag: "Opinion",
      title: "Why local news still needs someone on the ground",
      excerpt: "A case for slower, more deliberate reporting in a fast-news world.",
      date: "May 09, 2026",
      tint: "ph-5",
      content: "Replace this paragraph with your real article text.",
    },
  ];

  let featuredIndex = 0;

  function renderFeatured() {
    if (!featuredEl) return;
    const a = articles[featuredIndex];
    featuredEl.innerHTML = `
      <div class="featured-visual">
        <div class="tint ${a.tint}"></div>
        <div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg></div>
      </div>
      <button class="featured-arrow prev" aria-label="Previous featured story">&#8592;</button>
      <button class="featured-arrow next" aria-label="Next featured story">&#8594;</button>
      <div class="featured-meta">
        <span class="tag">${a.tag}</span>
        <h2>${a.title}</h2>
        <p>${a.excerpt}</p>
        <span class="date">${a.date}</span>
      </div>
    `;
    featuredEl.querySelector(".featured-visual").addEventListener("click", () => openArticle(a.id));
    featuredEl.querySelector(".featured-meta").addEventListener("click", () => openArticle(a.id));
    featuredEl.querySelector(".prev").addEventListener("click", (e) => {
      e.stopPropagation();
      featuredIndex = (featuredIndex - 1 + articles.length) % articles.length;
      renderFeatured();
    });
    featuredEl.querySelector(".next").addEventListener("click", (e) => {
      e.stopPropagation();
      featuredIndex = (featuredIndex + 1) % articles.length;
      renderFeatured();
    });
  }

  function renderSidebar() {
    if (!sidebarEl) return;
    sidebarEl.innerHTML =
      `<h4>More stories</h4>` +
      articles
        .map(
          (a) => `
        <div class="article-row" data-id="${a.id}">
          <div class="thumb"><div class="tint ${a.tint}"></div></div>
          <div class="info">
            <h5>${a.title}</h5>
            <span>${a.tag} · ${a.date}</span>
          </div>
        </div>`
        )
        .join("");
    sidebarEl.querySelectorAll(".article-row").forEach((row) => {
      row.addEventListener("click", () => openArticle(parseInt(row.dataset.id, 10)));
    });
  }

  const articleModal = document.querySelector("[data-article-modal]");
  function openArticle(id) {
    if (!articleModal) return;
    const a = articles.find((x) => x.id === id);
    if (!a) return;
    articleModal.querySelector("[data-article-body]").innerHTML = `
      <div class="article-hero"><div class="tint ${a.tint}"></div></div>
      <div class="article-content">
        <span class="tag">${a.tag}</span>
        <h2>${a.title}</h2>
        <span class="date">${a.date}</span>
        <p>${a.content}</p>
        <p>Add further paragraphs, pull quotes, or images as needed — this modal scrolls.</p>
      </div>
    `;
    articleModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  if (articleModal) {
    const closeBtn = articleModal.querySelector(".modal-close");
    closeBtn.addEventListener("click", () => {
      articleModal.classList.remove("is-open");
      document.body.style.overflow = "";
    });
    articleModal.addEventListener("click", (e) => {
      if (e.target === articleModal) {
        articleModal.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        articleModal.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
  }

  renderFeatured();
  renderSidebar();
}
