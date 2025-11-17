---
layout: page
title: "About"
permalink: /about/
---

<style>
/* ====== Minima 기본 제목/Posts 숨기기 ====== */
.page .post-list,
.page .rss-subscribe,
.page .page-heading,
.page .post-title {
  display: none !important;
}

/* ====== 전체 레이아웃 / 기본 스타일 ====== */
.hs-about-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 배경용 그라디언트 글로우 (홈/뉴스와 톤 맞춤) */
.hs-about-wrapper::before {
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

/* 상단 큰 이미지 */
.hs-about-hero {
  margin-bottom: 1.2rem;
}

.hs-about-hero img {
  width: 100%;
  max-height: 450px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
}

/* 상단 프로필 하이라이트 카드 */
.hs-about-highlight {
  margin-bottom: 1.8rem;
  padding: 0.95rem 1.1rem;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: radial-gradient(circle at top left, #f5f7ff, #ffffff);
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.4rem;
  align-items: center;
}

.hs-about-highlight-main {
  flex: 1;
  min-width: 240px;
}

.hs-about-highlight-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.hs-about-name {
  font-size: 1.15rem;
  font-weight: 650;
  color: #111827;
}

.hs-about-role {
  font-size: 0.9rem;
  color: #4b5563;
}

.hs-about-meta {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.4rem;
}

.hs-about-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.78rem;
}

/* 태그 색 변형 */
.hs-chip-primary {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.hs-chip-soft {
  background: rgba(148, 163, 184, 0.16);
  color: #374151;
}

/* 모바일 하이라이트 정렬 */
@media (max-width: 600px) {
  .hs-about-highlight {
    padding: 0.85rem 0.95rem;
  }
}

/* ====== 메인 레이아웃 (사이드바 + 본문) ====== */
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

/* 유리 느낌 버튼 (홈/뉴스와 톤 맞춤) */
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

/* 작은 강조 텍스트 / 태그 */
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

  // 페이지 로드 시 첫 섹션 자동 오픈 (Education) + 즉시 visible 처리
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
    sections[0].classList.add("is-visible");
  }
});
</script>

