---
layout: page
title: "Home"
permalink: /
description: "AI researcher building deployable systems for autonomous driving, energy forecasting, and safety-aware public AI."
---

<style>
.landing-home{position:relative;color:var(--text-body)}
.landing-home section+section{margin-top:1.2rem}
.landing-hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:1.15rem;align-items:stretch}
.landing-panel,.landing-card{border-radius:28px;border:1px solid var(--border-soft);background:var(--bg-card);box-shadow:var(--shadow-soft);backdrop-filter:blur(16px)}
.landing-hero-copy{padding:1.5rem;overflow:hidden;position:relative}
.landing-hero-copy::before{content:"";position:absolute;inset:auto -10% -35% 45%;height:16rem;background:radial-gradient(circle,rgba(59,130,246,.16),transparent 64%);pointer-events:none}
.landing-kicker{display:inline-flex;align-items:center;gap:.45rem;padding:.28rem .72rem;border-radius:999px;background:rgba(255,255,255,.48);box-shadow:inset 0 0 0 1px var(--border-soft);color:var(--text-soft);font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.landing-kicker::before{content:"";width:.55rem;height:.55rem;border-radius:999px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
.landing-title{margin:1rem 0 .45rem;font-size:clamp(2.6rem,5vw,4.6rem)}
.landing-subtitle{margin:0 0 .4rem;color:var(--text-soft);font-size:.92rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.landing-intro{max-width:42rem;margin:0;font-size:1.05rem}
.landing-actions,.landing-links{display:flex;flex-wrap:wrap;gap:.7rem}.landing-actions{margin-top:1.15rem}
.landing-button,.landing-button-soft{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.8rem 1.05rem;border-radius:999px;font-weight:800;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
.landing-button{background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff;box-shadow:0 18px 36px rgba(37,99,235,.24)}
.landing-button-soft{background:rgba(255,255,255,.45);color:var(--text-title);box-shadow:inset 0 0 0 1px var(--border-soft)}
.landing-button:hover,.landing-button-soft:hover{transform:translateY(-2px)}
.landing-proof-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin-top:1.25rem}
.landing-proof{padding:.95rem 1rem;border-radius:22px;background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1px var(--border-soft)}
.landing-proof strong{display:block;margin-bottom:.2rem;font-size:1.4rem}
.landing-hero-visual{padding:1.25rem;position:relative;overflow:hidden;background:radial-gradient(circle at top left,rgba(96,165,250,.18),transparent 30%),linear-gradient(155deg,rgba(15,23,42,.94),rgba(30,41,59,.96));color:#dbeafe}
.landing-hero-visual::before,.landing-hero-visual::after{content:"";position:absolute;border-radius:999px;border:1px solid rgba(255,255,255,.16)}
.landing-hero-visual::before{width:18rem;height:18rem;top:-6rem;right:-4rem}.landing-hero-visual::after{width:9rem;height:9rem;right:1.2rem;bottom:1.2rem}
.landing-visual-label{color:rgba(219,234,254,.72);font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.landing-hero-visual h2{margin:.45rem 0;color:#fff;font-size:1.9rem}.landing-hero-visual p{margin:0;color:rgba(219,234,254,.84)}
.landing-orbit{margin-top:1.2rem;padding:1rem;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}
.landing-orbit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;margin-top:.9rem}.landing-orbit-card{padding:.85rem;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.landing-orbit-card span{display:block;color:rgba(219,234,254,.68);font-size:.78rem;margin-bottom:.15rem}
.landing-section-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem}.landing-section{padding:1.2rem 1.25rem}.landing-section h2{margin:0 0 .45rem;font-size:1.75rem}
.landing-eyebrow{margin-bottom:.35rem;color:var(--text-soft);font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.landing-list{margin:0;padding-left:1.05rem}.landing-list li+li{margin-top:.45rem}
.landing-research,.landing-projects,.landing-future{grid-column:span 4}.landing-about,.landing-signals{grid-column:span 6}
.landing-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}.landing-mini-card{padding:1rem;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.52),rgba(255,255,255,.2));box-shadow:inset 0 0 0 1px var(--border-soft)}
.landing-mini-card h3{margin:0 0 .35rem;font-size:1.1rem}
.landing-signal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.landing-signal-card{padding:1rem;border-radius:22px;background:rgba(255,255,255,.46);box-shadow:inset 0 0 0 1px var(--border-soft)}
.landing-signal-card h3{margin:0 0 .35rem;font-size:1.08rem}
body.theme-night .landing-kicker,body.theme-night .landing-button-soft,body.theme-night .landing-proof,body.theme-night .landing-mini-card,body.theme-night .landing-signal-card{background:rgba(255,255,255,.03)}
@media (max-width:960px){.landing-hero,.landing-mini-grid,.landing-signal-grid{grid-template-columns:1fr}.landing-research,.landing-projects,.landing-future,.landing-about,.landing-signals{grid-column:span 12}}
@media (max-width:640px){.landing-hero-copy,.landing-hero-visual,.landing-section{padding:1rem}.landing-proof-grid{grid-template-columns:1fr}.landing-actions a{width:100%}}
</style>

<div class="landing-home">
  <section class="landing-hero">
    <div class="landing-panel landing-hero-copy">
      <div class="landing-kicker">Research Portfolio</div>
      <h1 class="landing-title">Hyunsik Min</h1>
      <div class="landing-subtitle">AI Researcher at Soonchunhyang University</div>
      <p class="landing-intro">I build <strong>deployable AI systems</strong> for <strong>autonomous driving</strong>, <strong>energy forecasting</strong>, and <strong>safety-aware public applications</strong>.</p>
      <div class="landing-actions">
        <a class="landing-button" href="/publications">View Publications</a>
        <a class="landing-button-soft" href="/about">About Me</a>
        <a class="landing-button-soft" href="/news">Recent News</a>
      </div>
      <div class="landing-links" style="margin-top:.9rem;">
        <a class="landing-button-soft" href="https://scholar.google.com/citations?user=2AUQlE8AAAAJ&amp;hl=en" target="_blank" rel="noopener">Google Scholar</a>
        <a class="landing-button-soft" href="https://www.linkedin.com/in/hyunsik-min-9ba072346/" target="_blank" rel="noopener">LinkedIn</a>
        <a class="landing-button-soft" href="https://github.com/minun001" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div class="landing-proof-grid">
        <div class="landing-proof"><strong>3</strong>First-author SCI(E) papers</div>
        <div class="landing-proof"><strong>2</strong>National research programs</div>
        <div class="landing-proof"><strong>2025</strong>Applied Energy and AI &amp; Law results</div>
      </div>
    </div>
    <aside class="landing-panel landing-hero-visual">
      <div class="landing-visual-label">Selected Signals</div>
      <h2>One portfolio across mobility, energy, and safety</h2>
      <p>Recent work spans trajectory prediction, photovoltaic forecasting, legal AI, and interaction analysis, organized as a single systems-focused research identity.</p>
      <div class="landing-orbit">
        <div class="landing-visual-label">Current Momentum</div>
        <div class="landing-orbit-grid">
          <div class="landing-orbit-card"><span>Journal</span>Applied Energy</div>
          <div class="landing-orbit-card"><span>Journal</span>Artificial Intelligence and Law</div>
          <div class="landing-orbit-card"><span>Programs</span>BK21 + NRF CRC</div>
          <div class="landing-orbit-card"><span>Theme</span>Predictive systems</div>
        </div>
      </div>
    </aside>
  </section>
  <section class="landing-mini-grid">
    <article class="landing-card landing-mini-card"><div class="landing-eyebrow">Profile</div><h3>Graduate researcher</h3><p>M.S. Candidate in Future Convergence Technology at Smart Autonomous &amp; Infrastructure Lab.</p></article>
    <article class="landing-card landing-mini-card"><div class="landing-eyebrow">Focus</div><h3>Prediction and decision support</h3><p>From traffic trajectories to photovoltaic output, I design models that stay useful in real operational settings.</p></article>
    <article class="landing-card landing-mini-card"><div class="landing-eyebrow">Recognition</div><h3>Award-winning early work</h3><p>Conference awards and fast publication growth shaped a research profile with clear upward momentum.</p></article>
  </section>
  <section class="landing-section-grid">
    <article class="landing-card landing-section landing-about"><div class="landing-eyebrow">About</div><h2>Research shaped for use, not just for benchmarks</h2><p>My research connects machine learning with infrastructure, transportation, and public-facing AI applications. The common thread is building systems that are readable, reliable, and deployable beyond the lab.</p><ul class="landing-list"><li>Trajectory prediction for anticipatory autonomous driving</li><li>Photovoltaic forecasting and adaptive energy management</li><li>Legal AI and structured interaction analysis for safety-aware systems</li></ul></article>
    <article class="landing-card landing-section landing-signals"><div class="landing-eyebrow">Latest Signals</div><h2>What defines the portfolio right now</h2><div class="landing-signal-grid"><div class="landing-signal-card"><h3>Research output</h3><p>First-author papers in <strong>Applied Energy</strong> and <strong>Artificial Intelligence and Law</strong> anchor the current profile.</p></div><div class="landing-signal-card"><h3>Active programs</h3><p>Participating in <strong>BK21</strong> and <strong>NRF CRC</strong> projects that connect graduate research to larger national programs.</p></div><div class="landing-signal-card"><h3>Current topics</h3><p>Autonomous driving, photovoltaic forecasting, legal reasoning, and speaker diarization are the main live tracks.</p></div><div class="landing-signal-card"><h3>Explore next</h3><p>Use the Publications page for papers, the About page for background, and the News page for recent milestones.</p></div></div></article>
    <article class="landing-card landing-section landing-research"><div class="landing-eyebrow">Research Areas</div><h2>Fields</h2><ul class="landing-list"><li>Autonomous driving and anticipatory planning</li><li>Time-series forecasting for energy systems</li><li>Legal AI and safety-oriented decision support</li><li>Interaction analysis and speaker diarization</li></ul></article>
    <article class="landing-card landing-section landing-projects"><div class="landing-eyebrow">Selected Topics</div><h2>Work</h2><ul class="landing-list"><li>Front-vehicle trajectory prediction with TGCA-based modeling</li><li>Solar PV forecasting and grid-scale management frameworks</li><li>AI-based speaker diarization for CRC child-parent data</li></ul></article>
    <article class="landing-card landing-section landing-future"><div class="landing-eyebrow">Looking Ahead</div><h2>Direction</h2><p>Long term, I want to translate strong AI methods into infrastructure systems that improve safety, efficiency, and public value in practice.</p></article>
  </section>
</div>
