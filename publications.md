---
layout: page
title: "Publications"
permalink: /publications/
---

<style>
/* ====== Minima 疫꿸퀡????뺛걠/Posts/RSS ??ｋ┛疫?====== */
.page .post-list,
.page .rss-subscribe,
.page .page-heading,
.page .post-title {
  display: none !important;
}

/* ====== Night 筌뤴뫀諭??袁⑹뒠: ?紐낅뱜嚥???용뮞??獄쏆빓苡?====== */
body.theme-night .hs-pub-intro h1,
body.theme-night .hs-pub-intro p {
  color: #e5e7eb; /* 椰꾧퀣???怨쀪퉳??揶쎛繹먮슣??獄쏆빘? ???퉳 */
}

/* ====== ?袁⑷퍥 ??됱뵠?袁⑹뜍 / 疫꿸퀡???????====== */
.hs-pub-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 獄쏄퀗瑗??域밸챶??遺용섧??疫꼲嚥≪뮇??(????곷뮞/??而?猿됰궢 ??筌띿쉸?? */
.hs-pub-wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 60%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 55%);
  opacity: 0.95;
}

.hs-pub-intro {
  margin-bottom: 1.5rem;
}

.hs-pub-intro-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
  gap: 1rem;
  align-items: stretch;
}

.hs-pub-intro-main,
.hs-pub-intro-art {
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
}

.hs-pub-intro-main {
  padding: 1.3rem 1.35rem 1.1rem;
}

.hs-pub-intro-art {
  padding: 1.08rem;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.96), rgba(14, 116, 144, 0.92));
  color: #d7f3ff;
  box-shadow: 0 22px 44px rgba(8, 47, 73, 0.22);
}

.hs-pub-intro-art h2 {
  margin: 0.25rem 0 0.4rem;
  color: #fff;
  font-size: 1.35rem;
}

.hs-pub-intro-art p {
  margin: 0;
  color: rgba(215, 243, 255, 0.84);
  font-size: 0.9rem;
}

.hs-pub-intro-art img {
  width: 100%;
  margin-top: 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.hs-pub-intro-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(215, 243, 255, 0.68);
}

.hs-pub-intro h1 {
  margin-bottom: 0.3rem;
}

.hs-pub-intro p {
  color: #555;
  font-size: 0.97rem;
}

/* ?怨룸뼊 ?袁⑥쨮????륁뵠??깆뵠??燁삳?諭?*/
.hs-pub-highlight {
  margin-top: 0.8rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: radial-gradient(circle at top left, #f5f7ff, #ffffff);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  align-items: center;
}

.hs-pub-highlight-main {
  flex: 1;
  min-width: 240px;
}

.hs-pub-highlight-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.hs-pub-highlight-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.hs-pub-highlight-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  font-size: 0.9rem;
  color: #374151;
}

.hs-pub-highlight-links a {
  text-decoration: none;
  font-weight: 500;
  color: #1d4ed8;
}

.hs-pub-highlight-links a:hover {
  text-decoration: underline;
}

/* 筌뤴뫀而??깅퓠???類ｌ졊 癰귣똻??*/
@media (max-width: 920px) {
  .hs-pub-intro-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hs-pub-highlight {
    padding: 0.8rem 0.85rem;
  }
  .hs-pub-highlight-links {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* ====== ?袁り숲 獄?(野꺜??+ ??볥젃) ====== */
.hs-filter-bar {
  margin: 1rem 0 1.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.9rem;
  align-items: center;
}

#pub-search {
  flex: 1;
  min-width: 210px;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  font-size: 0.88rem;
  outline: none;
  background: rgba(255, 255, 255, 0.92);
}

#pub-search:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.3);
}

.hs-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.hs-filter-tags button {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.32rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
  color: #4b5563;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.hs-filter-tags button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.hs-filter-tags button.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);
}

/* ====== 筌롫뗄????됱뵠?袁⑹뜍 (?????뺤뺍 + 癰귣챶揆) ====== */
.hs-main-layout {
  display: flex;
  gap: 1.5rem;
}

/* ====== ?????뺤뺍 ??삵돩 (?諭???? ====== */
.hs-sidebar {
  flex: 0 0 220px;
  position: sticky;
  top: 100px;
  align-self: flex-start;
  max-height: calc(100vh - 120px);
}

