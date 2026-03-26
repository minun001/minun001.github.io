async function loadResults() {
  const response = await fetch("./data/results.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load results.json (${response.status})`);
  }
  return response.json();
}

function byId(id) {
  return document.getElementById(id);
}

function getDataset(data) {
  const key = document.body.dataset.datasetKey;
  const dataset = data.datasets[key];
  if (!dataset) {
    throw new Error(`Unknown dataset key: ${key}`);
  }
  return dataset;
}

function renderHeader(dataset) {
  document.body.dataset.theme = dataset.theme || "covla";
  byId("page-eyebrow").textContent = "TGCA-baseline-resullts";
  byId("page-title").textContent = `${dataset.label} Leaderboard`;
  byId("page-lede").textContent =
    "TGCA-baseline-resullts leaderboard comparing baseline models and the default TGCA. Ablation variants are excluded from the ranking.";
  byId("dataset-name").textContent = dataset.label;
  byId("updated-at").textContent = dataset.generated_at;
  byId("new-results-root").textContent = dataset.new_baseline_results_root;
  byId("leaderboard-note").textContent =
    dataset.leaderboard?.note || "Leaderboard is not available.";
}

function renderLeaders(dataset) {
  const leaderGrid = byId("leader-grid");
  leaderGrid.innerHTML = "";

  Object.values(dataset.leaderboard?.leaders || {}).forEach((leader) => {
    const card = document.createElement("article");
    card.className = "leader-card";
    card.innerHTML = `
      <p class="eyebrow">${leader.label}</p>
      <h3>${leader.name}</h3>
      <p>Best average: ${leader.value}</p>
    `;
    leaderGrid.appendChild(card);
  });
}

function renderRows(dataset) {
  const tbody = byId("leaderboard-body");
  tbody.innerHTML = "";

  (dataset.leaderboard?.rows || []).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.overall_rank}</td>
      <td>${row.name}</td>
      <td>${row.section}</td>
      <td>${row.rank_score.toFixed(2)}</td>
      <td>${row.mae.toFixed(2)}</td>
      <td>${row.rmse.toFixed(2)}</td>
      <td>${row.minade.toFixed(2)}</td>
      <td>${row.minfde.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderError(error) {
  document.body.dataset.theme = document.body.dataset.datasetKey || "covla";
  byId("page-title").textContent = "Leaderboard Load Failed";
  byId("page-lede").textContent = error.message;
}

async function main() {
  try {
    const data = await loadResults();
    const dataset = getDataset(data);
    renderHeader(dataset);
    renderLeaders(dataset);
    renderRows(dataset);
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

main();
