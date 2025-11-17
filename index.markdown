---
layout: page
title: "Hyunsik Min"
permalink: /
---

<style>
/* ====== Minima 기본 제목/Posts/RSS 숨기기 ====== */
.home .post-list,
.home .rss-subscribe,
.home .page-heading,
.page .post-list,
.page .rss-subscribe,
.page .page-heading,
.page .post-title {
  display: none !important;
}

/* ====== Night 모드 전용: 히어로 텍스트 밝게 ====== */
body.theme-night .hs-hero-title,
body.theme-night .hs-hero-subtitle,
body.theme-night .hs-hero-intro {
  color: #e5e7eb; /* 거의 흰색에 가까운 밝은 회색 */
}

/* 필요하면 사이드바 타이틀도 조금 더 밝게 */
/*
body.theme-night .hs-sidebar-title {
  color: #e5e7eb;
}
*/

/* ====== 전체 레이아웃 / 기본 스타일 ====== */
.hs-page-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 배경용 그라디언트 글로우 */
.hs-page-wrapper::before {
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

/* 상단 프로필 영역 */
.hs-hero {
  text-align: center;
  margin-bottom: 1.7rem;
}

/* 아바타 컨테이너: 그라디언트 링 + 살짝 튀어나오는 느낌 */
.hs-hero-avatar {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #10b981);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.28);
  transform: translateY(0);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.hs-hero-avatar img {
  max-width: 210px;
  border-radius: 50%;
  display: block;
  background: #ffffff;
  padding: 3px;
  object-fit: cover;
}

/* hover 시 살짝 떠오르게 */
.hs-hero-avatar:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.34);
}

.hs-hero-title {
  margin-top: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.hs-hero-subtitle {
  font-size: 0.95rem;
  color: #555;
  margin-top: 0.15rem;
}

.hs-hero-intro {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  color: #6b7280;
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
  position: relative;
}

/* 사이드바 제목 아래 그라디언트 라인 */
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

/* 사이드바 탭(버튼) – 배경과 잘 섞이는 유리 느낌 */
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

/* 활성 탭: 더 강한 그라디언트/글로우 */
.hs-sidenav button.hs-sidenav-active {
  background: radial-gradient(circle at top left, #2563eb, #111827);
  color: #fff;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.45);
  transform: translateX(2px);
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

/* 기본: 살짝 아래 + 투명(스크롤 인 애니메이션용) */
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
    border-color 0.25s ease,
    background 0.2s ease;
}

/* 뷰포트에 들어왔을 때 */
.hs-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 활성 섹션: 살짝 더 떠오르고, 테두리 강조 */
.hs-section.active {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
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
  position: relative;
}

/* 활성 섹션 왼쪽 컬러 라인 */
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

  // 헤더 클릭: 토글이지만, 하나만 열리도록
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

  // 사이드바 버튼 클릭
  sideNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      openSection(targetId, true);
    });
  });

  // 스크롤 인 애니메이션: IntersectionObserver
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
    // 구형 브라우저용 fallback
    sections.forEach((section) => section.classList.add("is-visible"));
  }

  // 페이지 로드 시 첫 섹션 자동 오픈 + 즉시 visible 처리
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
    sections[0].classList.add("is-visible");
  }
});
</script>

<div class="hs-page-wrapper">

  <!-- 프로필 영역 -->
  <section class="hs-hero">
    <div class="hs-hero-avatar">
      <img src="/assets/img/KakaoTalk_20250110_182313239.jpg" alt="Hyunsik Min">
    </div>
    <div class="hs-hero-title">M.S. Candidate, Republic of Korea</div>
    <div class="hs-hero-subtitle">AI for Energy · Mobility · Safety</div>
    <div class="hs-hero-intro">
      Researching how AI, foundation models, and graph-based learning can build safer and smarter cities.
    </div>
  </section>

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
