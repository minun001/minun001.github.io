---
layout: page
title: "News"
permalink: /news/
---

<style>
/* ====== Minima 기본 제목/Posts/RSS 숨기기 ====== */
.page .post-list,
.page .rss-subscribe,
.page .page-heading,
.page .post-title {
  display: none !important;
}

/* ====== 전체 레이아웃 / 기본 스타일 ====== */
.hs-news-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 배경용 그라디언트 글로우 (홈과 톤 맞춤) */
.hs-news-wrapper::before {
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

.hs-news-intro {
  margin-bottom: 1.5rem;
}

.hs-news-intro-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.7fr);
  gap: 1rem;
  align-items: stretch;
}

.hs-news-intro-main,
.hs-news-intro-panel {
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
}

.hs-news-intro-main {
  padding: 1.2rem 1.25rem 1rem;
  background: rgba(255, 255, 255, 0.9);
}

.hs-news-intro-panel {
  padding: 1rem;
  background: linear-gradient(155deg, rgba(17, 24, 39, 0.96), rgba(22, 101, 52, 0.9));
  color: #dcfce7;
}

.hs-news-intro-panel h2 {
  margin: 0.3rem 0 0.45rem;
  color: #ffffff;
  font-size: 1.35rem;
}

.hs-news-intro-panel p {
  margin: 0;
  color: rgba(220, 252, 231, 0.84);
  font-size: 0.9rem;
}

.hs-news-intro-panel img {
  width: 100%;
  margin-top: 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.hs-news-intro-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(220, 252, 231, 0.7);
}

.hs-news-intro h1 {
  margin-bottom: 0.3rem;
}

.hs-news-intro p {
  color: #555;
  font-size: 0.97rem;
}

/* ====== 메인 레이아웃 (사이드바 + 본문) ====== */
.hs-news-main-layout {
  display: flex;
  gap: 1.5rem;
}

/* ====== 사이드바 네비 (연도 탭) ====== */
.hs-news-sidebar {
  flex: 0 0 180px;
  position: sticky;
  top: 100px;
  align-self: flex-start;
  max-height: calc(100vh - 120px);
}

.hs-news-sidebar-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 0.5rem;
  position: relative;
}

/* 사이드바 제목 아래 그라디언트 라인 */
.hs-news-sidebar-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #10b981);
}

