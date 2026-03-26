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

function updateHero(dataset) {
  const availableModels = dataset.sections
    .flatMap((section) => section.models)
    .filter((model) => model.status === "available");
  const pendingModels = dataset.pending_models || [];

  document.body.dataset.theme = dataset.theme || "covla";
  byId("status-text").textContent = pendingModels.length ? "Available with Pending Items" : "Ready";
  byId("model-count").textContent = String(availableModels.length);
  byId("pending-count").textContent = String(pendingModels.length);
  byId("dataset-name").textContent = dataset.label;
  byId("requested-root").textContent = dataset.requested_root;
  byId("local-root").textContent = dataset.local_root;
  byId("hero-lede").textContent =
    `${dataset.label} dataset experiments organized as individual tables for each model. Metrics are shown per second with MAE, RMSE, minADE, and minFDE.`;
  byId("site-note-text").textContent =
    `Updated ${dataset.generated_at}. Each model is organized as an individual table, and per-second metrics are provided for 1 to 5 seconds.`;
  byId("data-note-text").textContent = dataset.data_description || "Dataset description is not available.";
}

function renderLeaderboardLink(dataset) {
  const root = byId("leaderboard-link-root");
  if (!root) {
    return;
  }

  const href = dataset.label === "CoVLA"
    ? "./leaderboard-covla.html"
    : "./leaderboard-dashcam.html";
  const title = `${dataset.label} Leaderboard`;
  const description = `Open the dedicated ${dataset.label} ranking page.`;

  root.innerHTML = `
    <a class="leader-link-card" href="${href}">
      <p class="eyebrow">${dataset.label}</p>
      <h3>${title}</h3>
      <p>${description}</p>
    </a>
  `;
}

function renderToc(dataset) {
  const toc = byId("toc");
  toc.innerHTML = "";

  dataset.sections.forEach((section) => {
    const sectionLink = document.createElement("a");
    sectionLink.href = `#${section.id}`;
    sectionLink.textContent = section.title;
    toc.appendChild(sectionLink);

    section.models.forEach((model) => {
      const modelLink = document.createElement("a");
      modelLink.href = `#model-${model.slug}`;
      modelLink.textContent = model.name;
      toc.appendChild(modelLink);
    });
  });
}

function renderPending(dataset) {
  const pendingSection = byId("pending-section");
  const grid = byId("pending-grid");
  const pendingModels = dataset.pending_models || [];

  if (!pendingModels.length) {
    pendingSection.hidden = true;
    return;
  }

  pendingSection.hidden = false;
  grid.innerHTML = "";

  pendingModels.forEach((item) => {
    const isRunning = String(item.status || "").includes("running");
    const card = document.createElement("article");
    card.className = `pending-card${isRunning ? " running" : ""}`;
    card.innerHTML = `
      <p class="eyebrow">${isRunning ? "Running" : "Pending"}</p>
      <h3>${item.name}</h3>
      <p>${item.note}</p>
      <div class="source-meta">
        <span>Status</span>
        <code>${item.status}</code>
      </div>
    `;
    grid.appendChild(card);
  });
}

function buildMarkdownTable(model) {
  const lines = [
    `### ${model.name}`,
    "",
    "| P | MAE | RMSE | minADE | minFDE |",
    "|---:|---:|---:|---:|---:|",
  ];

  model.rows.forEach((row) => {
    lines.push(`| ${row.second} | ${row.mae} | ${row.rmse} | ${row.minade} | ${row.minfde} |`);
  });

  return lines.join("\n");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function wireCopyButton(button, model) {
  const defaultLabel = "Copy Table";
  let resetTimer = null;

  button.addEventListener("click", async () => {
    try {
      await copyText(buildMarkdownTable(model));
      button.textContent = "Copied";
      button.classList.add("copied");
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = defaultLabel;
        button.classList.remove("copied");
      }, 1800);
    } catch (error) {
      console.error(error);
      button.textContent = "Copy Failed";
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = defaultLabel;
      }, 1800);
    }
  });
}

function getDisplaySourcePath(model) {
  return model.display_source_path || model.source_path || "N/A";
}

function createModelCard(sectionTitle, model, template) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".model-card");
  card.id = `model-${model.slug}`;

  fragment.querySelector(".model-group").textContent = sectionTitle;
  fragment.querySelector(".model-name").textContent = model.name;

  const badge = fragment.querySelector(".model-badge");
  badge.textContent = model.status_label;
  if (model.status === "running") {
    badge.classList.add("running");
  } else if (model.status !== "available") {
    badge.classList.add("pending");
  }

  fragment.querySelector(".model-note").textContent = model.note;
  fragment.querySelector(".source-path").textContent = getDisplaySourcePath(model);

  const copyButton = fragment.querySelector(".copy-button");
  if (model.status === "available" && model.rows.length) {
    wireCopyButton(copyButton, model);
  } else {
    copyButton.textContent = model.status === "running" ? "Running" : "Unavailable";
    copyButton.disabled = true;
  }

  const tbody = fragment.querySelector("tbody");
  if (model.rows.length) {
    model.rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.second}</td>
        <td>${row.mae}</td>
        <td>${row.rmse}</td>
        <td>${row.minade}</td>
        <td>${row.minfde}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    const message = model.status === "running"
      ? "This experiment is currently running. Metrics will appear here after aggregation completes."
      : "Result file is not available for this dataset yet.";
    tr.innerHTML = `<td colspan="5">${message}</td>`;
    tbody.appendChild(tr);
  }

  return fragment;
}

function renderSections(dataset) {
  const root = byId("results-root");
  const template = byId("model-card-template");
  root.innerHTML = "";

  dataset.sections.forEach((section) => {
    const block = document.createElement("section");
    block.className = "results-block";
    block.id = section.id;

    const heading = document.createElement("div");
    heading.className = "section-heading";
    heading.innerHTML = `
      <p class="eyebrow">${section.kicker}</p>
      <h2>${section.title}</h2>
    `;
    block.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "model-grid";
    section.models.forEach((model) => {
      grid.appendChild(createModelCard(section.title, model, template));
    });
    block.appendChild(grid);

    root.appendChild(block);
  });
}

function renderDatasetSwitcher(data, activeKey, onSelect) {
  const root = byId("dataset-switcher");
  root.innerHTML = "";

  Object.entries(data.datasets).forEach(([key, dataset]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dataset-button${key === activeKey ? " active" : ""}`;
    button.textContent = dataset.label;
    button.addEventListener("click", () => onSelect(key));
    root.appendChild(button);
  });
}

function syncDatasetHash(key) {
  const url = new URL(window.location.href);
  url.hash = `dataset-${key}`;
  history.replaceState(null, "", url);
}

function getInitialDatasetKey(data) {
  const hash = window.location.hash.replace("#dataset-", "");
  if (hash && data.datasets[hash]) {
    return hash;
  }
  return Object.keys(data.datasets)[0];
}

function renderError(error) {
  byId("status-text").textContent = "Load Failed";
  byId("site-note-text").textContent = `The result data could not be loaded. Error: ${error.message}`;
  byId("data-note-text").textContent = "Dataset description could not be loaded.";
}

async function main() {
  try {
    const data = await loadResults();
    let activeKey = getInitialDatasetKey(data);

    const render = () => {
      const dataset = data.datasets[activeKey];
      renderDatasetSwitcher(data, activeKey, (nextKey) => {
        activeKey = nextKey;
        syncDatasetHash(activeKey);
        render();
      });
      updateHero(dataset);
      renderLeaderboardLink(dataset);
      renderToc(dataset);
      renderPending(dataset);
      renderSections(dataset);
    };

    render();
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

main();
