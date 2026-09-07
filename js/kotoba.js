// Konfigurasi khusus kategori ini. Untuk 漢字 nanti tinggal duplikasi file ini
// dan ubah bagian CONFIG saja (folder data & nama kategori).
const CONFIG = {
  categorySlug: "kotoba",
  categoryName: "言葉",
  dataFolder: "data/kotoba",
};

const LEVELS = ["N5", "N4", "N3", "N2", "N1", "SSW"];

const WORD_TYPES = [
  { slug: "kata-kerja", label: "Kata Kerja" },
  { slug: "kata-benda", label: "Kata Benda" },
  { slug: "kata-sifat-i", label: "Kata Sifat イ" },
  { slug: "kata-sifat-na", label: "Kata Sifat な" },
];

const SSW_FIELDS = [
  { slug: "kaigo", label: "Kaigo" },
  { slug: "pertanian", label: "Pertanian" },
  { slug: "konstruksi", label: "Konstruksi" },
];

const state = {
  view: "level", // "level" | "sub" | "day"
  level: null,
  subType: null, // jenis kata (untuk N5-N1) atau bidang (untuk SSW)
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
  const typeFromUrl = params.get("type");

  if (levelFromUrl && typeFromUrl) {
    openSubType(levelFromUrl.toUpperCase(), typeFromUrl);
  } else if (levelFromUrl) {
    renderSubView(levelFromUrl.toUpperCase());
  } else {
    renderLevelView();
  }
}

backBtn.addEventListener("click", () => {
  if (state.view === "day") {
    renderSubView(state.level);
  } else if (state.view === "sub") {
    renderLevelView();
  } else {
    window.location.href = "index.html";
  }
});

function isSsw(level) {
  return level === "SSW";
}

function getSubList(level) {
  return isSsw(level) ? SSW_FIELDS : WORD_TYPES;
}

function getSubLabel(level, slug) {
  const found = getSubList(level).find((t) => t.slug === slug);
  return found ? found.label : slug;
}

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
    tile.addEventListener("click", () => renderSubView(level));
    levelView.appendChild(tile);
  });
}

function renderSubView(level) {
  state.view = "sub";
  state.level = level;
  levelView.innerHTML = "";
  dayView.hidden = true;
  levelView.hidden = false;

  pageTitle.textContent = level;
  pageSubtitle.textContent = isSsw(level)
    ? "Pilih bidang yang ingin dipelajari."
    : "Pilih jenis kata yang ingin dipelajari.";
  updateBreadcrumb();

  getSubList(level).forEach((sub) => {
    const tile = document.createElement("button");
    tile.className = "tile tile--compact";
    tile.textContent = sub.label;
    tile.addEventListener("click", () => openSubType(level, sub.slug));
    levelView.appendChild(tile);
  });
}

async function openSubType(level, subSlug) {
  state.level = level;
  state.subType = subSlug;

  const fileName = `${CONFIG.dataFolder}/${level.toLowerCase()}/${subSlug}.csv`;

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

  const subLabel = getSubLabel(state.level, state.subType);
  pageTitle.textContent = subLabel;
  pageSubtitle.textContent = "Pilih hari yang ingin dipelajari.";
  updateBreadcrumb();

  const days = [...new Set(state.rows.map((row) => row.day))].sort(
    (a, b) => Number(a) - Number(b)
  );

  if (days.length === 0) {
    dayView.innerHTML = `<p class="empty-message">Belum ada data untuk ${subLabel} di level ${state.level}.</p>`;
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
      window.location.href = `flashcard.html?cat=${CONFIG.categorySlug}&level=${state.level.toLowerCase()}&type=${state.subType}&day=${day}`;
    });
    dayView.appendChild(tile);
  });
}

function updateBreadcrumb() {
  const parts = [`<a href="index.html">日本語を学ぼう</a>`];

  if (state.view === "level") {
    parts.push(`<span>${CONFIG.categoryName}</span>`);
  } else if (state.view === "sub") {
    parts.push(
      `<a href="kotoba.html">${CONFIG.categoryName}</a>`,
      `<span>${state.level}</span>`
    );
  } else if (state.view === "day") {
    parts.push(
      `<a href="kotoba.html">${CONFIG.categoryName}</a>`,
      `<a href="kotoba.html?level=${state.level.toLowerCase()}">${state.level}</a>`,
      `<span>${getSubLabel(state.level, state.subType)}</span>`
    );
  }

  breadcrumb.innerHTML = parts.join(
    ` <i class="ti ti-chevron-right" aria-hidden="true"></i> `
  );
}
