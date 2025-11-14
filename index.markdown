<!-- ---
layout: page
title: "Hyunsik Min"
permalink: /
---

<p align="center">
  <img src="/assets/img/avatar.png" alt="Hyunsik Min" style="max-width: 220px; border-radius: 50%;">
</p>

M.S. Candidate, Republic of Korea  

AI for Energy · Mobility · Safety

---

## Profiles & Contact

- 📧 Email: [minun001@sch.ac.kr](mailto:minun001@sch.ac.kr)  
- 💻 GitHub: [github.com/minun001](https://github.com/minun001)  
- 🔗 LinkedIn: [linkedin.com/in/hyunsik-min-9ba072346](https://www.linkedin.com/in/hyunsik-min-9ba072346/)  
- 📚 Google Scholar: [scholar.google.com/citations?user=2AUQlE8AAAAJ](https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en)

---

## Snapshot

- 🎓 **M.S. Candidate**, Future Convergence Technology, SCHU  
- 📄 **3× First-author SCI(E) papers**  
  - 1× as an undergraduate student  
  - 2× in the first semester of the M.S. program  
- 🔬 **National research projects (NRF CRC, etc.)**  
  - Bridging academic research with real-world urban and transportation challenges  
- 🌏 Focused on **AI that creates tangible societal value** in energy, mobility, and safety

---

## About

My work focuses on how artificial intelligence can create tangible societal value in the domains of energy, mobility, and safety.

Since my undergraduate years, I have been actively engaged in lab-based research on topics such as:

- Smart grid optimization leveraging solar photovoltaic generation  
- Front-vehicle trajectory prediction for anticipatory autonomous driving  
- AI-based traffic accident ruling prediction using legal and contextual data  

These efforts have led to **three first-author SCI(E) publications** — one during my undergraduate studies and two additional papers in the first semester of my M.S. program.

Currently, in my second semester as a Master’s student, I am participating in national research projects, including an **NRF-funded CRC program**, where I aim to connect academic research with practical solutions for real-world urban and transportation challenges.  
Ultimately, I aspire to become a researcher who helps build **safer, smarter cities** where AI is a reliable foundation for future mobility and infrastructure.

---

## Research Areas

I am broadly interested in how modern AI — including foundation models and generative models — can be grounded in real-world systems for energy and mobility.

- **Foundation Models & VLA**  
  Applying large-scale foundation models and vision–language–action (VLA) systems to embodied decision-making and complex multi-modal scenarios.

- **Autonomous Driving & Anticipatory Planning**  
  Front-vehicle maneuver and trajectory prediction (e.g., TGCA-based models) to support proactive, trustworthy autonomous driving beyond rule-based control.

- **Generative AI for Mobility & Safety**  
  Scenario generation, risk analysis, and behavior modeling for traffic and urban mobility using generative models.

- **Time Series Forecasting for Energy & Mobility**  
  Data-driven forecasting for smart grid operation, energy demand, and mobility systems.

- **AI-based Speaker Diarization & Interaction Analysis**  
  Child–parent CRC conversational data, speaker diarization, and interaction understanding to support educational and clinical insights.

---

## Selected Topics & Projects

### Front-vehicle Trajectory Prediction for Autonomous Driving
- Spatio-temporal modeling of front-side vehicles in natural traffic scenes  
- Temporal Graph Cross Attention (TGCA)-based framework for maneuver intent inference  
- Goal: enable anticipatory driving beyond threshold-based reactive control

### AI-based Speaker Diarization for CRC Data
- Speaker diarization and classification for child–parent conversational datasets  
- Combination of language models, acoustic embeddings, and diarization pipelines  
- Goal: support reliable analysis of educational and clinical interaction data

### Smart Grid & Energy AI
- Solar PV-based smart grid optimization and energy management  
- Focus on robust, data-driven decision-making for future energy and city-scale systems  

---

## Looking Ahead

Across all of my work, I am interested in:

- Turning **advanced AI models** into **deployable systems** in mobility and energy  
- Ensuring that AI not only improves metrics in controlled benchmarks,  
  but also **makes cities safer, more efficient, and more human-centered** in practice. -->

---
layout: page
title: "Hyunsik Min"
permalink: /
---

<style>
/* ====== 전체 레이아웃 / 기본 스타일 ====== */
.hs-page-wrapper {
  max-width: 1040px;
  margin: 0 auto;
}

/* 상단 프로필 영역 */
.hs-hero {
  text-align: center;
  margin-bottom: 1.5rem;
}

.hs-hero img {
  max-width: 220px;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.hs-hero-title {
  margin-top: 0.75rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.hs-hero-subtitle {
  font-size: 0.95rem;
  color: #666;
}

/* ====== 상단 탭 네비게이션 ====== */
.hs-topnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.5rem 0 1.25rem;
  padding: 0.5rem;
  border-radius: 999px;
  background: #f5f5f7;
  overflow-x: auto;
}

.hs-topnav a {
  flex: 0 0 auto;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  text-decoration: none;
  color: #333;
  background: transparent;
  border: 1px solid transparent;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.1s;
  white-space: nowrap;
}

.hs-topnav a:hover {
  background: #fff;
  border-color: #ddd;
  transform: translateY(-1px);
}

.hs-topnav a.hs-topnav-active {
  background: #111;
  color: #fff;
  border-color: #111;
}

/* ====== 콘텐츠 레이아웃 (사이드바 + 본문) ====== */
.hs-main-layout {
  display: flex;
  gap: 1.5rem;
}

/* 사이드바 네비 */
.hs-sidebar {
  flex: 0 0 200px;
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
}

.hs-sidenav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.hs-sidenav button {
  text-align: left;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #444;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}

.hs-sidenav button:hover {
  background: #f3f3f5;
  transform: translateX(1px);
}

.hs-sidenav button.hs-sidenav-active {
  background: #111;
  color: #fff;
}

/* 모바일일 때 사이드바를 위로 올리고 가로형 탭처럼 */
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

/* ====== 섹션(아코디언 카드) 스타일 ====== */
.hs-main-content {
  flex: 1;
}

.hs-section {
  margin-bottom: 1rem;
  border-radius: 16px;
  border: 1px solid #e3e3e8;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

/* 헤더(클릭 영역) */
.hs-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem 0.85rem 1rem;
  cursor: pointer;
  background: linear-gradient(to right, #fafafa, #fdfdfd);
  border-bottom: 1px solid #eee;
}

.hs-section-title {
  font-size: 1.02rem;
  font-weight: 600;
}

.hs-section-tag {
  font-size: 0.8rem;
  color: #888;
}

/* 아이콘 (열림/닫힘 표시) */
.hs-section-icon {
  margin-left: 0.75rem;
  font-size: 1rem;
  color: #888;
  transition: transform 0.2s;
}

.hs-section.active .hs-section-icon {
  transform: rotate(90deg);
}

/* 내용(애니메이션 영역) */
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

/* 작은 강조 텍스트 */
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

/* 모바일 폰트/패딩 약간 줄이기 */
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
  const topNavLinks = Array.from(document.querySelectorAll(".hs-topnav a[data-target]"));
  const sideNavButtons = Array.from(document.querySelectorAll(".hs-sidenav button[data-target]"));

  // 내부에서 섹션 열기/닫기 공통 함수
  function openSection(targetId, scrollIntoView = false) {
    sections.forEach(section => {
      const bodyWrap = section.querySelector(".hs-section-body-wrap");
      const id = section.getAttribute("id");
      if (!bodyWrap) return;

      if (id === targetId) {
        // 열기
        section.classList.add("active");
        bodyWrap.style.maxHeight = bodyWrap.scrollHeight + "px";
      } else {
        // 닫기
        section.classList.remove("active");
        bodyWrap.style.maxHeight = "0px";
      }
    });

    // 상단 탭 active 상태
    topNavLinks.forEach(link => {
      link.classList.toggle("hs-topnav-active", link.dataset.target === targetId);
    });

    // 사이드바 active 상태
    sideNavButtons.forEach(btn => {
      btn.classList.toggle("hs-sidenav-active", btn.dataset.target === targetId);
    });

    // 필요 시 스크롤
    if (scrollIntoView) {
      const el = document.getElementById(targetId);
      if (el) {
        const offset = 80; // 상단 고정 헤더 있을 수 있으니 약간 여유
        const rect = el.getBoundingClientRect();
        const absoluteY = window.scrollY + rect.top - offset;
        window.scrollTo({ top: absoluteY, behavior: "smooth" });
      }
    }
  }

  // 헤더 클릭: 토글이지만, 하나만 열리도록
  sections.forEach(section => {
    const header = section.querySelector(".hs-section-header");
    const bodyWrap = section.querySelector(".hs-section-body-wrap");
    if (!header || !bodyWrap) return;

    header.addEventListener("click", () => {
      const id = section.getAttribute("id");
      const isActive = section.classList.contains("active");

      if (isActive) {
        // 현재 열려 있으면 닫기
        section.classList.remove("active");
        bodyWrap.style.maxHeight = "0px";
        topNavLinks.forEach(link => {
          if (link.dataset.target === id) link.classList.remove("hs-topnav-active");
        });
        sideNavButtons.forEach(btn => {
          if (btn.dataset.target === id) btn.classList.remove("hs-sidenav-active");
        });
      } else {
        // 다른 건 닫고 이 섹션만 열기
        openSection(id);
      }
    });
  });

  // 상단 탭 클릭
  topNavLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      openSection(targetId, true);
    });
  });

  // 사이드바 버튼 클릭
  sideNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      openSection(targetId, true);
    });
  });

  // 페이지 로드 시 첫 섹션 자동 오픈
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
  }
});
</script>