<div class="hs-about-wrapper">

  <!-- 상단 큰 이미지 + 오버레이 + 텍스트 포함된 히어로 카드 -->
  <section class="hs-about-hero">
    <div class="hs-about-hero-inner">
      <img src="/assets/img/KakaoTalk_20250110_182313239.jpg"
           alt="Hyunsik Min">

      <!-- 오버레이 텍스트 -->
      <div class="hs-about-hero-overlay">
        <h1>Hyunsik Min</h1>
        <p>M.S. Candidate · AI for Mobility, Energy & Safety</p>
      </div>
    </div>
  </section>

  <!-- 상단 프로필 하이라이트 -->
  <section class="hs-about-highlight">
    <div class="hs-about-highlight-main">
      <div class="hs-about-highlight-title">
        <span class="hs-about-name">Hyunsik Min</span>
        <span class="hs-about-role">M.S. Candidate in Future Convergence Technology</span>
      </div>
      <div class="hs-about-meta">
        Smart Autonomous &amp; Infrastructure Lab (SAIL), Soonchunhyang University · Asan, Korea
      </div>
      <div class="hs-about-tags">
        <span class="hs-chip hs-chip-primary">Autonomous driving</span>
        <span class="hs-chip hs-chip-primary">Mobility &amp; safety AI</span>
        <span class="hs-chip hs-chip-soft">Energy forecasting</span>
        <span class="hs-chip hs-chip-soft">Legal AI &amp; NLP</span>
      </div>
    </div>
  </section>


  <div class="hs-main-layout">
    <!-- 사이드바 네비 -->
    <aside class="hs-sidebar">
      <div class="hs-sidebar-title">Sections</div>
      <div class="hs-sidenav">
        <button type="button" data-target="about-education">Education</button>
        <button type="button" data-target="about-honors">Honors &amp; Awards</button>
        <button type="button" data-target="about-projects">Research Projects</button>
        <button type="button" data-target="about-skills">Skills</button>
        <button type="button" data-target="about-profiles">Profiles &amp; Contact</button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 (아코디언 섹션들) -->
    <main class="hs-main-content">

      <!-- Education -->
      <section id="about-education" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Education</div>
            <div class="hs-section-tag">Academic background</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>
                <strong>M.S. in Future Convergence Technology</strong><br>
                <strong>Soonchunhyang University</strong>, Asan, Korea<br>
                <em>Mar. 2025 – Present</em><br>
                - Department of Future Convergence Technology<br>
                - Advisor: <strong>Prof. Byeongjoon Noh</strong>
              </li>
              <br>
              <li>
                <strong>B.Eng. in AI and Big Data</strong><br>
                <strong>Soonchunhyang University</strong>, Asan, Korea<br>
                <em>Mar. 2021 – Feb. 2025</em><br>
                - Department of AI and Big Data<br>
                - GPA: <strong>3.88 / 4.5</strong><br>
                - Thesis: <strong>“Temporal Graph Pattern Attention-based Vehicle Trajectory Prediction System: Toward Real-time Road Driving Information”</strong><br>
                - Advisor: <strong>Prof. Byeongjoon Noh</strong>
              </li>
            </ul>

          </div>
        </div>
      </section>

      <!-- Honors & Awards -->
      <section id="about-honors" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Honors &amp; Awards</div>
            <div class="hs-section-tag">Recognition</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>Encouragement Award, <strong>The 5th Big Data Analytics and Development Contest</strong>, Soonchunhyang University, Korea (<em>Dec. 2021</em>)</li>
              <li>Grand Prize, <strong>2023 Soonchunhyang SW Idea Contest</strong>, Soonchunhyang University / Institute of Information &amp; Communications Technology Planning &amp; Evaluation / Ministry of Science and ICT, Korea (<em>Dec. 2023</em>)</li>
              <li>Grand Prize, <strong>SW Convergence University Ideathon</strong>, Soonchunhyang University, Korea (<em>Jun. 2024</em>)</li>
              <li>Outstanding Paper Award, <strong>The Korea Society of Computer and Information</strong>, Korea (<em>Jul. 2024</em>)</li>
              <li>Excellence Award, <strong>The 1st SW Convergence University Academic Festival</strong>, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
              <li>Silver Medal, <strong>2024 SCHU AI–SW Festival</strong>, Department of AI and Big Data, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
              <li>Special Prize, <strong>2024 Soonchunhyang SW Idea Contest</strong>, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
              <li>Grand Prize, <strong>2024 Portfolio (Capstone) Competition</strong>, SW Venture Startup Academy Center, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
            </ul>

          </div>
        </div>
      </section>

      <!-- Research Projects -->
      <section id="about-projects" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Research Projects</div>
            <div class="hs-section-tag">Project experience</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>
                <strong>CRC (Convergence Research Center) – Emotionally Intelligent Childcare Convergence Research</strong><br>
                Ministry of Science and ICT / National Research Foundation of Korea (NRF), Korea<br>
                <em>Participating Researcher, Sep. 2024 – Present</em>
              </li>
              <br>
              <li>
                <strong>2nd DSC Planning Living Lab in 2024</strong><br>
                Daejeon–Sejong–Chungnam Regional Innovation Platform, Chungnam National University, Korea<br>
                <em>Project Leader, Aug. 2024 – Nov. 2024</em>
              </li>
              <br>
              <li>
                <strong>BK21 – AIoT-Energy Convergence Technology Regional Innovation Talent Development</strong><br>
                Ministry of Education, Korea<br>
                <em>Participating Researcher, Feb. 2025 – Present</em>
              </li>
            </ul>

          </div>
        </div>
      </section>

      <!-- Skills -->
      <section id="about-skills" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Skills</div>
            <div class="hs-section-tag">Tools &amp; stacks</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <p><strong>Programming</strong><br>
              Python, R, Java
            </p>

            <p><strong>Deep Learning &amp; Machine Learning</strong><br>
              Scikit-learn, PyTorch, Keras, TensorFlow
            </p>

            <p><strong>Data Analysis &amp; Visualization</strong><br>
              NumPy, pandas, Matplotlib, Seaborn, Tableau, NodeXL
            </p>

          </div>
        </div>
      </section>

      <!-- Profiles & Contact -->
      <section id="about-profiles" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Profiles &amp; Contact</div>
            <div class="hs-section-tag">Get in touch</div>
          </div>
          <div class="hs-section-icon">▶</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <p><span class="hs-chip">Primary contact</span></p>
            <ul>
              <li>📧 Email: <a href="mailto:minun001@sch.ac.kr">minun001@sch.ac.kr</a></li>
              <li>💻 GitHub: <a href="https://github.com/minun001" target="_blank" rel="noopener">github.com/minun001</a></li>
              <li>🔗 LinkedIn: <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">linkedin.com/in/hyunsik-min-9ba072346</a></li>
              <li>📚 Google Scholar: <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en" target="_blank" rel="noopener">scholar.google.com/citations?user=2AUQlE8AAAAJ</a></li>
            </ul>

          </div>
        </div>
      </section>

    </main>
  </div>
</div>
