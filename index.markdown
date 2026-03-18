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
  margin-bottom: 1.8rem;
}

.hs-hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 1.4rem;
  align-items: stretch;
}

.hs-hero-copy,
.hs-hero-visual-panel {
  border-radius: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.1);
}

.hs-hero-copy {
  padding: 1.55rem 1.5rem 1.35rem;
}

.hs-hero-copy-top {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.hs-hero-copy-main {
  text-align: left;
}

.hs-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.68rem;
  border-radius: 999px;
  background: rgba(29, 78, 216, 0.09);
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  width: 116px;
  height: 116px;
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
  margin-top: 0.6rem;
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

.hs-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.15rem 0 0;
}

.hs-stat-card {
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.hs-stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
}

.hs-stat-label {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.83rem;
  color: #6b7280;
}

.hs-hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.hs-hero-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.62rem 1rem;
  border-radius: 999px;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.hs-hero-actions a:hover {
  transform: translateY(-1px);
}

.hs-action-primary {
  background: linear-gradient(135deg, #2563eb, #0f172a);
  color: #fff;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.28);
}

.hs-action-secondary {
  background: rgba(255, 255, 255, 0.86);
  color: #111827;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.hs-feature-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 0 0 1.5rem;
}

.hs-hero-visual-panel {
  position: relative;
  overflow: hidden;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    linear-gradient(160deg, rgba(15, 23, 42, 0.96), rgba(29, 78, 216, 0.94));
  color: #e5eefc;
}

.hs-hero-visual-panel::before {
  content: "";
  position: absolute;
  inset: auto -10% -18% auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(110, 231, 183, 0.3), transparent 70%);
}

.hs-hero-visual-copy {
  position: relative;
  z-index: 1;
}

.hs-hero-visual-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 238, 252, 0.72);
}

.hs-hero-visual-panel h2 {
  margin: 0.55rem 0 0.55rem;
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
  color: #ffffff;
}

.hs-hero-visual-panel p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(229, 238, 252, 0.88);
}

.hs-hero-visual-art {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.hs-focus-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}