<div class="hs-page-wrapper">

  <!-- 프로필 영역 -->
  <section class="hs-hero">
    <img src="/assets/img/avatar.png" alt="Hyunsik Min">
    <div class="hs-hero-title">M.S. Candidate, Republic of Korea</div>
    <div class="hs-hero-subtitle">AI for Energy · Mobility · Safety</div>
  </section>

  <!-- 상단 탭 네비게이션 -->
  <nav class="hs-topnav">
    <a href="#section-profiles" data-target="section-profiles">Profiles &amp; Contact</a>
    <a href="#section-snapshot" data-target="section-snapshot">Snapshot</a>
    <a href="#section-about" data-target="section-about">About</a>
    <a href="#section-research" data-target="section-research">Research Areas</a>
    <a href="#section-projects" data-target="section-projects">Selected Projects</a>
    <a href="#section-future" data-target="section-future">Looking Ahead</a>
  </nav>

  <div class="hs-main-layout">
    <!-- 사이드바 네비 -->
    <aside class="hs-sidebar">
      <div class="hs-sidebar-title">Sections</div>
      <div class="hs-sidenav">
        <button type="button" data-target="section-profiles">Profiles</button>
        <button type="button" data-target="section-snapshot">Snapshot</button>
        <button type="button" data-target="section-about">About</button>
        <button type="button" data-target="section-research">Research</button>
        <button type="button" data-target="section-projects">Projects</button>
        <button type="button" data-target="section-future">Future</button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 (아코디언 섹션들) -->
    <main class="hs-main-content">

      <!-- Profiles & Contact -->
      <section id="section-profiles" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Profiles &amp; Contact</div>
            <div class="hs-section-tag">Contact · Profiles</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>
              <span class="hs-chip">Primary contact</span>
            </p>
            <ul>
              <li>📧 Email: <a href="mailto:minun001@sch.ac.kr">minun001@sch.ac.kr</a></li>
              <li>💻 GitHub: <a href="https://github.com/minun001" target="_blank" rel="noopener">github.com/minun001</a></li>
              <li>🔗 LinkedIn: <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">linkedin.com/in/hyunsik-min-9ba072346</a></li>
              <li>📚 Google Scholar: <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en" target="_blank" rel="noopener">scholar profile</a></li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Snapshot -->
      <section id="section-snapshot" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Snapshot</div>
            <div class="hs-section-tag">At a glance</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <ul>
              <li>🎓 <strong>M.S. Candidate</strong>, Department of Future Convergence Technology, Soonchunhyang University (SCHU)</li>
              <li>📄 <strong>3× First-author SCI(E) papers</strong>
                <ul>
                  <li>1× as an undergraduate student</li>
                  <li>2× in the first semester of the M.S. program</li>
                </ul>
              </li>
              <li>🔬 Involved in <strong>national research projects (NRF CRC, etc.)</strong>, bridging academic research with real-world urban and transportation challenges</li>
              <li>🌏 Focused on <strong>AI that creates tangible societal value</strong> in energy, mobility, and safety</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- About -->
      <section id="section-about" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">About</div>
            <div class="hs-section-tag">Background &amp; motivation</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>
              My work focuses on how artificial intelligence can create tangible societal value in the domains of energy,
              mobility, and safety.
            </p>
            <p>Since my undergraduate years, I have been actively engaged in lab-based research on topics such as:</p>
            <ul>
              <li>Smart grid optimization leveraging solar photovoltaic generation</li>
              <li>Front-vehicle trajectory prediction for anticipatory autonomous driving</li>
              <li>AI-based traffic accident ruling prediction using legal and contextual data</li>
            </ul>
            <p>
              These efforts have led to <strong>three first-author SCI(E) publications</strong> — one during my undergraduate
              studies and two additional papers in the first semester of my M.S. program.
            </p>
            <p>
              Currently, in my second semester as a Master’s student, I am participating in national research projects,
              including an <strong>NRF-funded CRC program</strong>, where I aim to connect academic research with practical
              solutions for real-world urban and transportation challenges.
            </p>
            <p>
              Ultimately, I aspire to become a researcher who helps build <strong>safer, smarter cities</strong> where AI
              is a reliable foundation for future mobility and infrastructure.
            </p>
          </div>
        </div>
      </section>

      <!-- Research Areas -->
      <section id="section-research" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Research Areas</div>
            <div class="hs-section-tag">Energy · Mobility · Safety</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>
              I am broadly interested in how modern AI — including foundation models and generative models — can be
              grounded in real-world systems for energy and mobility.
            </p>
            <ul>
              <li><strong>Foundation Models &amp; VLA</strong><br>
                Applying large-scale foundation models and vision–language–action (VLA) systems to embodied
                decision-making and complex multi-modal scenarios.
              </li>
              <li><strong>Autonomous Driving &amp; Anticipatory Planning</strong><br>
                Front-vehicle maneuver and trajectory prediction (e.g., TGCA-based models) to support proactive,
                trustworthy autonomous driving beyond rule-based control.
              </li>
              <li><strong>Generative AI for Mobility &amp; Safety</strong><br>
                Scenario generation, risk analysis, and behavior modeling for traffic and urban mobility using
                generative models.
              </li>
              <li><strong>Time Series Forecasting for Energy &amp; Mobility</strong><br>
                Data-driven forecasting for smart grid operation, energy demand, and mobility systems.
              </li>
              <li><strong>AI-based Speaker Diarization &amp; Interaction Analysis</strong><br>
                Child–parent CRC conversational data, speaker diarization, and interaction understanding to support
                educational and clinical insights.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Selected Topics & Projects -->
      <section id="section-projects" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Selected Topics &amp; Projects</div>
            <div class="hs-section-tag">Current &amp; recent work</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <h3>Front-vehicle Trajectory Prediction for Autonomous Driving</h3>
            <ul>
              <li>Spatio-temporal modeling of front-side vehicles in natural traffic scenes</li>
              <li>Temporal Graph Cross Attention (TGCA)-based framework for maneuver intent inference</li>
              <li>Goal: enable anticipatory driving beyond threshold-based reactive control</li>
            </ul>

            <h3>AI-based Speaker Diarization for CRC Data</h3>
            <ul>
              <li>Speaker diarization and classification for child–parent conversational datasets</li>
              <li>Combination of language models, acoustic embeddings, and diarization pipelines</li>
              <li>Goal: support reliable analysis of educational and clinical interaction data</li>
            </ul>

            <h3>Smart Grid &amp; Energy AI</h3>
            <ul>
              <li>Solar PV-based smart grid optimization and energy management</li>
              <li>Focus on robust, data-driven decision-making for future energy and city-scale systems</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Looking Ahead -->
      <section id="section-future" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Looking Ahead</div>
            <div class="hs-section-tag">Vision</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>Across all of my work, I am interested in:</p>
            <ul>
              <li>Turning <strong>advanced AI models</strong> into <strong>deployable systems</strong> in mobility and energy</li>
              <li>Ensuring that AI not only improves metrics in controlled benchmarks,<br>
                  but also <strong>makes cities safer, more efficient, and more human-centered</strong> in practice</li>
            </ul>
          </div>
        </div>
      </section>

    </main>
  </div>
</div>