/* 유리 느낌 버튼 (홈과 톤 맞춤) */
.hs-news-sidenav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hs-news-sidenav button {
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

.hs-news-sidenav button:hover {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  transform: translateX(1px);
}

/* 활성 탭: 더 강한 그라디언트/글로우 */
.hs-news-sidenav button.hs-news-sidenav-active {
  background: radial-gradient(circle at top left, #2563eb, #111827);
  color: #fff;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.45);
  transform: translateX(2px);
}

/* 모바일일 때 사이드바를 위로 올리고 가로형 탭처럼 */
@media (max-width: 920px) {
  .hs-news-intro-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .hs-news-main-layout {
    flex-direction: column;
  }
  .hs-news-sidebar {
    position: static;
    width: 100%;
    max-height: none;
    order: -1;
  }
  .hs-news-sidenav {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .hs-news-sidenav button {
    flex: 0 0 auto;
  }
}

/* ====== 연도 섹션(아코디언 카드) ====== */
.hs-news-main-content {
  flex: 1;
}

/* 기본: 살짝 아래 + 투명(스크롤 인 애니메이션용) */
.hs-news-section {
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

/* 뷰포트에 들어왔을 때 */
.hs-news-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 활성 섹션: 살짝 더 떠오르고, 테두리 강조 */
.hs-news-section.active {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
}

/* 헤더(클릭 영역) */
.hs-news-year-header {
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
.hs-news-year-header::before {
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

.hs-news-section.active .hs-news-year-header::before {
  opacity: 1;
}

.hs-news-year-title {
  font-size: 1.02rem;
  font-weight: 600;
}

.hs-news-year-tag {
  font-size: 0.8rem;
  color: #888;
}

/* 아이콘 (열림/닫힘 표시) */
.hs-news-year-icon {
  margin-left: 0.75rem;
  font-size: 1rem;
  color: #888;
  transition: transform 0.2s;
}

.hs-news-section.active .hs-news-year-icon {
  transform: rotate(90deg);
}

/* 내용(애니메이션 영역) */
.hs-news-year-body-wrap {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.25s ease, opacity 0.2s ease;
  opacity: 0;
}

.hs-news-section.active .hs-news-year-body-wrap {
  opacity: 1;
}

.hs-news-year-body {
  padding: 1rem 1.1rem 1.1rem;
  font-size: 0.95rem;
  color: #333;
}

/* 개별 뉴스 아이템 카드 느낌 */
.hs-news-item {
  padding: 0.75rem 0.8rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #eee;
  background: #ffffff;
  margin-bottom: 0.7rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.12s ease,
    background 0.18s ease;
}

.hs-news-item h3 {
  font-size: 0.98rem;
  margin-bottom: 0.25rem;
}

.hs-news-item .hs-news-meta {
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.4rem;
}

.hs-news-item p {
  margin-bottom: 0.35rem;
}

.hs-news-item:last-child {
  margin-bottom: 0;
}

/* 뉴스 아이템 hover 효과 */
.hs-news-item:hover {
  background: #f9fafb;
  border-color: rgba(148, 163, 184, 0.6);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

/* 작은 태그 느낌 */
.hs-news-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #f4f4ff;
  color: #555;
  font-size: 0.78rem;
  margin-right: 0.25rem;
}

/* 모바일에서 패딩/폰트 약간 조정 */
@media (max-width: 600px) {
  .hs-news-year-header {
    padding: 0.75rem 0.85rem;
  }
  .hs-news-year-body {
    padding: 0.85rem 0.9rem 0.95rem;
  }
  .hs-news-item {
    padding: 0.7rem 0.75rem 0.75rem;
  }
}

/* ====== Night theme readability for year header ====== */
body.theme-night .hs-news-year-title,
body.theme-night .hs-news-year-tag {
  color: #111827 !important;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const yearSections = Array.from(document.querySelectorAll(".hs-news-section"));
  const sideNavButtons = Array.from(document.querySelectorAll(".hs-news-sidenav button[data-target]"));

  function openYear(targetId, scrollIntoView = false) {
    yearSections.forEach(section => {
      const bodyWrap = section.querySelector(".hs-news-year-body-wrap");
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
      btn.classList.toggle("hs-news-sidenav-active", btn.dataset.target === targetId);
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

  // 헤더 클릭: 한 번에 하나만 열리도록
  yearSections.forEach(section => {
    const header = section.querySelector(".hs-news-year-header");
    const bodyWrap = section.querySelector(".hs-news-year-body-wrap");
    if (!header || !bodyWrap) return;

    header.addEventListener("click", () => {
      const id = section.getAttribute("id");
      const isActive = section.classList.contains("active");

      if (isActive) {
        section.classList.remove("active");
        bodyWrap.style.maxHeight = "0px";
        sideNavButtons.forEach(btn => {
          if (btn.dataset.target === id) btn.classList.remove("hs-news-sidenav-active");
        });
      } else {
        openYear(id);
      }
    });
  });

  // 사이드바 버튼 클릭
  sideNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      openYear(targetId, true);
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

    yearSections.forEach((section) => observer.observe(section));
  } else {
    // 구형 브라우저용 fallback
    yearSections.forEach((section) => section.classList.add("is-visible"));
  }

  // 첫 연도 자동 오픈 (예: 첫 번째 섹션)
  if (yearSections.length > 0) {
    const firstId = yearSections[0].getAttribute("id");
    openYear(firstId);
    yearSections[0].classList.add("is-visible");
  }
});
</script>

<div class="hs-news-wrapper">

  <section class="hs-news-intro">
    <div class="hs-news-intro-shell">
      <div class="hs-news-intro-main">
        <h1>News &amp; Updates</h1>
        <p>A short timeline of <strong>milestones</strong>, including papers, awards, collaborations, and academic progress.</p>
      </div>
      <aside class="hs-news-intro-panel">
        <div class="hs-news-intro-kicker">Timeline</div>
        <h2>Recent progress, recognitions, and research movement</h2>
        <p>This page captures the pace of the portfolio, from paper acceptances to awards and lab-based project activity.</p>
        <img src="/assets/img/news-timeline.svg" alt="Abstract timeline illustration for news and milestones." loading="lazy">
      </aside>
    </div>
  </section>

  <div class="hs-news-main-layout">

    <!-- 사이드바 연도 네비 -->
    <aside class="hs-news-sidebar">
      <div class="hs-news-sidebar-title">Years</div>
      <div class="hs-news-sidenav">
        <button type="button" data-target="news-2025">2025</button>
        <button type="button" data-target="news-2024">2024</button>
        <button type="button" data-target="news-2023">2023</button>
      </div>
    </aside>

    <!-- 본문: 연도별 아코디언 -->
    <main class="hs-news-main-content">

      <!-- 2025 -->
      <section id="news-2025" class="hs-news-section">
        <div class="hs-news-year-header">
          <div>
            <div class="hs-news-year-title">2025</div>
            <div class="hs-news-year-tag">Recent milestones</div>
          </div>
          <div class="hs-news-year-icon">&rsaquo;</div>
        </div>
        <div class="hs-news-year-body-wrap">
          <div class="hs-news-year-body">

            <div class="hs-news-item">
              <h3>BK21 Overseas Training Program @ Kingston University, UK</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Program</span>
                <strong>Period:</strong> Dec. 2025 - Feb. 2026
              </div>
              <p>
                Selected for the BK21 Overseas Training Program to conduct research at Kingston University in London.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>Applied Energy Paper Accepted (First Author)</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Journal</span>
                <strong>Journal:</strong> <em>Applied Energy</em> (IF = 11.0, Top 10%)</div>
              <p><strong>Title:</strong> <em>SolarNexus: A deep learning framework for adaptive photovoltaic power generation forecasting and scalable management</em></p>
              <p>
                The paper introduces a scalable framework for photovoltaic forecasting and adaptive energy management.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>Artificial Intelligence and Law Paper Accepted (First Author)</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Journal</span>
                <strong>Journal:</strong> <em>Artificial Intelligence and Law</em> (IF = 3.1, Top 10%)</div>
              <p><strong>Title:</strong> <em>TRACS-LLM: LLM-based Traffic Accident Criminal Sentencing Prediction Focusing on Imprisonment, Probation, and Fines</em></p>
              <p>
                The study proposes an LLM-based framework for predicting sentencing outcomes in traffic accident cases.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>Started Building Personal Research Webpage</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Web</span>
              </div>
              <p>
                Launched this site to organize my academic profile, selected papers, and recent updates in one place.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>CRC Project (NRF) Ongoing Research</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Project</span>
                <strong>Program:</strong> NRF CRC
              </div>
              <p>
                Continued developing a <strong>speaker diarization and analysis pipeline</strong> for child-parent CRC data.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2024 -->
      <section id="news-2024" class="hs-news-section">
        <div class="hs-news-year-header">
          <div>
            <div class="hs-news-year-title">2024</div>
            <div class="hs-news-year-tag">Awards &amp; early publications</div>
          </div>
          <div class="hs-news-year-icon">&rsaquo;</div>
        </div>
        <div class="hs-news-year-body-wrap">
          <div class="hs-news-year-body">

            <div class="hs-news-item">
              <h3>Best Paper Award - KSCI Summer Conference 2024 (First Author)</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Award</span>
                <strong>Conference:</strong> 70th Summer Conference of the Korea Computer and Information Science Society
              </div>
              <p><strong>Title:</strong> <em>Urban Traffic Noise Recognition and Classification Model Development</em></p>
              <p>
                My paper on urban traffic noise recognition and classification received the <strong>Best Paper</strong> award.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>First SCI(E) First-Author Publication</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Publication</span>
              </div>
              <p>
                Published my first SCI(E) first-author paper during my undergraduate studies.
              </p>
            </div>

            <div class="hs-news-item">
              <h3>Undergraduate Graduation Thesis Completed</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Milestone</span>
              </div>
              <p>
                Completed my undergraduate thesis on intelligent mobility and moved into the M.S. program.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2023 -->
      <section id="news-2023" class="hs-news-section">
        <div class="hs-news-year-header">
          <div>
            <div class="hs-news-year-title">2023</div>
            <div class="hs-news-year-tag">Lab &amp; research base</div>
          </div>
          <div class="hs-news-year-icon">&rsaquo;</div>
        </div>
        <div class="hs-news-year-body-wrap">
          <div class="hs-news-year-body">

            <div class="hs-news-item">
              <h3>Smart Autonomous &amp; Infrastructure Lab (SAIL) Launched</h3>
              <div class="hs-news-meta">
                <span class="hs-news-chip">Lab</span>
              </div>
              <p>
                Joined SAIL as my main research base for autonomous driving and urban AI research.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  </div>
</div>
