---
layout: page
title: "About"
permalink: /about/
---

<style>
/* ====== Minima 湲곕낯 ?쒕ぉ/Posts ?④린湲?====== */
.page .post-list,
.page .rss-subscribe,
.page .page-heading,
.page .post-title {
  display: none !important;
}

/* ====== ?꾩껜 ?덉씠?꾩썐 / 湲곕낯 ?ㅽ???====== */
.hs-about-wrapper {
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 0;
}

/* 諛곌꼍??洹몃씪?붿뼵??湲濡쒖슦 (???댁뒪? ??留욎땄) */
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

/* ?곷떒 ???대?吏 */
.hs-about-hero {
  margin-bottom: 1.35rem;
  position: relative;
}

.hs-about-hero img {
  width: 100%;
  max-height: 470px;
  object-fit: cover;
  object-position: center 38%;
  border-radius: 28px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.55);
}

/* ?곷떒 ?꾨줈???섏씠?쇱씠??移대뱶 */
.hs-about-highlight {
  margin-bottom: 1.95rem;
  padding: 1.15rem 1.2rem;
  border-radius: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(244, 247, 252, 0.94));
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.1);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.8fr);
  gap: 1.15rem 1.45rem;
  align-items: stretch;
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

.hs-about-summary {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.92rem;
  color: #374151;
  line-height: 1.65;
}

.hs-about-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(155deg, rgba(15, 23, 42, 0.96), rgba(29, 78, 216, 0.9));
  color: #dbeafe;
  overflow: hidden;
  position: relative;
}

.hs-about-visual::before {
  content: "";
  position: absolute;
  right: -32px;
  bottom: -42px;
  width: 170px;
  height: 170px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(110, 231, 183, 0.34), transparent 68%);
}

.hs-about-visual-copy,
.hs-about-visual-stats {
  position: relative;
  z-index: 1;
}

.hs-about-visual-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(219, 234, 254, 0.72);
}

.hs-about-visual h2 {
  margin: 0.5rem 0 0.45rem;
  color: #fff;
  font-size: 1.45rem;
}

.hs-about-visual p {
  margin: 0;
  color: rgba(219, 234, 254, 0.86);
  font-size: 0.92rem;
  line-height: 1.65;
}

