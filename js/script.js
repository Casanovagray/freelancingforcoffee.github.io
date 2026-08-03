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
    /* EDIT ME: to add real photos to an album, set data-images="media/path/1.jpg,media/path/2.jpg"
       on the .album-card in the HTML — comma-separated, no spaces needed. Albums without
       data-images fall back to numbered placeholder slides. */
    const imagePaths = (card.dataset.images || "").split(",").map((s) => s.trim()).filter(Boolean);

    titleEl.textContent = name;

    if (imagePaths.length) {
      slides = imagePaths;
      track.innerHTML = slides
        .map(
          (src, i) => `
        <div class="carousel-slide">
          <img src="${src}" alt="${name} photo ${i + 1}" loading="lazy">
        </div>`
        )
        .join("");
    } else {
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
    }

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
     until you swap in a real photo/screenshot.
     image: optional path to a real photo (e.g. "media/journalism/your-story/hero.jpg") —
     when set, it's used instead of the tint placeholder everywhere this article appears. */
  const articles = [
    {
      id: 0,
      tag: "Anime",
      title: "Is Solo Leveling an Isekai anime? Why fans can’t agree",
      excerpt:
        "Sung Jinwoo levels up like a video game character and fights his way through dungeons — so why do genre purists say it doesn’t count as isekai?",
      date: "Jul 23, 2026",
      byline: "By Ray Daniel Giron · Published on Fanstanza.gg",
      image: "media/journalism/solo-leveling/hero.jpg",
      credit: "Credit: A-1 Pictures, Chugong",
      content: `
        <p class="lede">Is Solo Leveling an isekai anime? This is one of the most argued questions in modern anime fandom, and honestly, both sides have a point.</p>
        <p>Sung Jinwoo gets a glowing status screen, levels up like a video game character, and fights his way through dungeons — these are all classic isekai stereotypes.</p>
        <p>Yet one crucial ingredient is missing: he never actually leaves his own world. So does Solo Leveling qualify as an isekai, or has everyone been using the label a little too loosely?</p>

        <h3>What actually defines an isekai anime?</h3>
        <p>At its core, isekai (Japanese for “different world”) refers to a story where the protagonist is transported from their original world into another one.</p>
        <p>That can happen through reincarnation after death, summoning, magical portals, or even being trapped inside a video game. Most isekai series also share several familiar traits:</p>
        <ul>
          <li>An ordinary or underpowered protagonist</li>
          <li>RPG-inspired mechanics like levels, stats, and skills</li>
          <li>An unfamiliar world the protagonist must learn to survive in</li>
          <li>In many modern series, the protagonist dies before reincarnating with extraordinary abilities</li>
        </ul>
        <p>While these tropes have become synonymous with isekai, the journey to another world is still the defining requirement.</p>

        <h3>Is Solo Leveling an isekai anime?</h3>
        <p>The short answer is no — at least not by the traditional definition of isekai.</p>
        <p>Solo Leveling borrows heavily from the genre, from RPG mechanics and leveling systems to overpowered abilities and dungeon crawling. That's why many viewers assume Solo Leveling is an isekai anime after watching only a few episodes.</p>
        <p>However, one defining feature of isekai is missing: Sung Jinwoo never leaves his own world. Instead, supernatural Gates appear in modern-day Korea, allowing monsters and dungeons to invade reality rather than transporting Jinwoo somewhere else.</p>
        <p>Because of that, Solo Leveling is better described as an isekai-adjacent fantasy or a hunter fantasy rather than a true isekai anime.</p>

        <h3>So why do fans still call Solo Leveling an isekai?</h3>
        <p>This is where things get genuinely, deeply, unnecessarily heated.</p>
        <p>Solo Leveling checks almost every other box. Jinwoo receives a floating status window, completes quests, levels up his stats, unlocks new skills, and grows stronger through a game-like progression system. For many viewers, that's enough to consider Solo Leveling an isekai anime, even if the story technically never leaves Earth.</p>
        <p>Not everyone agrees.</p>
        <p>This question has sparked years of online arguments. A lengthy MyAnimeList thread titled “Solo Leveling is an Isekai well done/written” spans pages of fans debating the definition.</p>
        <p>Some point to YouTuber Gigguk's description of the series as “isekai in disguise.” Others argue it's actually a reverse isekai because the monsters invade Jinwoo's world instead.</p>
        <p>Part of the confusion also comes from the series' origins. Many newcomers even ask, “Is Solo Leveling a Korean anime?” The answer is also no — not exactly.</p>
        <p>Solo Leveling began as a South Korean web novel by Chugong before being adapted into a webtoon by the late Jang Sung-rak (DUBU) through Redice Studio. The anime adaptation, however, is produced in Japan, which is why it retains the anime label despite adapting a Korean IP.</p>
        <p>Likewise, if you're wondering which studio animated Solo Leveling, it was A-1 Pictures, the Japanese studio behind Sword Art Online, Kaguya-sama: Love Is War, and Blue Exorcist. Directed by Shunsuke Nakashige, the adaptation preserves the Korean setting and characters while bringing them to life through Japanese animation.</p>
        <p>Understanding the production history actually reinforces why the genre debate exists. Although Solo Leveling is rooted in Korean storytelling and modern Seoul, it borrows heavily from Japanese light novel and isekai conventions, making it easy to see why many fans instinctively group it with the genre.</p>
        <p>By the strict genre definition, though, Solo Leveling does not qualify as an isekai anime. Jinwoo continues living in Seoul with his family, and the Gates exist as anomalies within his own world rather than transporting him elsewhere.</p>
        <p>That places Solo Leveling closer to portal fantasy or the broader hunter genre. It shares much of isekai's DNA without crossing the genre's defining line.</p>

        <h3>Final verdict</h3>
        <p>So, is Solo Leveling an isekai anime? It depends on how strictly you define the genre.</p>
        <p>Casual viewers will probably continue calling it an isekai because of its leveling system, quests, and RPG mechanics. Genre purists, however, point to one missing ingredient: Sung Jinwoo never leaves his own world.</p>
        <p>That's why Solo Leveling occupies a unique middle ground — close enough to isekai to spark endless debates, but different enough to stand as its own kind of fantasy.</p>
      `,
    },
    {
      id: 1,
      tag: "Esports",
      title: "Inside the grassroots scene rebuilding local competitive gaming",
      excerpt: "A look at the organisers, venues and players keeping community tournaments alive.",
      date: "Jul 12, 2026",
      tint: "ph-1",
      content:
        "<p>Replace this paragraph with your real article text. Write two or three paragraphs covering the story, quotes from sources, and any context readers need. Keep paragraphs short for readability on mobile.</p>",
    },
    {
      id: 2,
      tag: "Feature",
      title: "What it takes to freelance full-time in a small city",
      excerpt: "Notes from a year of chasing bylines, invoices, and reliable wifi.",
      date: "Jun 28, 2026",
      tint: "ph-2",
      content:
        "<p>Replace this paragraph with your real article text. This is placeholder body copy — swap it out for the actual reporting, interviews, and analysis for this piece.</p>",
    },
    {
      id: 3,
      tag: "Interview",
      title: "A conversation with a local photojournalist on access and trust",
      excerpt: "On building relationships with sources before ever raising a camera.",
      date: "Jun 14, 2026",
      tint: "ph-3",
      content:
        "<p>Replace this paragraph with your real article text. Add the full interview transcript or narrative summary here.</p>",
    },
    {
      id: 4,
      tag: "Report",
      title: "Tracking a season of change at the community sports league",
      excerpt: "Six months following coaches and players through wins, losses, and everything after.",
      date: "May 30, 2026",
      tint: "ph-4",
      content: "<p>Replace this paragraph with your real article text.</p>",
    },
    {
      id: 5,
      tag: "Opinion",
      title: "Why local news still needs someone on the ground",
      excerpt: "A case for slower, more deliberate reporting in a fast-news world.",
      date: "May 09, 2026",
      tint: "ph-5",
      content: "<p>Replace this paragraph with your real article text.</p>",
    },
  ];

  let featuredIndex = 0;

  /* Renders a real photo when article.image is set, otherwise the tint placeholder. */
  function visualHTML(a) {
    return a.image
      ? `<img src="${a.image}" alt="${a.title}" loading="lazy">`
      : `<div class="tint ${a.tint}"></div>
         <div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg></div>`;
  }

  function renderFeatured() {
    if (!featuredEl) return;
    const a = articles[featuredIndex];
    featuredEl.innerHTML = `
      <div class="featured-visual">
        ${visualHTML(a)}
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
          <div class="thumb">${visualHTML(a)}</div>
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
      <div class="article-hero">
        ${visualHTML(a)}
        ${a.credit ? `<span class="credit">${a.credit}</span>` : ""}
      </div>
      <div class="article-content">
        <span class="tag">${a.tag}</span>
        <h2>${a.title}</h2>
        ${a.byline ? `<span class="byline">${a.byline}</span>` : ""}
        <span class="date">${a.date}</span>
        ${a.content}
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
