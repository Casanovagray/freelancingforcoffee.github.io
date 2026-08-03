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
      dek: "Why does everyone call this isekai?",
      date: "Jul 23, 2026",
      byline: "By Ray Daniel Giron · Published on Fanstanza.gg",
      image: "media/journalism/solo-leveling/hero.jpg",
      credit: "Credit: A-1 Pictures, Chugong",
      content: `
        <p class="lede">Is Solo Leveling an isekai anime? This is one of the most argued questions in modern anime fandom, and honestly, both sides have a point.</p>
        <p>Sung Jinwoo gets a glowing status screen, levels up like a video game character, and fights his way through dungeons — these are all classic isekai stereotypes.</p>
        <p>Yet one crucial ingredient is missing: he never actually leaves his own world. So does Solo Leveling qualify as an isekai, or has everyone been using the label a little too loosely?</p>

        <h3>What actually defines an isekai anime?</h3>
        <figure><img src="media/journalism/solo-leveling/body-2.jpg" alt="Isekai anime still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>At its core, isekai (Japanese for “different world”) refers to a story where the protagonist is transported from their original world into another one.</p>
        <p>That can happen through reincarnation after death, summoning, magical portals, or even being trapped inside a video game. Most isekai series also share several familiar traits:</p>
        <ul>
          <li>An ordinary or underpowered protagonist</li>
          <li>RPG-inspired mechanics like levels, stats, and skills</li>
          <li>An unfamiliar world the protagonist must learn to survive in</li>
          <li>In many modern series, the protagonist dies before reincarnating with extraordinary abilities</li>
        </ul>
        <figure><img src="media/journalism/solo-leveling/body-3.jpg" alt="Isekai anime still" loading="lazy"><figcaption>Credit: A-1 Pictures / Aniplex</figcaption></figure>
        <p>While these tropes have become synonymous with isekai, the journey to another world is still the defining requirement.</p>

        <h3>Is Solo Leveling an isekai anime?</h3>
        <p>The short answer is no — at least not by the traditional definition of isekai.</p>
        <p>Solo Leveling borrows heavily from the genre, from RPG mechanics and leveling systems to overpowered abilities and dungeon crawling. That's why many viewers assume Solo Leveling is an isekai anime after watching only a few episodes.</p>
        <figure><img src="media/journalism/solo-leveling/body-4.jpg" alt="Solo Leveling still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>However, one defining feature of isekai is missing: Sung Jinwoo never leaves his own world. Instead, supernatural Gates appear in modern-day Korea, allowing monsters and dungeons to invade reality rather than transporting Jinwoo somewhere else.</p>
        <p>Because of that, Solo Leveling is better described as an isekai-adjacent fantasy or a hunter fantasy rather than a true isekai anime.</p>

        <h3>So why do fans still call Solo Leveling an isekai?</h3>
        <p>This is where things get genuinely, deeply, unnecessarily heated.</p>
        <figure><img src="media/journalism/solo-leveling/body-5.jpg" alt="Solo Leveling still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>Solo Leveling checks almost every other box. Jinwoo receives a floating status window, completes quests, levels up his stats, unlocks new skills, and grows stronger through a game-like progression system. For many viewers, that's enough to consider Solo Leveling an isekai anime, even if the story technically never leaves Earth.</p>
        <p>Not everyone agrees.</p>
        <p>This question has sparked years of online arguments. A lengthy MyAnimeList thread titled “Solo Leveling is an Isekai well done/written” spans pages of fans debating the definition.</p>
        <p>Some point to YouTuber Gigguk's description of the series as “isekai in disguise.” Others argue it's actually a reverse isekai because the monsters invade Jinwoo's world instead.</p>
        <figure><img src="media/journalism/solo-leveling/body-6.jpg" alt="Solo Leveling still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>Part of the confusion also comes from the series' origins. Many newcomers even ask, “Is Solo Leveling a Korean anime?” The answer is also no — not exactly.</p>
        <p>Solo Leveling began as a South Korean web novel by Chugong before being adapted into a webtoon by the late Jang Sung-rak (DUBU) through Redice Studio. The anime adaptation, however, is produced in Japan, which is why it retains the anime label despite adapting a Korean IP.</p>
        <p>Likewise, if you're wondering which studio animated Solo Leveling, it was A-1 Pictures, the Japanese studio behind Sword Art Online, Kaguya-sama: Love Is War, and Blue Exorcist. Directed by Shunsuke Nakashige, the adaptation preserves the Korean setting and characters while bringing them to life through Japanese animation.</p>
        <figure><img src="media/journalism/solo-leveling/body-7.jpg" alt="Solo Leveling still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>Understanding the production history actually reinforces why the genre debate exists. Although Solo Leveling is rooted in Korean storytelling and modern Seoul, it borrows heavily from Japanese light novel and isekai conventions, making it easy to see why many fans instinctively group it with the genre.</p>
        <p>By the strict genre definition, though, Solo Leveling does not qualify as an isekai anime. Jinwoo continues living in Seoul with his family, and the Gates exist as anomalies within his own world rather than transporting him elsewhere.</p>
        <p>That places Solo Leveling closer to portal fantasy or the broader hunter genre. It shares much of isekai's DNA without crossing the genre's defining line.</p>

        <h3>Final verdict</h3>
        <figure><img src="media/journalism/solo-leveling/body-8.jpg" alt="Solo Leveling still" loading="lazy"><figcaption>Credit: A-1 Pictures, Chugong</figcaption></figure>
        <p>So, is Solo Leveling an isekai anime? It depends on how strictly you define the genre.</p>
        <p>Casual viewers will probably continue calling it an isekai because of its leveling system, quests, and RPG mechanics. Genre purists, however, point to one missing ingredient: Sung Jinwoo never leaves his own world.</p>
        <p>That's why Solo Leveling occupies a unique middle ground — close enough to isekai to spark endless debates, but different enough to stand as its own kind of fantasy.</p>
      `,
    },
    {
      id: 1,
      tag: "Gaming",
      title: "Book a date with your very own life-size Gardevoir plush for Valentine's Day",
      dek: "Hear me out.",
      date: "Feb 3, 2025",
      byline: "By Ray Daniel Giron · Published on Oneesports.gg",
      image: "media/journalism/gardevoir/1.jpg",
      credit: "Credit: Pokemon Center Japan",
      content: `
        <p>Cuddle up with a life-size Gardevoir plush! Pokemon Center Japan is releasing this adorable plush just in time for Valentine's Day, the perfect gift for any Pokemon lover.</p>
        <p>Gardevoir is a Psychic/Fairy type Pokemon known for its “beauty” and humanoid figure.</p>
        <p>This Pokemon has undoubtedly inspired countless fan art and memes and is now being immortalized as an actual Pokemon plushie.</p>
        <p>While the height might be accurate for an in-game XXS Gardevoir, this collectible is a conversation starter that's bound to spark even more memes across the internet.</p>

        <h3>Life-size Gardevoir plush release date and price</h3>
        <figure><img src="media/journalism/gardevoir/2.jpg" alt="Gardevoir plush screenshot" loading="lazy"><figcaption>Screenshot by Ray Daniel Giron/ONE Esports</figcaption></figure>
        <p>The Gardevoir plush will be available for purchase exclusively at Japanese Pokémon Centers beginning February 6, 2025, priced at ¥49,500 (approximately US$320).</p>
        <p>Although this plush cannot stand on its own, it impressively measures at 160 cm tall, the same size as a XXS or XS Gardevoir in-game.</p>
        <p>Although there are currently no plans for an international release (yet), dedicated collectors outside Japan are already scouring the internet to get their hands on one.</p>
        <p>Whether it's destined to be the perfect Valentine's Day gift or a comforting companion on lonely nights, the scarcity of this plush has only fueled its desirability.</p>
        <p>This life-size Gardevoir will certainly be one of the unexpected highlights of 2025. After all, who needs a partner when you have a life-size Gardevoir to keep you company and remind you that sometimes, the best love is self-love?</p>
      `,
    },
    {
      id: 2,
      tag: "Reviews",
      title: "Amnesia: The Bunker Review – Forget Me Not",
      dek: "At least I felt safer with my gun knowing there's a monster under the bed.",
      date: "Jun 6, 2023",
      byline: "By Ray Daniel Giron · Published on Twinfinite.net",
      image: "media/journalism/amnesia-bunker/1.png",
      credit: "Screenshot by Ray Daniel Giron",
      content: `
        <p>As I immersed myself in the realistic horrors of World War I while playing Amnesia: The Bunker for review. The dread, the fear of the unknown, and curiosity made me finish the game, making me want to try the most challenging difficulty even more.</p>
        <p>As an avid fan of horror games, especially one who's also a longtime Amnesia fan, the game takes a unique approach as you embody a French soldier who found his way into a bunker filled with mysteries of the unknown. After getting my hands on the game, my caffeine-induced anxiety made me stay on guard while I uncovered the secrets of the mysterious Bunker.</p>
        <p>The Amnesia franchise made its comeback after three years, and this may be one of the best single-player horror games to date.</p>
        <figure><img src="media/journalism/amnesia-bunker/2.png" alt="Amnesia: The Bunker screenshot" loading="lazy"><figcaption>Image Source: Frictional Games via Twinfinite</figcaption></figure>
        <p>The game takes place during World War 1. You play as a French soldier who finds himself in an abandoned bunker's infirmary. Like the previous games, your character yet again suffers from amnesia with little memory of what happened in the earlier events of the conflict. As your character gathers resources within the bunker, he gradually uncovers the secrets hidden within. These include unsettling and inhumane experiments, corpses, and a lurking monster that becomes drawn to any noise. You'll learn more about the game's lore from the diary entries scattered across the map.</p>
        <p>The gameplay feels similar to the previous games, but this time the game gives you a gun at the beginning of your gameplay. Yes, a weapon. At first blush, this might lull you into thinking, “Great, I feel safer now.” Wrong! From the moment the monster that lurks within that bunker appears throughout the game, you'll never be able to shake off that sense of dread.</p>
        <p>The game will make you feel at ease, giving you the proper exploration tools, as — I kid you not — it also gives you a rechargeable light source, but it makes a lot of noise when you charge it and attracts the monster.</p>
        <figure><img src="media/journalism/amnesia-bunker/3.png" alt="Amnesia: The Bunker screenshot" loading="lazy"><figcaption>Image Source: Frictional Games via Twinfinite</figcaption></figure>
        <p>If you're new to the Amnesia franchise, don't worry because the story isn't connected to the previous games. The Bunker presents players with a linear story giving you clues on how to progress further within the game. Amnesia: The Bunker does not have an auto-save feature. Instead, players have access to a save room where they can manually save their progress by interacting with the save lamp. Just ensure you save often, as you will otherwise lose your progress if you die.</p>
        <p>In the game, players will encounter puzzles that incorporate an element of randomness. Multiple game elements, such as 4-digit codes, resources, and traps, are randomized with every playthrough. This feature adds an exciting and unpredictable aspect to the gameplay. The game map includes two “key items,” the lighter and the gas mask. While these items are unnecessary to complete the game, they offer players new approaches to overcoming obstacles. The codes to unlock the lockers containing these items remain fixed in the same location during the first playthrough. However, these codes will be found near a random corpse for subsequent playthroughs.</p>
        <figure><img src="media/journalism/amnesia-bunker/4.png" alt="Amnesia: The Bunker screenshot" loading="lazy"><figcaption>Image Source: Frictional Games via Twinfinite</figcaption></figure>
        <p>Finally, let's talk about the graphics. The game's overall visuals and the map's design, including its unnerving atmosphere, gives the creeps and chills. The added eerie background sound while navigating into the possible dangers of jumpscares gives you unsettling encounters during the game.</p>
        <p>Amnesia: The Bunker felt like it was somehow different from its predecessors. The puzzle-heavy horror game and a hint of resource management give the anxiety of suddenly plunging into danger. I felt like the franchise made a different approach but at the end of the day it's worth the adventure.</p>

        <div class="review-score">
          <div class="score-badge">4/5</div>
          <div class="review-score-body">
            <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</div>
            <h4>Amnesia: The Bunker Review</h4>
            <p>Amnesia: The Bunker felt like it was somehow different from its predecessors. The puzzle-heavy horror game and a hint of resource management give the anxiety of suddenly plunging into danger. I felt like the franchise made a different approach but in the end of the day it's worth the adventure.</p>
          </div>
        </div>

        <div class="pros-cons">
          <div class="col pros">
            <h4>Pros</h4>
            <ul>
              <li>Anxiety inducing horror atmosphere.</li>
              <li>Resource management.</li>
              <li>Randomized puzzles.</li>
              <li>Rechargeable flashlight.</li>
            </ul>
          </div>
          <div class="col cons">
            <h4>Cons</h4>
            <ul>
              <li>No autosave feature</li>
            </ul>
          </div>
        </div>

        <p class="disclosure">A copy of this game was provided by the publisher for review. Reviewed on PC, PlayStation, Xbox.</p>
      `,
    },
    {
      id: 3,
      tag: "Gaming",
      title: "Return of the Ancients update overhauls Path of Exile 2's endgame with new Ascendancies",
      dek: "Big changes starts here.",
      date: "May 8, 2026",
      byline: "By Ray Daniel Giron · Published on Fanstanza.gg",
      image: "media/journalism/poe2-return-of-ancients/1.jpg",
      credit: "Credits: Grinding Gear Games",
      content: `
        <p>The ancient remnants of Wraeclast hum with forgotten magik as the lost art of Ezomyte Runesmithing is brought back to the light. A power buried for millennia now awakens the restless dead, forcing exiles to harness the raw energy of Verisium to rewrite the rules of reality.</p>
        <p>This massive Path of Exile 2: Return of the Ancients update introduces the Runes of Aldur League, two new Ascendancy classes, and five fully fleshed-out endgame storylines featuring dedicated progression hubs and Pinnacle bosses.</p>
        <p>Here is everything you need to know about the massive additions coming to Wraeclast.</p>

        <h3>Path of Exile 2: Return of the Ancients update release date and platforms</h3>
        <p>Path of Exile 2: Return of the Ancients releases on Tuesday, May 29, 2026 on PC, Steam, PlayStation, Xbox, and the Epic Games Store.</p>
        <p>New players may join at any time via an Early Access Supporter Pack.</p>

        <h3>Path of Exile 2 New League: Runes of Aldur</h3>
        <figure><img src="media/journalism/poe2-return-of-ancients/2.jpg" alt="Runes of Aldur league" loading="lazy"><figcaption>Credits: Grinding Gear Games</figcaption></figure>
        <p>The Runes of Aldur league introduces players to Farrow, a young blacksmith who helps uncover the ancient Kalguuran origins of Ezomyte Runesmithing.</p>
        <p>Throughout Wraeclast, players will discover Ezomyte Remnants that can be inscribed with symbols to craft powerful items.</p>
        <p>This power comes with a high risk high reward system. Activating a Remnant reanimates nearby undead and empowers them based on the specific runes you used.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Runes</th><th>Effect</th><th>Reward</th></tr></thead>
          <tbody>
            <tr><td>Fire-aligned Runes</td><td>Grants enemies dangerous fire-based abilities</td><td>Can craft specific elemental outcomes or basic currency.</td></tr>
            <tr><td>Moon-aligned Runes</td><td>Introduces celestial hazards such as falling lunar beams.</td><td>Can create socketable runes with specific properties.</td></tr>
            <tr><td>Multiple/Complex Runes</td><td>Triggers additional waves of increasingly empowered enemies.</td><td>Enables the creation of much rarer items and meta-crafting outcomes.</td></tr>
          </tbody>
        </table></div>
        <p>By collecting Verisium, players can unlock Runic Ward, a new defensive resource that acts as a secondary life pool and fuels flexible, class-agnostic Kalguuran magic abilities instead of using mana.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Skills</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td>Triskellion Cascade</td><td>Triggers your next spell multiple times in a Triskellion pattern.</td></tr>
            <tr><td>Frostflame Nova</td><td>Transforms an existing ignite on enemies into Frostfire, building up freeze while burning them.</td></tr>
            <tr><td>Mark of Repulsion</td><td>Creates a mark capable of pushing nearby enemies away.</td></tr>
          </tbody>
        </table></div>
        <p>Players also gain access to over 100 new crafting runes, including elemental conversion runes and Masterwork Runes that upgrade tiers.</p>

        <h3>Path of Exile 2: New Ascendancy Classes</h3>
        <p>Two new Ascendancy classes arrive to reshape combat, offering distinct playstyles for the Huntress and the Monk.</p>

        <h3>The Spirit Walker</h3>
        <figure><img src="media/journalism/poe2-return-of-ancients/3.jpg" alt="The Spirit Walker Ascendancy" loading="lazy"><figcaption>Credits: Grinding Gear Games</figcaption></figure>
        <p>Deeply attuned to the untamed wilds of Wraeclast, the Spirit Walker channels the feral power of Azmerian animal spirits.</p>
        <p>By communing with the Primal, Vivid, and Wild Wisps, this Ascendancy allows the Huntress to command the sacred forces of nature to obliterate her foes and even tame the most ferocious beast bosses to fight by her side.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Ability</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td>The Stag</td><td>Summons Stampedes when you attack.</td></tr>
            <tr><td>The Owl</td><td>Grants "Boons" in the form of feathers, adding extra projectiles and enhanced projectile speed to your next skill.</td></tr>
            <tr><td>The Bear</td><td>Summons a giant bear companion to your side that mauls, slams, leaps, and intimidatingly roars to debuff enemies.</td></tr>
            <tr><td>Sacred Wisps</td><td>A hidden power unlocked by using all three wisps. It enhances all animal companions (e.g., the Bear takes some of the damage you take and grants life regen, Stags become more aggressive, and Owl skills leave a trail of "Soaring ground").</td></tr>
            <tr><td>Idolatry</td><td>Grants large bonuses for using Idol socketables in your equipment.</td></tr>
            <tr><td>Tame Beast</td><td>Allows the Spirit Walker to tame Beast Bosses (such as Mighty Silverfist, Chimeral Beast, or Rakkar, the Frozen Talon) to open up unique build options.</td></tr>
          </tbody>
        </table></div>

        <h3>The Martial Artist</h3>
        <figure><img src="media/journalism/poe2-return-of-ancients/4.jpg" alt="The Martial Artist Ascendancy" loading="lazy"><figcaption>Credits: Grinding Gear Games</figcaption></figure>
        <p>Hardened by decades of rigorous training, the Martial Artist is a master of the seven Hollow techniques and the flow of internal Spiritual Energy.</p>
        <p>This Ascendancy transforms the Monk into an unbreakable living weapon, utilizing spectral illusions, devastating resonance, and ancient runic tattoos to shatter the darkness with his bare hands.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Ability</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td>Hollow Form Technique</td><td>Creates illusions of the Martial Artist that replicate a skill of your choosing, perfect for clearing packs with AoE skills.</td></tr>
            <tr><td>Hollow Focus Technique</td><td>Manifests Spiritual Energy into Bells around the player. These bells can be shattered by attacks (including from illusions) to deal damage.</td></tr>
            <tr><td>Hollow Resonance Technique</td><td>Adds a manifested Bell to your back that rings each time you deal a Critical Strike, damaging all enemies around you.</td></tr>
            <tr><td>Way of the Mountain</td><td>Covers you in stone when you immobilize enemies, mitigating large amounts of damage and hardening your weapon to deal more damage.</td></tr>
            <tr><td>Meridian Tattoos</td><td>Allows you to socket runes directly into your body via your inventory. Sockets act as virtual armor pieces (one helmet, two body armor, one gloves, one boots).</td></tr>
            <tr><td>Way of the Stonefist</td><td>Causes your equipped gloves to become a new "Fists of Stone" base type. Every modifier on the original gloves is transformed into an equivalent, drastically more powerful modifier (e.g., massive damage, max resistances, increased life gain on hit).</td></tr>
          </tbody>
        </table></div>

        <h3>Path of Exile 2 Endgame Overhaul: The Fortress and Atlas Masters</h3>
        <p>The Atlas of Worlds has been heavily revamped. The endgame now features fixed points of interest at specific locations, giving players clear objectives to discover.</p>
        <p>The centerpiece is the sprawling Precursor Fortress. Plunging into its depths reveals unique mechanics, ranging from relentless Azmeri spirit pursuits and essence crystals to entire zones transformed into gauntlets of strongboxes.</p>
        <figure><img src="media/journalism/poe2-return-of-ancients/5.jpg" alt="The Precursor Fortress" loading="lazy"><figcaption>Credits: Grinding Gear Games</figcaption></figure>
        <p>At the center of the Fortress lies an incredible challenge against the new core Pinnacle boss.</p>
        <p>The Atlas Passive Tree has been significantly upgraded and can now be fully allocated by gaining points from every single area completed in the Fortress. Additionally, the new Masters of the Atlas system introduces an Ascendancy class for your Atlas Tree.</p>
        <p>Players can complete missions for Atlas Masters like Jado (Order of the Djinn) or Hilda (Monster Hunter) to gain special bonuses that can be quickly swapped between depending on what build you are running.</p>

        <h3>Return of the Ancients update reshapes endgame storylines</h3>
        <p>All four Early Access leagues have been massively expanded with fixed Atlas locations, new storylines, dedicated crafting systems, and Pinnacle bosses.</p>
        <figure><img src="media/journalism/poe2-return-of-ancients/6.jpg" alt="Endgame storylines" loading="lazy"><figcaption>Credits: Grinding Gear Games</figcaption></figure>
        <div class="table-wrap"><table>
          <thead><tr><th>League</th><th>Storyline</th><th>New mechanics &amp; rewards</th></tr></thead>
          <tbody>
            <tr><td>Delirium</td><td>The Hare and the Raven.</td><td>Features a visible fog depth bar and mirror shards. Special encounters drop Liquid Emotions to craft specific mods onto Jewels. Culminates in a simulacrum and a fight with Tangmazu.</td></tr>
            <tr><td>Breach</td><td>Join the Keepers of the Flame at their monastery.</td><td>Breaches have visible timers showing how kills extend duration. Enemies drop Hiveblood and Wombgifts to feed the Genesis Tree, offering highly customizable jewelry and belt crafting.</td></tr>
            <tr><td>Ritual</td><td>Free Aoife's spirit from the King in the Mists.</td><td>Ritual rewards are now entirely Uniques or Omens. The "Rite of the Nameless" requires a multi-map ritual where monsters stack map-to-map, culminating in a 5-map challenge.</td></tr>
            <tr><td>Expedition</td><td>Launch an expedition into the ocean to find Gwennen.</td><td>Use logbooks to send ships and explore a vast ocean with new islands, secrets, and vault bosses like Medved and Uhtred, the Stardrinker.</td></tr>
          </tbody>
        </table></div>

        <h3>New unique items in Return of the Ancients update</h3>
        <figure><img src="media/journalism/poe2-return-of-ancients/7.jpg" alt="New unique items" loading="lazy"><figcaption>Credit: Grinding Gear Games</figcaption></figure>
        <div class="table-wrap"><table>
          <thead><tr><th>Unique item</th><th>Type</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td>Twisted Empyrean</td><td>Two-Handed Mace</td><td>Converts all mace fire damage to cold (turning Volcanic Fissures into Glacial). Grants the Starborn Onslaught skill, a backward leap that throws the mace to create Verisium fissures and a storm of cold bolts.</td></tr>
            <tr><td>Eventide Petals</td><td>Amulet</td><td>Grants Runic Ward. Grants the Midnight Zenith reservation skill, causing critical hits to generate Arctic Petals that form into an explosive floral Ice Crystal.</td></tr>
            <tr><td>The Raven's Flock</td><td>Staff</td><td>Causes minions to inflict "Gruelling madness" on hit, slowing enemies. Grants Spiraling Conspiracy, summoning a flock of ravens that deals damage over time and grows larger. Also grants the Mad Flight minion command skill.</td></tr>
            <tr><td>Horror's Flight</td><td>Gloves</td><td>Causes enemies to become terrified of you and grants stacks of "Fear Incarnate" when culling enemies. Grants the Crushing Fear skill, a chaos-damage palm strike that scales heavily based on the power of the enemy.</td></tr>
            <tr><td>Sylvan's Effigy</td><td>Sceptre</td><td>Allows you to have any number of companions of different types. Summons a persistent Azmerian Wolf companion that maims, bleeds, and buffs allies. Grants the Eternal Hunt command skill.</td></tr>
            <tr><td>Liminal Coil</td><td>Wand</td><td>Allows you to apply as many curses as you please, but the curses have no effect. Instead, spells gain Physical and Chaos damage for each curse on the enemy. Grants Coiling Bolts, a spell that splits and chains through every cursed enemy.</td></tr>
            <tr><td>Periphery</td><td>Bow</td><td>Deals damage of all Elements, and all elements cause all Ailments. Grants the Azmerian Swarms skill, summoning pursuing wisps on kill that damage enemies and apply a debuff boosting elemental damage.</td></tr>
            <tr><td>The Ordained</td><td>Spear</td><td>Specializes in Physical and Lightning Damage with high Critical Strike chance. Allows life leech from Lightning damage. Grants Righteous Descent, an epic divine leap that becomes massively empowered near a "Fragment of Divinity".</td></tr>
            <tr><td>Voices</td><td>Jewel</td><td>Consumes one jewel slot to add more (versions exist for 2, 3, or 4 added jewel slots).</td></tr>
            <tr><td>Serle's Grit</td><td>Weapon</td><td>A new unique weapon that, when Runeforged, can gain one of several different powerful outcomes.</td></tr>
          </tbody>
        </table></div>

        <h3>Quality of Life improvements</h3>
        <ul>
          <li><strong>Challenge System:</strong> Challenges debut in Path of Exile 2. Completing challenges rewards pieces of the Knight of Aldur armour set, with progress visible to other players in chat and via a statue in your hideout.</li>
          <li><strong>Build Guide System:</strong> Community creators can now create .build files. When downloaded, these builds appear directly in the game client, showing passive allocations, Ascendancy points, Skill Gems, and item recommendations with custom notes.</li>
          <li><strong>Trade Market Improvements:</strong> Shift-Alt clicking an item will now search for it on the trade market, showing current prices with the ability to toggle specific mods.</li>
          <li><strong>Campaign Navigation:</strong> New navigational landmarks, blood trails, and explorer NPCs that reveal minimap paths have been added to streamline the campaign experience.</li>
        </ul>

        <h3>Road to 1.0 and Beyond</h3>
        <p>The Return of the Ancients update is Path of Exile 2's final major expansion before its 1.0 release.</p>
        <p>Grinding Gear Games will shift its development focus toward polish and balance improvements, accompanied by event leagues. The official launch is scheduled for late 2026, following ExileCon's global broadcasts.</p>
      `,
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
        ${a.dek ? `<p class="dek">${a.dek}</p>` : ""}
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
        ${a.dek ? `<p class="article-dek">${a.dek}</p>` : ""}
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
