---
layout: page
title: "Publications"
permalink: /publications/
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
.hs-pub-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 배경용 그라디언트 글로우 (홈/뉴스/어바웃과 톤 맞춤) */
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

.hs-pub-intro h1 {
  margin-bottom: 0.3rem;
}

.hs-pub-intro p {
  color: #555;
  font-size: 0.97rem;
}

/* 상단 프로필 하이라이트 카드 */
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

/* 모바일에서 정렬 보정 */
@media (max-width: 600px) {
  .hs-pub-highlight {
    padding: 0.8rem 0.85rem;
  }
  .hs-pub-highlight-links {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* ====== 메인 레이아웃 (사이드바 + 본문) ====== */
.hs-main-layout {
  display: flex;
  gap: 1.5rem;
}

/* ====== 사이드바 네비 (섹션 탭) ====== */
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

/* 유리 느낌 버튼 (홈/뉴스/어바웃과 톤 맞춤) */
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
    border-color 0.25s ease;
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

/* 개별 논문 카드 느낌 */
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

/* 작은 태그/칩 */
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

/* 이미지 공통 스타일 */
.hs-pub-figure {
  text-align: center;
  margin: 0.75rem 0 0.9rem;
}

.hs-pub-figure img {
  width: 100%;
  max-width: 850px;
  border-radius: 10px;
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

  // 헤더 클릭: 토글 + 하나만 열리도록
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

  // 페이지 로드 시 첫 섹션 자동 오픈 (2025 섹션) + 즉시 visible 처리
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
    sections[0].classList.add("is-visible");
  }
});
</script>