.hs-sidebar-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 0.5rem;
  position: relative;
}

/* ?????뺤뺍 ??뺛걠 ?袁⑥삋 域밸챶??遺용섧????깆뵥 */
.hs-sidebar-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #10b981);
}

/* ?醫듼봺 ?癒?덱 甕곌쑵??(????곷뮞/??而?猿됰궢 ??筌띿쉸?? */
.hs-sidenav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hs-sidenav button {
  text-align: left;
  padding: 0.42rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.12s ease;
}

.hs-sidenav button:hover {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  transform: translateX(1px);
}

/* ??뽮쉐 ?? ??揶쏅벤釉?域밸챶??遺용섧??疫꼲嚥≪뮇??*/
.hs-sidenav button.hs-sidenav-active {
  background: radial-gradient(circle at top left, #2563eb, #111827);
  color: #fff;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.45);
  transform: translateX(2px);
}

/* 筌뤴뫀而??깆뵬 ???????뺤뺍???袁⑥쨮 ???곫?揶쎛嚥≪뮉????荑??*/
@media (max-width: 800px) {
  .hs-main-layout {
    flex-direction: column;
  }
  .hs-sidebar {
    position: static;
    width: 100%;
    max-height: none;
    order: -1;
  }
  .hs-sidenav {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .hs-sidenav button {
    flex: 0 0 auto;
  }
}

/* ====== ?諭???袁⑺맜?遺용섧 燁삳?諭? ?????====== */
.hs-main-content {
  flex: 1;
}

/* 疫꿸퀡?? ??곸? ?袁⑥삋 + ??梨???쎄쾿嚥????醫딅빍筌롫뗄???륁뒠) */
.hs-section {
  margin-bottom: 1rem;
  border-radius: 16px;
  border: 1px solid #e3e3e8;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  position: relative;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

/* ?됯퀬猷?紐꾨퓠 ??쇰선?遺우뱽 ??*/
.hs-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ??뽮쉐 ?諭?? ??곸? ???醫롮궎?쒕떯?? ???あ??揶쏅벡??*/
.hs-section.active {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
}

/* ??삳쐭(?????怨몃열) */
.hs-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem 0.85rem 1rem;
  cursor: pointer;
  background: linear-gradient(to right, #fafafa, #fdfdfd);
  border-bottom: 1px solid #eee;
  position: relative;
}

/* ??뽮쉐 ?諭????긱걹 ?뚎됱쑎 ??깆뵥 */
.hs-section-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(to bottom, #2563eb, #10b981);
  opacity: 0;
  transition: opacity 0.22s ease;
}

.hs-section.active .hs-section-header::before {
  opacity: 1;
}

.hs-section-title {
  font-size: 1.02rem;
  font-weight: 600;
}

.hs-section-tag {
  font-size: 0.8rem;
  color: #888;
}

/* ?袁⑹뵠??(???????삋 ??뽯뻻) */
.hs-section-icon {
  margin-left: 0.75rem;
  font-size: 1rem;
  color: #888;
  transition: transform 0.2s;
}

.hs-section.active .hs-section-icon {
  transform: rotate(90deg);
}

/* ??곸뒠(?醫딅빍筌롫뗄????怨몃열) */
.hs-section-body-wrap {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.25s ease, opacity 0.2s ease;
  opacity: 0;
}

.hs-section.active .hs-section-body-wrap {
  opacity: 1;
}

.hs-section-body {
  padding: 1rem 1.1rem 1.1rem;
  font-size: 0.96rem;
  color: #333;
}

.hs-section-body p {
  margin-bottom: 0.6rem;
}

.hs-section-body ul {
  padding-left: 1.25rem;
  margin: 0.35rem 0 0.6rem;
}

.hs-section-body li {
  margin-bottom: 0.3rem;
}

/* 揶쏆뮆????겆?燁삳?諭??癒?덱 */
.hs-pub-item {
  margin-bottom: 1.1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #e0e0ea;
}

.hs-pub-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.hs-pub-item h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.hs-pub-meta {
  font-size: 0.86rem;
  color: #666;
  margin-bottom: 0.4rem;
}

.hs-pub-desc {
  font-size: 0.93rem;
}

/* ?臾? ??볥젃/燁?*/
.hs-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #f4f4ff;
  color: #555;
  font-size: 0.78rem;
  margin-right: 0.25rem;
}

/* ????낇?燁???깃맒 (?癒곕릭筌??癒?춭?怨몄몵嚥??대Ŋ猿? */
.hs-chip-journal {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.hs-chip-conference {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.hs-chip-domestic {
  background: rgba(107, 114, 128, 0.16);
  color: #374151;
}

.hs-chip-legal {
  background: rgba(139, 92, 246, 0.16);
  color: #6d28d9;
}

/* ???筌왖 ?⑤벏???????*/
.hs-pub-figure {
  text-align: center;
  margin: 0.75rem 0 0.9rem;
}

.hs-pub-figure img {
  width: 100%;
  max-width: 850px;
  border-radius: 10px;
}

/* 筌뤴뫀而???怨좊뱜/??ㅻ뎃 ??꾩퍢 餓κ쑴?졿묾?*/
@media (max-width: 600px) {
  .hs-section-header {
    padding: 0.75rem 0.85rem;
  }
  .hs-section-body {
    padding: 0.85rem 0.9rem 0.95rem;
  }
  .hs-section-title {
    font-size: 0.98rem;
  }
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const sections = Array.from(document.querySelectorAll(".hs-section"));
  const sideNavButtons = Array.from(document.querySelectorAll(".hs-sidenav button[data-target]"));

  function openSection(targetId, scrollIntoView = false) {
    sections.forEach(section => {
      const bodyWrap = section.querySelector(".hs-section-body-wrap");
      const id = section.getAttribute("id");
      if (!bodyWrap) return;

      if (id === targetId) {
        section.classList.add("active");
        bodyWrap.style.maxHeight = bodyWrap.scrollHeight + "px";
      } else {
        section.classList.remove("active");
        bodyWrap.style.maxHeight = "0px";
      }
    });

    sideNavButtons.forEach(btn => {
      btn.classList.toggle("hs-sidenav-active", btn.dataset.target === targetId);
    });

    if (scrollIntoView) {
      const el = document.getElementById(targetId);
      if (el) {
        const offset = 80;
        const rect = el.getBoundingClientRect();
        const absoluteY = window.scrollY + rect.top - offset;
        window.scrollTo({ top: absoluteY, behavior: "smooth" });
      }
    }
  }

  // ??삳쐭 ???? ?醫? + ??롪돌筌?????袁⑥쨯
  sections.forEach(section => {
    const header = section.querySelector(".hs-section-header");
    const bodyWrap = section.querySelector(".hs-section-body-wrap");
    if (!header || !bodyWrap) return;

    header.addEventListener("click", () => {
      const id = section.getAttribute("id");
      const isActive = section.classList.contains("active");

      if (isActive) {
        section.classList.remove("active");
        bodyWrap.style.maxHeight = "0px";
        sideNavButtons.forEach(btn => {
          if (btn.dataset.target === id) btn.classList.remove("hs-sidenav-active");
        });
      } else {
        openSection(id);
      }
    });
  });

  // ?????뺤뺍 甕곌쑵??????
  sideNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      openSection(targetId, true);
    });
  });

  // ??쎄쾿嚥????醫딅빍筌롫뗄??? IntersectionObserver
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    sections.forEach((section) => observer.observe(section));
  } else {
    // ?닌뗭굨 ?됰슢??怨???fallback
    sections.forEach((section) => section.classList.add("is-visible"));
  }

  // ??륁뵠筌왖 嚥≪뮆諭???筌??諭???癒?짗 ??쎈탞 (2025 ?諭?? + 筌앸맩??visible 筌ｌ꼶??
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
    sections[0].classList.add("is-visible");
  }

  /* ====== Publications 野꺜??+ ??볥젃 ?袁り숲 ====== */
  const searchInput = document.getElementById("pub-search");
  const tagButtons = document.querySelectorAll(".hs-filter-tags button");
  const pubItems = document.querySelectorAll(".hs-pub-item");

  if (searchInput && tagButtons.length && pubItems.length) {
    let activeTag = "all";

    function applyFilter() {
      const q = searchInput.value.toLowerCase().trim();

      pubItems.forEach(item => {
        const text = item.innerText.toLowerCase();
        const tags = (item.dataset.tags || "").toLowerCase();

        const matchText = !q || text.includes(q);
        const matchTag = activeTag === "all" || tags.includes(activeTag);

        item.style.display = (matchText && matchTag) ? "" : "none";
      });
    }

    searchInput.addEventListener("input", applyFilter);

    tagButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tagButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTag = btn.dataset.filter || "all";
        applyFilter();
      });
    });
  }
});
</script>