.hs-about-visual img {
  width: 100%;
  margin: 0.9rem 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hs-about-visual-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.hs-about-visual-stat {
  padding: 0.7rem 0.75rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hs-about-visual-stat strong {
  display: block;
  margin-bottom: 0.15rem;
  color: #fff;
  font-size: 1rem;
}

.hs-about-visual-stat span {
  display: block;
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgba(219, 234, 254, 0.76);
}

/* ?쒓렇 ??蹂??*/
.hs-chip-primary {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.hs-chip-soft {
  background: rgba(148, 163, 184, 0.16);
  color: #374151;
}

/* 紐⑤컮???섏씠?쇱씠???뺣젹 */
@media (max-width: 900px) {
  .hs-about-highlight {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hs-about-highlight {
    padding: 0.85rem 0.95rem;
  }

  .hs-about-visual-stats {
    grid-template-columns: 1fr;
  }
}

/* ====== 硫붿씤 ?덉씠?꾩썐 (?ъ씠?쒕컮 + 蹂몃Ц) ====== */
.hs-main-layout {
  display: flex;
  gap: 1.5rem;
}

/* ?ъ씠?쒕컮 ?ㅻ퉬 */
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

/* ?ъ씠?쒕컮 ?쒕ぉ ?꾨옒 洹몃씪?붿뼵???쇱씤 */
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

/* ?좊━ ?먮굦 踰꾪듉 (???댁뒪? ??留욎땄) */
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

/* ?쒖꽦 ?? ??媛뺥븳 洹몃씪?붿뼵??湲濡쒖슦 */
.hs-sidenav button.hs-sidenav-active {
  background: radial-gradient(circle at top left, #2563eb, #111827);
  color: #fff;
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.45);
  transform: translateX(2px);
}

/* 紐⑤컮?쇱씪 ???ъ씠?쒕컮瑜??꾨줈 ?щ━怨?媛濡쒗삎 ??쿂??*/
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

/* ====== ?뱀뀡(?꾩퐫?붿뼵 移대뱶) ?ㅽ???====== */
.hs-main-content {
  flex: 1;
}

/* 湲곕낯: ?댁쭩 ?꾨옒 + ?щ챸(?ㅽ겕濡????좊땲硫붿씠?섏슜) */
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

/* 酉고룷?몄뿉 ?ㅼ뼱?붿쓣 ??*/
.hs-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ?쒖꽦 ?뱀뀡: ?댁쭩 ???좎삤瑜닿퀬, ?뚮몢由?媛뺤“ */
.hs-section.active {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
}

/* ?ㅻ뜑(?대┃ ?곸뿭) */
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

/* ?쒖꽦 ?뱀뀡 ?쇱そ 而щ윭 ?쇱씤 */
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

/* ?꾩씠肄?(?대┝/?ロ옒 ?쒖떆) */
.hs-section-icon {
  margin-left: 0.75rem;
  font-size: 1rem;
  color: #888;
  transition: transform 0.2s;
}

.hs-section.active .hs-section-icon {
  transform: rotate(90deg);
}

/* ?댁슜(?좊땲硫붿씠???곸뿭) */
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

/* ?묒? 媛뺤“ ?띿뒪??/ ?쒓렇 */
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

/* 紐⑤컮???고듃/?⑤뵫 ?쎄컙 以꾩씠湲?*/
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

  // ?ㅻ뜑 ?대┃: ?좉? + ?섎굹留??대━?꾨줉
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

  // ?ъ씠?쒕컮 踰꾪듉 ?대┃
  sideNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      openSection(targetId, true);
    });
  });

  // ?ㅽ겕濡????좊땲硫붿씠?? IntersectionObserver
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
    // 援ы삎 釉뚮씪?곗???fallback
    sections.forEach((section) => section.classList.add("is-visible"));
  }

  // ?섏씠吏 濡쒕뱶 ??泥??뱀뀡 ?먮룞 ?ㅽ뵂 (Education) + 利됱떆 visible 泥섎━
  if (sections.length > 0) {
    const firstId = sections[0].getAttribute("id");
    openSection(firstId);
    sections[0].classList.add("is-visible");
  }
});
</script>

