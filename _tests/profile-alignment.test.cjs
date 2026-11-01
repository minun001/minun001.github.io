const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const read = (path) => readFileSync(join(__dirname, '..', path), 'utf8');
const section = (id) => read('profile/index.html').split(`id="${id}"`)[1].split('</section>')[0];

test('Profile distinguishes current VITA research from past SAIL undergraduate research', () => {
  const experience = section('profile-experience');
  assert.match(experience, /Graduate Researcher, VITA/);
  assert.match(experience, /Vision Intelligence for Transportation AI Lab, Hanyang University/);
  assert.match(experience, /<em>Current<\/em>/);
  assert.match(experience, /Undergraduate Researcher, SAIL/);
  assert.match(experience, /Smart Autonomous and Infrastructure Lab, Soonchunhyang University/);
  assert.match(experience, /Jul\. 2023 - Feb\. 2025/);
  assert.doesNotMatch(experience, /Jul\. 2023 - Present|Graduate Researcher, Smart|Mar\. 2025/);
  assert.match(experience, /exploring VLMs and VLAs/);
});

test('Projects retain all existing topics and periods while highlighting first-author work', () => {
  const projects = section('profile-projects');
  assert.equal((projects.match(/<article class="about-project">/g) || []).length, 7);
  assert.match(projects.split('<details')[0], /TGCA: vehicle trajectory prediction/);
  assert.match(projects, /First author \| IEEE T-ITS, 2026/);
  for (const text of [
    'AI-driven mobility simulation and prediction', 'AI agent-based safety monitoring',
    'child-care interaction analysis', 'TRACS-LLM', 'SolarNexus', 'Kingston University',
    'Jul. 2024 - Present', 'Apr. 2026 - Present', 'Sep. 2024 - Present',
    'Aug. 2024 - Nov. 2024', 'Feb. 2025 - Present', 'Dec. 2025 - Feb. 2026',
  ]) assert.ok(projects.includes(text), text);
  assert.match(projects, /nonverbal child-caregiver interactions/);
  assert.match(projects, /sequence analysis and explainable AI/);
  assert.doesNotMatch(projects, /Principal Investigator|2,300|2,871|82%|11%/);
});

test('Toolkit prioritizes research methods while retaining tools without duplicated collaboration copy', () => {
  const toolkit = section('profile-stack');
  assert.ok(toolkit.indexOf('Research methods') < toolkit.indexOf('Programming'));
  assert.match(toolkit, /Trajectory prediction, computer vision, deep learning, multimodal AI/);
  for (const tool of ['Python', 'PyTorch', 'R, Java', 'TensorFlow', 'Keras', 'scikit-learn', 'NumPy', 'pandas', 'Matplotlib', 'Seaborn', 'Tableau', 'NodeXL']) {
    assert.ok(toolkit.includes(tool), tool);
  }
  assert.equal((toolkit.match(/Codex, OpenClaw, Slack/g) || []).length, 1);
  assert.doesNotMatch(toolkit, /<dt>AI collaboration<\/dt>/);
});

test('Home and Research connect concise first-author claims to the existing publication', () => {
  const home = read('_includes/home-research.html');
  const intro = home.match(/class="research-intro">([^<]+)<\/p>/)[1];
  assert.ok(intro.split(/\s+/).length <= 30);
  assert.match(intro, /first-author IEEE T-ITS/);
  assert.match(read('profile/index.html'), /First-author research in <a[^>]*#publication-5nxA0vEk-isC/);
  assert.match(read('_data/research_projects.yml'), /role: First author/);
  assert.match(read('_includes/research-project-card.html'), /if include\.project\.role/);
});

test('Verified publication news replaces the unsupported acceptance year without changing other milestones', () => {
  const news = read('news/index.html');
  const publication = news.split('id="news-tits-publication-2026"')[1].split('</article>')[0];
  const archive = JSON.parse(read('_data/google-scholar-publications.json'));
  const paper = archive.sections.flatMap(group => group.items).find(item => item.id === '5nxA0vEk-isC');
  assert.match(publication, /Oct\. 2026/);
  assert.match(publication, /27\(10\), 12737-12750/);
  assert.ok(publication.includes(`https://doi.org/${paper.doi}`));
  assert.ok(news.indexOf('id="news-tits-publication-2026"') < news.indexOf('id="news-hanyang-admission-2026"'));
  assert.doesNotMatch(news, /Trajectory prediction paper accepted by IEEE T-ITS/);
  for (const id of ['news-safety-monitoring-2026', 'news-euroma-award-2026', 'news-hanyang-admission-2026']) {
    assert.ok(news.includes(`id="${id}"`));
  }
  assert.match(news, /admitted as a transfer student/i);
  assert.doesNotMatch(news, /speaker diarization|<img\b/);
});

test('Publications exposes DOI publisher links and keeps Scholar and BibTeX controls', () => {
  const publications = read('publications/index.html');
  assert.match(publications, /href="https:\/\/doi\.org\/\{\{ item\.doi \| escape \}\}"[^>]*>Publisher<\/a>/);
  assert.match(publications, /data-bibtex-target="bibtex-\{\{ item\.id \}\}"/);
  assert.match(publications, /Google Scholar<\/a>/);
  const overrides = JSON.parse(read('tools/scholar_publication_overrides.json'));
  for (const record of overrides.manual_records) {
    assert.doesNotMatch(record.summary, /scheduled|will be presented|was presented/);
  }
});