.hs-focus-card {
  padding: 0.85rem 0.9rem;
  border-radius: 18px;
  background: var(--color-card-strong);
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.hs-focus-label {
  display: inline-flex;
  margin-bottom: 0.38rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.hs-focus-card p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.65;
  color: #3f4d63;
}

.hs-feature-card {
  padding: 1rem 1.05rem;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
}

.hs-feature-kicker {
  display: inline-flex;
  margin-bottom: 0.45rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #2563eb;
}

.hs-feature-card h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.hs-feature-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
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
@media (max-width: 980px) {
  .hs-hero-shell {
    grid-template-columns: 1fr;
  }

  .hs-focus-grid {
    grid-template-columns: 1fr;
  }
}

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

@media (max-width: 760px) {
  .hs-hero-copy {
    padding: 1.2rem 1rem 1.05rem;
  }

  .hs-hero-copy-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .hs-hero-visual-panel {
    padding: 1rem;
  }

  .hs-hero-stats,
  .hs-feature-strip,
  .hs-focus-grid {
    grid-template-columns: 1fr;
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
    <div class="hs-hero-shell">
      <div class="hs-hero-copy">
        <div class="hs-hero-eyebrow">Research Portfolio</div>
        <div class="hs-hero-copy-top">
          <div class="hs-hero-avatar">
            <img src="/assets/img/avatar.png" alt="Hyunsik Min" fetchpriority="high">
          </div>
          <div class="hs-hero-copy-main">
            <div class="hs-hero-title">Hyunsik Min</div>
            <div class="hs-hero-subtitle">M.S. Candidate, Republic of Korea</div>
            <div class="hs-hero-intro">
              Building <strong>AI systems</strong> for <strong>safer mobility</strong>, <strong>resilient energy</strong>, and <strong>smarter cities</strong>.
            </div>
          </div>
        </div>
        <div class="hs-hero-stats">
          <div class="hs-stat-card">
            <span class="hs-stat-value">3</span>
            <span class="hs-stat-label">First-author SCI(E) papers</span>
          </div>
          <div class="hs-stat-card">
            <span class="hs-stat-value">2</span>
            <span class="hs-stat-label">National research programs</span>
          </div>
          <div class="hs-stat-card">
            <span class="hs-stat-value">3</span>
            <span class="hs-stat-label">Core domains: mobility, energy, safety</span>
          </div>
        </div>
        <div class="hs-hero-actions">
          <a class="hs-action-primary" href="/publications">View Publications</a>
          <a class="hs-action-secondary" href="/about">About Me</a>
          <a class="hs-action-secondary" href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&amp;hl=en" target="_blank" rel="noopener">Google Scholar</a>
          <a class="hs-action-secondary" href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">LinkedIn</a>
        </div>
      </div>
      <div class="hs-hero-visual-panel">
        <div class="hs-hero-visual-copy">
          <div class="hs-hero-visual-kicker">Current Themes</div>
          <h2>Connected AI for infrastructure, decision-making, and public systems</h2>
          <p>Research spanning trajectory prediction, photovoltaic forecasting, and AI-supported safety analysis, presented as one coherent systems portfolio.</p>
        </div>
        <img class="hs-hero-visual-art" src="/assets/img/research-constellation.svg" alt="Abstract illustration connecting mobility, energy, and safety research areas." loading="eager">
      </div>
    </div>
    <div class="hs-focus-grid">
      <article class="hs-focus-card">
        <span class="hs-focus-label">Mobility</span>
        <p>Trajectory prediction and anticipatory modeling for trustworthy autonomous driving.</p>
      </article>
      <article class="hs-focus-card">
        <span class="hs-focus-label">Energy</span>
        <p>Solar forecasting and adaptive control for resilient grid-scale decision support.</p>
      </article>
      <article class="hs-focus-card">
        <span class="hs-focus-label">Safety</span>
        <p>Legal AI and structured interaction analysis for risk-aware public applications.</p>
      </article>
    </div>
  </section>

  <section class="hs-feature-strip">
    <article class="hs-feature-card">
      <span class="hs-feature-kicker">Research</span>
      <h3>Mobility AI</h3>
      <p>Trajectory prediction, anticipatory driving, and trustworthy decision support for future transportation systems.</p>
    </article>
    <article class="hs-feature-card">
      <span class="hs-feature-kicker">Energy</span>
      <h3>Smart-Grid Forecasting</h3>
      <p>PV forecasting and adaptive energy management for resilient, data-driven grid operations.</p>
    </article>
    <article class="hs-feature-card">
      <span class="hs-feature-kicker">Impact</span>
      <h3>Applied AI for Society</h3>
      <p>Research framed for deployment in urban infrastructure, legal-safety systems, and public services.</p>
    </article>
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
            <div class="hs-section-tag">Contact / Profiles</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>
              <span class="hs-chip">Primary contact</span>
            </p>
            <ul>
              <li>Email: <a href="mailto:minun001@sch.ac.kr">minun001@sch.ac.kr</a></li>
              <li>GitHub: <a href="https://github.com/minun001" target="_blank" rel="noopener">github.com/minun001</a></li>
              <li>LinkedIn: <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">linkedin.com/in/hyunsik-min-9ba072346</a></li>
              <li>Google Scholar: <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en" target="_blank" rel="noopener">scholar profile</a></li>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <ul>
              <li><strong>M.S. Candidate</strong>, Future Convergence Technology, Soonchunhyang University</li>
              <li><strong>3 first-author SCI(E) papers</strong>
                <ul>
                  <li>1 as an undergraduate student</li>
                  <li>2 in the first semester of the M.S. program</li>
                </ul>
              </li>
              <li>Active in <strong>NRF CRC</strong> and <strong>BK21</strong> research programs</li>
              <li>Working across <strong>forecasting</strong>, <strong>mobility intelligence</strong>, and <strong>AI-based decision support</strong></li>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>
              My research connects machine learning with transportation systems, energy operations, and socially grounded AI applications.
            </p>
            <p>Representative topics include:</p>
            <ul>
              <li>Solar power forecasting and smart-grid optimization</li>
              <li>Trajectory prediction for anticipatory autonomous driving</li>
              <li>Legal AI for traffic accident judgment prediction</li>
            </ul>
            <p>
              This work has produced <strong>three first-author SCI(E) publications</strong>, including one completed during my undergraduate studies.
            </p>
            <p>
              I am now extending it through collaborative projects and system-oriented research for urban-scale deployment.
            </p>
          </div>
        </div>
      </section>

      <!-- Research Areas -->
      <section id="section-research" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Research Areas</div>
            <div class="hs-section-tag">Energy / Mobility / Safety</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>I am interested in turning modern AI methods into robust tools for complex physical and social systems.</p>
            <ul>
              <li><strong>Foundation Models &amp; VLA</strong><br>
                Foundation models and vision-language-action systems for embodied and multimodal decision-making.
              </li>
              <li><strong>Autonomous Driving &amp; Anticipatory Planning</strong><br>
                Front-vehicle maneuver and trajectory prediction for proactive, trustworthy driving.
              </li>
              <li><strong>Generative AI for Mobility &amp; Safety</strong><br>
                Scenario generation, risk analysis, and behavior modeling for traffic and urban mobility.
              </li>
              <li><strong>Time Series Forecasting for Energy &amp; Mobility</strong><br>
                Data-driven forecasting for smart-grid operation, energy demand, and mobility systems.
              </li>
              <li><strong>AI-based Speaker Diarization &amp; Interaction Analysis</strong><br>
                Speaker diarization and interaction analysis for child-parent CRC conversational data.
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <h3>Front-vehicle Trajectory Prediction for Autonomous Driving</h3>
            <ul>
              <li>Spatio-temporal modeling of front vehicles in natural traffic scenes</li>
              <li>TGCA-based modeling for maneuver intent inference</li>
              <li>Designed for earlier and more reliable driving decisions</li>
            </ul>

            <h3>AI-based Speaker Diarization for CRC Data</h3>
            <ul>
              <li>Speaker diarization and classification for child-parent conversational datasets</li>
              <li>Language models, acoustic embeddings, and diarization pipelines</li>
              <li>Built to support structured educational and clinical analysis</li>
            </ul>

            <h3>Smart Grid &amp; Energy AI</h3>
            <ul>
              <li>Solar PV-based smart grid optimization and energy management</li>
              <li>Forecasting and control strategies for resilient energy operations</li>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">
            <p>Long term, I want to:</p>
            <ul>
              <li>Turn <strong>advanced AI models</strong> into <strong>deployable systems</strong> for infrastructure and mobility</li>
              <li>Contribute research that improves safety, efficiency, and public value in practice</li>
            </ul>
          </div>
        </div>
      </section>

    </main>
  </div>
</div>
