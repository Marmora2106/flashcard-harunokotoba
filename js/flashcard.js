// Halaman ini dipakai bersama untuk semua kategori (kotoba, kanji, dst).
// Kategori & levelnya ditentukan dari parameter URL, contoh:
// flashcard.html?cat=kotoba&level=n5&type=kata-kerja&day=1
// flashcard.html?cat=kanji&level=n5&day=1

const CATEGORY_INFO = {
  kotoba: { name: "言葉", folder: "data/kotoba", page: "kotoba.html", hasType: true },
  kanji: { name: "漢字", folder: "data/kanji", page: "kanji.html", hasType: false },
};

const WORD_TYPE_LABELS = {
  "kata-kerja": "Kata Kerja",
  "kata-benda": "Kata Benda",
  "kata-sifat-i": "Kata Sifat イ",
  "kata-sifat-na": "Kata Sifat な",
  kaigo: "Kaigo",
  pertanian: "Pertanian",
  konstruksi: "Konstruksi",
};

const params = new URLSearchParams(window.location.search);
const cat = params.get("cat");
const level = params.get("level");
const type = params.get("type");
const day = params.get("day");

const info = CATEGORY_INFO[cat];

if (info) {
  document.body.classList.add(`cat-${cat}`);
}

const state = {
  cards: [],
  cardIndex: 0,
};

init();

function showErrorMessage(message) {
  document.getElementById("front-kanji").hidden = true;
  document.getElementById("front-kotoba").hidden = false;
  document.getElementById("card-word").textContent = message;
  document.getElementById("card-meaning").textContent = "";
}

async function init() {
  const requiredOk = info && level && day && (!info.hasType || type);

  if (!requiredOk) {
    showErrorMessage("Data tidak ditemukan.");
    return;
  }

  setupBreadcrumb();
  document.getElementById("page-title").textContent = `Day ${day}`;

  const fileName = info.hasType
    ? `${info.folder}/${level.toLowerCase()}/${type}.csv`
    : `${info.folder}/${level.toLowerCase()}.csv`;

  let csvText;
  try {
    const response = await fetch(fileName, { cache: "no-store" });
    if (!response.ok) throw new Error("File tidak ditemukan");
    csvText = await response.text();
  } catch (err) {
    showErrorMessage("Gagal memuat data.");
    return;
  }

  const parsed = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  state.cards = parsed.data.filter((row) => row.day === day);

  if (state.cards.length === 0) {
    showErrorMessage(`Belum ada kartu untuk Day ${day}.`);
    return;
  }

  document.getElementById("front-kotoba").hidden = cat !== "kotoba";
  document.getElementById("front-kanji").hidden = cat !== "kanji";

  renderCurrentCard();
}

function renderCurrentCard() {
  const card = state.cards[state.cardIndex];

  if (cat === "kotoba") {
    const wordEl = document.getElementById("card-word");
    const furiganaValue = card.furigana || card.hiragana;
    if (furiganaValue && furiganaValue.trim() !== "" && furiganaValue !== card.kosakata) {
      wordEl.innerHTML = `<ruby>${card.kosakata}<rt>${furiganaValue}</rt></ruby>`;
    } else {
      wordEl.textContent = card.kosakata;
    }
    document.getElementById("card-meaning").textContent = card.arti;
  } else if (cat === "kanji") {
    document.getElementById("kanji-char").textContent = card.kanji;
    document.getElementById("kanji-onyomi").textContent = card.onyomi || "-";
    document.getElementById("kanji-kunyomi").textContent = card.kunyomi || "-";
    document.getElementById("kanji-arti").textContent = card.arti || "-";
  }

  const examples = [
    { kalimat: card.contoh1, arti: card.arti_contoh1 },
    { kalimat: card.contoh2, arti: card.arti_contoh2 },
    { kalimat: card.contoh3, arti: card.arti_contoh3 },
  ].filter((ex) => ex.kalimat && ex.kalimat.trim() !== "");

  const examplesContainer = document.getElementById("card-examples");
  examplesContainer.innerHTML = examples
    .map(
      (ex) => `
        <div class="example-item">
          <p class="flashcard-example">${ex.kalimat}</p>
          <p class="flashcard-example-meaning">${ex.arti}</p>
        </div>
      `
    )
    .join("");

  document.getElementById("flashcard-inner").classList.remove("is-flipped");

  const dotsContainer = document.getElementById("card-dots");
  dotsContainer.innerHTML = "";
  state.cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot" + (i === state.cardIndex ? " dot--active" : "");
    dotsContainer.appendChild(dot);
  });

  document.getElementById("prev-btn").disabled = state.cardIndex === 0;
}

document.getElementById("flip-card").addEventListener("click", () => {
  document.getElementById("flashcard-inner").classList.toggle("is-flipped");
});

document.getElementById("prev-btn").addEventListener("click", () => {
  if (state.cardIndex > 0) {
    state.cardIndex--;
    renderCurrentCard();
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (state.cardIndex < state.cards.length - 1) {
    state.cardIndex++;
  } else {
    state.cardIndex = 0;
  }
  renderCurrentCard();
});

document.getElementById("back-btn").addEventListener("click", () => {
  const query = info.hasType ? `level=${level}&type=${type}` : `level=${level}`;
  window.location.href = `${info.page}?${query}`;
});

function setupBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  const parts = [
    `<a href="index.html">日本語を学ぼう</a>`,
    `<a href="${info.page}">${info.name}</a>`,
    `<a href="${info.page}?level=${level}">${level.toUpperCase()}</a>`,
  ];

  if (info.hasType) {
    const typeLabel = WORD_TYPE_LABELS[type] || type;
    parts.push(
      `<a href="${info.page}?level=${level}&type=${type}">${typeLabel}</a>`
    );
  }

  parts.push(`<span>Day ${day}</span>`);

  breadcrumb.innerHTML = parts.join(
    ` <i class="ti ti-chevron-right" aria-hidden="true"></i> `
  );
}