<div class="hs-pub-wrapper">

  <section class="hs-pub-intro">
    <h1>Publications</h1>
    <p>
      Below is a selected list of my <strong>first-author peer-reviewed publications</strong>.<br>
      Representative figures are included for key projects.
    </p>

    <!-- 🔹 상단 Profiles 하이라이트 -->
    <div class="hs-pub-highlight">
      <div class="hs-pub-highlight-main">
        <div class="hs-pub-highlight-title">
          <span class="hs-chip">Scholar &amp; network</span>
          <span class="hs-pub-highlight-label">Profiles</span>
        </div>
        <div class="hs-pub-highlight-links">
          <div>
            📚 <strong>Google Scholar</strong><br>
            <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en"
               target="_blank" rel="noopener">
              scholar.google.com/citations?user=2AUQlE8AAAAJ&amp;hl=en
            </a>
          </div>
          <div>
            🔗 <strong>LinkedIn</strong><br>
            <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/"
               target="_blank" rel="noopener">
              linkedin.com/in/hyunsik-min-9ba072346
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="hs-main-layout">
    <!-- 사이드바 네비 -->
    <aside class="hs-sidebar">
      <div class="hs-sidebar-title">Sections</div>
      <div class="hs-sidenav">
        <button type="button" data-target="pub-2025">2025 — Master’s (SCI(E) &amp; Intl.)</button>
        <button type="button" data-target="pub-2024-scie">2024 — Undergraduate SCI(E)</button>
        <button type="button" data-target="pub-2024-domestic">2024–2025 — Domestic</button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 (아코디언 섹션들) -->
    <main class="hs-main-content">

      <!-- 2025 — Master’s Research -->
      <section id="pub-2025" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">🟦 2025 — Master’s Research (SCI(E) &amp; International)</div>
            <div class="hs-section-tag">First-author international publications</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item">
              <h3>2. TRACS-LLM: LLM-based traffic accident criminal sentencing prediction focusing on imprisonment, probation, and fines</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">LLM · Legal AI</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Artificial Intelligence and Law</strong>, 1–22 (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/TRACM_LLM_framework.png"
                     alt="TRACS-LLM Framework">
              </div>

              <p class="hs-pub-desc">
                A large-language-model-based judgement prediction framework (TRACS-LLM) that focuses on sentencing
                outcomes in road traffic accident cases, including imprisonment, probation, and fines. The system
                leverages legal text, structured case attributes, and LLM-based reasoning to provide explainable
                predictions that can support legal practitioners and traffic safety policy.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>1. SolarNexus: A deep learning framework for adaptive photovoltaic power generation forecasting and scalable management</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">Energy · Time series</span>
                <em>Hyunsik Min</em>, Byeongjoon Noh<br>
                <strong>Applied Energy</strong>, 391, 125848 (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/SolarNexus_framework.png"
                     alt="SolarNexus Framework"
                     style="margin-bottom:1rem;">
                <img src="/assets/img/SolarNexus_TCN.png"
                     alt="SolarNexus TCN-based Forecaster">
              </div>

              <p class="hs-pub-desc">
                SolarNexus proposes an adaptive deep-learning-based PV power forecasting framework tightly integrated
                with scalable plant-level management. By combining temporal convolutional networks (TCNs) with
                operational control logic, it enables robust forecasting under rapidly changing weather conditions
                and supports data-driven decision-making in smart-grid environments.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2024 — Undergraduate SCI(E) -->
      <section id="pub-2024-scie" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">🟩 2024 — Undergraduate First-Author SCI(E)</div>
            <div class="hs-section-tag">PV forecasting · Undergraduate work</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item">
              <h3>SolarFlux predictor: a novel deep learning approach for photovoltaic power forecasting in South Korea</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">Energy · Deep learning</span>
                <em>Hyunsik Min</em>, S. Hong, J. Song, B. Son, B. Noh, J. Moon<br>
                <strong>Electronics</strong>, 13(11), 2071 (2024).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/SolarFlux_framework.png"
                     alt="SolarFlux Predictor Framework">
              </div>

              <p class="hs-pub-desc">
                SolarFlux predictor introduces a deep learning model tailored to PV generation forecasting in South
                Korean environments, capturing regional irradiance patterns, seasonal variability, and sensor
                characteristics. The study demonstrates the benefits of data-driven PV forecasting for grid stability
                and renewable energy integration.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 2024–2025 — Domestic Journals & Conferences -->
      <section id="pub-2024-domestic" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">🟨 2024–2025 — Domestic Journals &amp; Conferences (First Author, in Korean)</div>
            <div class="hs-section-tag">Domestic journals &amp; conferences</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <div class="hs-pub-item">
              <h3>Temporal Graph Cross Attention 기반 전방 차량 궤적 예측</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">Autonomous driving · TGCA</span>
                H. Min, B. Noh<br>
                대한교통학회 제93회 학술발표회 (2025).
              </div>

              <div class="hs-pub-figure">
                <img src="/assets/img/TGCA_framework.png"
                     alt="Temporal Graph Cross Attention Framework"
                     style="margin-bottom:1rem;">
                <img src="/assets/img/TGCA_model.png"
                     alt="TGCA Model Architecture">
              </div>

              <p class="hs-pub-desc">
                A front-vehicle trajectory prediction framework based on Temporal Graph Cross Attention (TGCA),
                which models spatio-temporal interactions among surrounding vehicles for anticipatory autonomous
                driving in naturalistic traffic environments.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>Natural Language Processing-based Judgement Prediction System for Road Traffic Accidents: Focused on Text Information for Traffic Accident Situations</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">NLP · Legal analytics</span>
                <em>Hyunsik Min</em>, J. Yun, B. Noh<br>
                <strong>Journal of Korean Society of Transportation</strong>, 42(4), 385–397 (2024).
              </div>

              <p class="hs-pub-desc">
                A judgement prediction system that processes textual descriptions of road traffic accidents using
                NLP techniques, providing case-level outcome predictions for use in transportation safety and
                legal analytics.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>도시 환경 내 교통소음 인식 및 분류를 위한 모델 개발</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">Urban noise</span>
                민현식, 노병준, 우지영<br>
                한국컴퓨터정보학회 학술발표논문집, 32(2), 49–52 (2024).
              </div>

              <p class="hs-pub-desc">
                A model for recognizing and classifying urban traffic noise, aimed at supporting noise mapping and
                urban environmental monitoring.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>LLM기반 교통사고 판결예측 시스템</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">LLM · Traffic law</span>
                민현식, 노병준<br>
                한국ITS학회 학술대회, 811–816 (2024).
              </div>

              <p class="hs-pub-desc">
                A Korean-language LLM-based system design for traffic accident judgement prediction, focusing on
                domestic court decision patterns and legal documents.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>자연어처리 기반의 도로교통사고 판결예측 시스템</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">NLP · Traffic law</span>
                민현식, 윤준영, 노병준<br>
                한국ITS학회 학술대회, 275–279 (2024).
              </div>

              <p class="hs-pub-desc">
                An NLP-based baseline framework for predicting court decisions in road traffic accident cases
                using structured and unstructured textual information.
              </p>
            </div>

            <div class="hs-pub-item">
              <h3>Mask R-CNN 모델을 활용한 파노라마 방사선 이미지 내 치아 분할 및 식별 방법</h3>
              <div class="hs-pub-meta">
                <span class="hs-chip">Medical imaging</span>
                민현식, 노병준<br>
                한국통신학회 인공지능 학술대회 (in Korean).
              </div>

              <p class="hs-pub-desc">
                A method for tooth segmentation and identification in panoramic radiographic images using Mask R-CNN,
                contributing to automated dental imaging analysis.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  </div>
</div>
