// Dashboard utama — menangani klik pada kartu kategori.
// Nanti bagian ini yang akan pindah ke tampilan "pilih sub" (Level 2)
// dan memanggil data flashcard dari folder /data/.

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => {
    const category = card.dataset.category;
    goToCategory(category);
  });
});

function goToCategory(category) {
  if (category === "kotoba") {
    window.location.href = "kotoba.html";
  } else if (category === "kanji") {
    window.location.href = "kanji.html";
  } else {
    // 文法 dan 練習 belum dibuatkan halamannya.
    console.log(`Kategori "${category}" belum tersedia.`);
  }
}