<div class="hs-about-wrapper">

  <!-- ?곷떒 ???대?吏 -->
  <section class="hs-about-hero">
    <img src="/assets/img/KakaoTalk_20250110_182313239.jpg"
         alt="Hyunsik Min"
         loading="eager">
  </section>

  <!-- ?곷떒 ?꾨줈???섏씠?쇱씠??-->
  <section class="hs-about-highlight">
    <div class="hs-about-highlight-main">
      <div class="hs-about-highlight-title">
        <span class="hs-about-name">Hyunsik Min</span>
        <span class="hs-about-role">M.S. Candidate in Future Convergence Technology</span>
      </div>
      <div class="hs-about-meta">
        Smart Autonomous &amp; Infrastructure Lab (SAIL), Soonchunhyang University / Asan, Korea
      </div>
      <div class="hs-about-tags">
        <span class="hs-chip hs-chip-primary">Autonomous driving</span>
        <span class="hs-chip hs-chip-primary">Mobility &amp; safety AI</span>
        <span class="hs-chip hs-chip-soft">Energy forecasting</span>
        <span class="hs-chip hs-chip-soft">Legal AI &amp; NLP</span>
      </div>
      <div class="hs-about-summary">
        My work spans <strong>transportation AI</strong>, <strong>energy forecasting</strong>, and <strong>decision-support systems</strong>, with an emphasis on research that remains useful beyond the lab.
      </div>
    </div>
    <div class="hs-about-visual">
      <div class="hs-about-visual-copy">
        <div class="hs-about-visual-kicker">Profile</div>
        <h2>Research shaped around systems that people can actually use</h2>
        <p>From autonomous driving to energy operations, the goal is to make advanced models readable, reliable, and deployable.</p>
      </div>
      <img src="/assets/img/about-systems-map.svg" alt="Abstract systems map representing mobility, energy, and AI decision support." loading="lazy">
      <div class="hs-about-visual-stats">
        <div class="hs-about-visual-stat"><strong>3</strong><span>First-author SCI(E) papers</span></div>
        <div class="hs-about-visual-stat"><strong>2</strong><span>National research programs</span></div>
        <div class="hs-about-visual-stat"><strong>2025</strong><span>M.S. research expansion</span></div>
      </div>
    </div>
  </section>

  <div class="hs-main-layout">
    <!-- ?ъ씠?쒕컮 ?ㅻ퉬 -->
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

    <!-- 硫붿씤 肄섑뀗痢?(?꾩퐫?붿뼵 ?뱀뀡?? -->
    <main class="hs-main-content">

      <!-- Education -->
      <section id="about-education" class="hs-section">
        <div class="hs-section-header">
          <div>
            <div class="hs-section-title">Education</div>
            <div class="hs-section-tag">Academic background</div>
          </div>
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>
                <strong>M.S. in Future Convergence Technology</strong><br>
                <strong>Soonchunhyang University</strong>, Asan, Korea<br>
                <em>Mar. 2025 - Present</em><br>
                - Department of Future Convergence Technology<br>
                - Advisor: <strong>Prof. Byeongjoon Noh</strong>
              </li>
              <br>
              <li>
                <strong>B.Eng. in AI and Big Data</strong><br>
                <strong>Soonchunhyang University</strong>, Asan, Korea<br>
                <em>Mar. 2021 - Feb. 2025</em><br>
                - Department of AI and Big Data<br>
                - GPA: <strong>3.88 / 4.5</strong><br>
                - Thesis: <strong>Temporal Graph Pattern Attention-based Vehicle Trajectory Prediction System: Toward Real-time Road Driving Information</strong><br>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>Encouragement Award, <strong>The 5th Big Data Analytics and Development Contest</strong>, Soonchunhyang University, Korea (<em>Dec. 2021</em>)</li>
              <li>Grand Prize, <strong>2023 Soonchunhyang SW Idea Contest</strong>, Soonchunhyang University / Institute of Information &amp; Communications Technology Planning &amp; Evaluation / Ministry of Science and ICT, Korea (<em>Dec. 2023</em>)</li>
              <li>Grand Prize, <strong>SW Convergence University Ideathon</strong>, Soonchunhyang University, Korea (<em>Jun. 2024</em>)</li>
              <li>Outstanding Paper Award, <strong>The Korea Society of Computer and Information</strong>, Korea (<em>Jul. 2024</em>)</li>
              <li>Excellence Award, <strong>The 1st SW Convergence University Academic Festival</strong>, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
              <li>Silver Medal, <strong>2024 SCHU AI-SW Festival</strong>, Department of AI and Big Data, Soonchunhyang University, Korea (<em>Nov. 2024</em>)</li>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <ul>
              <li>
                <strong>CRC (Convergence Research Center) - Emotionally Intelligent Childcare Convergence Research</strong><br>
                Ministry of Science and ICT / National Research Foundation of Korea (NRF), Korea<br>
                <em>Participating Researcher, Sep. 2024 - Present</em>
              </li>
              <br>
              <li>
                <strong>2nd DSC Planning Living Lab in 2024</strong><br>
                Daejeon-Sejong-Chungnam Regional Innovation Platform, Chungnam National University, Korea<br>
                <em>Project Leader, Aug. 2024 - Nov. 2024</em>
              </li>
              <br>
              <li>
                <strong>BK21 - AIoT-Energy Convergence Technology Regional Innovation Talent Development</strong><br>
                Ministry of Education, Korea<br>
                <em>Participating Researcher, Feb. 2025 - Present</em>
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
          <div class="hs-section-icon">&rsaquo;</div>
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
          <div class="hs-section-icon">&rsaquo;</div>
        </div>
        <div class="hs-section-body-wrap">
          <div class="hs-section-body">

            <p><span class="hs-chip">Primary contact</span></p>
            <ul>
              <li>Email: <a href="mailto:minun001@sch.ac.kr">minun001@sch.ac.kr</a></li>
              <li>GitHub: <a href="https://github.com/minun001" target="_blank" rel="noopener">github.com/minun001</a></li>
              <li>LinkedIn: <a href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">linkedin.com/in/hyunsik-min-9ba072346</a></li>
              <li>Google Scholar: <a href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&hl=en" target="_blank" rel="noopener">scholar.google.com/citations?user=2AUQlE8AAAAJ</a></li>
            </ul>

          </div>
        </div>
      </section>

    </main>
  </div>
</div>

