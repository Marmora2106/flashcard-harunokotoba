const CONFIG = {
  categorySlug: "kanji",
  categoryName: "漢字",
  dataFolder: "data/kanji",
};

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const state = {
  view: "level", // "level" | "day"
  level: null,
  rows: [],
};

const levelView = document.getElementById("level-view");
const dayView = document.getElementById("day-view");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const breadcrumb = document.getElementById("breadcrumb");
const backBtn = document.getElementById("back-btn");

init();

function init() {
  const params = new URLSearchParams(window.location.search);
  const levelFromUrl = params.get("level");

  if (levelFromUrl) {
    openLevel(levelFromUrl.toUpperCase());
  } else {
    renderLevelView();
  }
}

backBtn.addEventListener("click", () => {
  if (state.view === "day") {
    renderLevelView();
  } else {
    window.location.href = "index.html";
  }
});

function renderLevelView() {
  state.view = "level";
  levelView.innerHTML = "";
  dayView.hidden = true;
  levelView.hidden = false;

  pageTitle.textContent = CONFIG.categoryName;
  pageSubtitle.textContent = "Pilih level yang ingin dipelajari.";
  updateBreadcrumb();

  LEVELS.forEach((level) => {
    const tile = document.createElement("button");
    tile.className = "tile tile--compact";
    tile.textContent = level;
    tile.addEventListener("click", () => openLevel(level));
    levelView.appendChild(tile);
  });
}

async function openLevel(level) {
  state.level = level;

  const fileName = `${CONFIG.dataFolder}/${level.toLowerCase()}.csv`;

  let csvText;
  try {
    const response = await fetch(fileName, { cache: "no-store" });
    if (!response.ok) throw new Error("File tidak ditemukan");
    csvText = await response.text();
  } catch (err) {
    state.rows = [];
    renderDayView();
    return;
  }

  const parsed = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  state.rows = parsed.data;
  renderDayView();
}

function renderDayView() {
  state.view = "day";
  levelView.hidden = true;
  dayView.hidden = false;
  dayView.innerHTML = "";

  pageTitle.textContent = state.level;
  pageSubtitle.textContent = "Pilih hari yang ingin dipelajari.";
  updateBreadcrumb();

  const days = [...new Set(state.rows.map((row) => row.day))].sort(
    (a, b) => Number(a) - Number(b)
  );

  if (days.length === 0) {
    dayView.innerHTML = `<p class="empty-message">Belum ada data untuk level ${state.level}.</p>`;
    return;
  }

  days.forEach((day) => {
    const count = state.rows.filter((row) => row.day === day).length;

    const tile = document.createElement("button");
    tile.className = "tile";
    tile.innerHTML = `
      <span class="tile-meta">${count} kartu</span>
      <span class="tile-label">Day ${day}</span>
    `;
    tile.addEventListener("click", () => {
      window.location.href = `flashcard.html?cat=${CONFIG.categorySlug}&level=${state.level.toLowerCase()}&day=${day}`;
    });
    dayView.appendChild(tile);
  });
}

function updateBreadcrumb() {
  if (state.view === "level") {
    breadcrumb.innerHTML = `
      <a href="index.html">日本語を学ぼう</a>
      <i class="ti ti-chevron-right" aria-hidden="true"></i>
      <span>${CONFIG.categoryName}</span>
    `;
  } else {
    breadcrumb.innerHTML = `
      <a href="index.html">日本語を学ぼう</a>
      <i class="ti ti-chevron-right" aria-hidden="true"></i>
      <a href="kanji.html">${CONFIG.categoryName}</a>
      <i class="ti ti-chevron-right" aria-hidden="true"></i>
      <span>${state.level}</span>
    `;
  }
}