<div class="hs-pub-wrapper">

  <section class="hs-pub-intro">
    <div class="hs-pub-intro-shell">
      <div class="hs-pub-intro-main">
        <h1>Publications</h1>
        <p>
          A selected list of <strong>first-author publications</strong>, grouped by stage and research direction.
        </p>

    <!-- ?逾??怨룸뼊 Profiles ??륁뵠??깆뵠??-->
    <div class="hs-pub-highlight">
      <div class="hs-pub-highlight-main">
        <div class="hs-pub-highlight-title">
          <span class="hs-chip">Scholar &amp; network</span>
          <span class="hs-pub-highlight-label">Profiles</span>
        </div>
        <div class="hs-pub-highlight-links">
          <div>
            <strong>Google Scholar</strong><br>
            <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en"
               target="_blank" rel="noopener">
              scholar.google.com/citations?user=2AUQlE8AAAAJ&amp;hl=en
            </a>
          </div>
          <div>
            <strong>LinkedIn</strong><br>
            <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/"
               target="_blank" rel="noopener">
              linkedin.com/in/hyunsik-min-9ba072346
            </a>
          </div>
        </div>
      </div>
    </div>
      </div>
      <aside class="hs-pub-intro-art">
        <div class="hs-pub-intro-kicker">Research Archive</div>
        <h2>From representative papers to applied project frameworks</h2>
        <p>The publication list highlights how individual studies connect to a broader portfolio across mobility, energy, legal AI, and urban systems.</p>
        <img src="/assets/img/publications-archive.svg" alt="Abstract archive illustration for research publications." loading="lazy">
      </aside>
    </div>

    <div class="hs-filter-bar">
      <input
        type="text"
        id="pub-search"
        placeholder="Search title, venue, or keyword">
      <div class="hs-filter-tags">
        <button type="button" class="active" data-filter="all">All</button>
        <button type="button" data-filter="energy">Energy</button>
        <button type="button" data-filter="mobility">Mobility</button>
        <button type="button" data-filter="legal">Legal AI</button>
        <button type="button" data-filter="urban">Urban / Noise</button>
        <button type="button" data-filter="medical">Medical</button>
      </div>
    </div>
  </section>

  <div class="hs-main-layout">
    <!-- ?????뺤뺍 ??삵돩 -->
    <aside class="hs-sidebar">
      <div class="hs-sidebar-title">Sections</div>
      <div class="hs-sidenav">
        <button type="button" data-target="pub-2025">2025 Master's (SCI(E) &amp; Intl.)</button>
        <button type="button" data-target="pub-2024-scie">2024 Undergraduate SCI(E)</button>
        <button type="button" data-target="pub-2024-domestic">2024-2025 Domestic</button>
      </div>
    </aside>

    <!-- 筌롫뗄???꾩꼹?쀯㎘?(?袁⑺맜?遺용섧 ?諭??? -->
    <main class="hs-main-content">

      <!-- 2025 ??Master???Research -->
      <section id="pub-2025" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">2025 Master's Research (SCI(E) &amp; International)</div>
            <div class="hs-section-tag">First-author international publications</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item" data-tags="legal, llm, mobility">
              <h3>2. TRACS-LLM: LLM-based traffic accident criminal sentencing prediction focusing on imprisonment, probation, and fines</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-legal">LLM / Legal AI</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Artificial Intelligence and Law</strong>, 1-12 (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/TRACM_LLM_framework.png"
                     alt="TRACS-LLM Framework"
                     loading="lazy">
              </div>

              <p class="hs-pub-desc">
                TRACS-LLM predicts sentencing outcomes in road traffic accident cases using legal text, structured case attributes, and LLM-based reasoning.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="energy, time-series">
              <h3>1. SolarNexus: A deep learning framework for adaptive photovoltaic power generation forecasting and scalable management</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-journal">Energy / Time series</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Applied Energy</strong>, 391, 125848 (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/SolarNexus_framework.png"
                     alt="SolarNexus Framework"
                     loading="lazy"
                     style="margin-bottom:1rem;">
                <img src="/assets/img/SolarNexus_TCN.png"
                     alt="SolarNexus TCN-based Forecaster"
                     loading="lazy">
              </div>

              <p class="hs-pub-desc">
                SolarNexus combines adaptive PV forecasting with scalable plant-level management for smart-grid operations.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2024 ??Undergraduate SCI(E) -->
      <section id="pub-2024-scie" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">2024 Undergraduate First-Author SCI(E)</div>
            <div class="hs-section-tag">PV forecasting / Undergraduate work</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item" data-tags="energy, deep-learning">
              <h3>SolarFlux predictor: a novel deep learning approach for photovoltaic power forecasting in South Korea</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-journal">Energy / Deep learning</span>
                <em>Hyunsik Min</em>, S. Hong, J. Song, B. Son, B. Noh, J. Moon<br>
                <strong>Electronics</strong>, 13(11), 2071 (2024).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/SolarFlux_framework.png"
                     alt="SolarFlux Predictor Framework"
                     loading="lazy">
              </div>

              <p class="hs-pub-desc">
                SolarFlux is a deep learning approach for photovoltaic power forecasting tailored to South Korean conditions.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2024??025 ??Domestic Journals & Conferences -->
      <section id="pub-2024-domestic" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">2024-2025 Domestic Journals &amp; Conferences (First Author, in Korean)</div>
            <div class="hs-section-tag">Domestic journals &amp; conferences</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item" data-tags="autonomous-driving, mobility">
              <h3>Temporal Graph Cross Attention-based Front-Vehicle Trajectory Prediction</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-conference">Autonomous driving / TGCA</span>
                H. Min, B. Noh<br>
                <strong>Korean Society of Transportation Conference</strong> (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/TGCA_framework.png"
                     alt="Temporal Graph Cross Attention Framework"
                     loading="lazy"
                     style="margin-bottom:1rem;">
                <img src="/assets/img/TGCA_model.png"
                     alt="TGCA Model Architecture"
                     loading="lazy">
              </div>

              <p class="hs-pub-desc">
                A TGCA-based framework for front-vehicle trajectory prediction in naturalistic driving environments.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="legal, nlp, mobility">
              <h3>Natural Language Processing-based Judgement Prediction System for Road Traffic Accidents: Focused on Text Information for Traffic Accident Situations</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-domestic">NLP / Legal analytics</span>
                <em>Hyunsik Min</em>, J. Yun, B. Noh<br>
                <strong>Journal of Korean Society of Transportation</strong>, 42(4), 385-397 (2024).
              </div>

              <p class="hs-pub-desc">
                An NLP-based system for predicting case-level outcomes from road traffic accident descriptions.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="urban, audio">
              <h3>Urban Traffic Noise Recognition and Classification Model Development</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-domestic">Urban noise</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Korea Computer and Information Society Conference Proceedings</strong>, 32(2), 49-52 (2024).
              </div>

              <p class="hs-pub-desc">
                A model for recognizing and classifying urban traffic noise for environmental monitoring.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="legal, llm, traffic-law">
              <h3>LLM-based Traffic Accident Judgment Prediction System</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-legal">LLM / Traffic law</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Korean ITS Conference Proceedings</strong>, 811-816 (2024).
              </div>

              <p class="hs-pub-desc">
                A Korean-language LLM-based design for traffic accident judgment prediction.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="legal, nlp, traffic-law">
              <h3>NLP-based Traffic Accident Judgment Prediction System</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-domestic">NLP / Traffic law</span>
                <em>Hyunsik Min</em>, J. Yun, Byeongjoon Noh<br>
                <strong>Korean ITS Conference Proceedings</strong>, 275-279 (2024).
              </div>

              <p class="hs-pub-desc">
                An NLP-based baseline for predicting court decisions in road traffic accident cases.
              </p>
            </div>

            <div class="hs-pub-item" data-tags="medical, imaging">
              <h3>Tooth Segmentation and Identification in Panoramic Radiographs Using Mask R-CNN</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip hs-chip-domestic">Medical imaging</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Korean Institute of Communications and Information Sciences Conference Proceedings</strong> (in Korean).
              </div>

              <p class="hs-pub-desc">
                A Mask R-CNN-based method for tooth segmentation and identification in panoramic radiographs.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  </div>
</div>
