/* Oyun ayarları — panel.html ile düzenlenir.
   yasakli: hiçbir oyunda cevap, tahmin, ipucu ya da bulmaca olarak görünmeyecek kelimeler.
            "kelime" ek almış hâlleri de kapsar, "kelime*" o harflerle başlayan her şeyi kapsar.
   ekle:    oyunlara eklenen içerik (kelime: 5 harfli cevaplar, baglanti: yeni bulmacalar, deyim: yeni sözler). */
window.OYUN_AYARLARI = {
  "guncelleme": "2026-10-13",
  "yasakli": [
    "alkol", "alkolik", "içki", "bira", "şarap", "viski", "votka", "rakı", "tekila", "konyak", "likör", "şampanya", "kokteyl", "cin", "meyhane", "sarhoş", "sarhoşluk", "akşamcı",
    "sigara", "tütün", "puro", "nargile", "pipo", "esrar", "eroin", "kokain", "uyuşturucu", "afyon", "haşhaş", "bonzai", "keyif verici",
    "kumar", "kumarhane", "bahis", "iddaa", "rulet", "poker", "kumarbaz",
    "eskort", "fahişe", "genelev", "seks", "seksi", "cinsel", "porno", "erotik", "çıplak", "striptiz",
    "silah", "tabanca", "tüfek", "bomba", "intihar", "cinayet", "katil", "terör", "terörist"
  ],
  "ekle": {
    "kelime": [],
    "baglanti": [],
    "deyim": []
  }
};
