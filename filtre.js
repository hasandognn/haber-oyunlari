/* Ortak kelime filtresi: ayarlar.js'teki yasaklı kelimeleri ve eklemeleri bütün oyunlara uygular.
   Yasak eşleşmesi:
   - "alkol"   → alkol ve ek almış hâlleri (alkollü, alkolü, alkoller…)
   - "bira*"   → "bira" ile başlayan her şey (yıldız ön ek demektir)
   - "kumar oynamak" → bu ifadeyi içeren sözler (Deyim gibi çok kelimeli oyunlarda) */
(function () {
  const low = s => String(s ?? "").trim().toLocaleLowerCase("tr-TR");

  function olustur(A) {
    A = A || {};
    const exact = new Set(), prefix = [], phrases = [];
    for (const raw of A.yasakli || []) {
      const t = low(raw);
      if (!t) continue;
      if (t.includes(" ")) phrases.push(t);
      else if (t.endsWith("*")) { if (t.length > 1) prefix.push(t.slice(0, -1)); }
      else exact.add(t);
    }

    // Yaygın Türkçe ekler; bir kelimeye en fazla üç ek üst üste eklenmiş sayılır.
    const EK = ["lar", "ler", "ı", "i", "u", "ü", "yı", "yi", "yu", "yü", "sı", "si", "su", "sü",
      "nın", "nin", "nun", "nün", "ın", "in", "un", "ün", "da", "de", "ta", "te", "dan", "den", "tan", "ten",
      "ya", "ye", "a", "e", "na", "ne", "la", "le", "yla", "yle", "lı", "li", "lu", "lü", "sız", "siz", "suz", "süz",
      "cı", "ci", "cu", "cü", "çı", "çi", "çu", "çü", "lık", "lik", "luk", "lük", "ğı", "ği", "ğu", "ğü",
      "ik", "baz", "hane", "ım", "im", "um", "üm", "ın", "mız", "miz", "nız", "niz"];
    function ekMi(rest, depth = 0) {
      if (!rest) return true;
      if (depth >= 3) return false;
      return EK.some(e => rest.startsWith(e) && ekMi(rest.slice(e.length), depth + 1));
    }
    // ünsüz yumuşaması: sigara→sigarası değil ama kitap→kitabı gibi durumlar
    const SOFT = { p: "b", ç: "c", t: "d", k: "ğ" };

    const cache = new Map();
    function yasak(w) {
      w = low(w).replace(/\s+/g, "");
      if (!w) return false;
      if (cache.has(w)) return cache.get(w);
      let r = exact.has(w) || prefix.some(p => w.startsWith(p));
      if (!r) {
        for (let k = w.length - 1; k >= 3 && !r; k--) {
          const stem = w.slice(0, k), rest = w.slice(k);
          if (exact.has(stem) && ekMi(rest)) r = true;
          // yumuşamış kök: "kitab" + "ı" → "kitap"
          const last = stem[stem.length - 1];
          for (const hard in SOFT) if (SOFT[hard] === last && exact.has(stem.slice(0, -1) + hard) && ekMi(rest)) r = true;
        }
      }
      cache.set(w, r);
      return r;
    }
    function ifadeYasak(text) {
      const t = low(text);
      if (phrases.some(p => t.includes(p))) return true;
      return t.split(/[^a-zçğıöşüâîû]+/).some(w => w && yasak(w));
    }
    // i'den başlayıp n uzunluklu listede ok(j) olan ilk sıraya ilerle
    function ileri(i, n, ok) {
      for (let k = 0; k < n; k++) { const j = ((i + k) % n + n) % n; if (ok(j)) return j; }
      return i;
    }
    // ok(i) olan sıralardan rastgele birini seç; mümkünse kaçınılacakları atla
    function rastgele(n, ok, ...avoid) {
      const all = [];
      for (let i = 0; i < n; i++) if (ok(i)) all.push(i);
      const pool = all.filter(i => !avoid.includes(i));
      const from = pool.length ? pool : all.length ? all : [0];
      return from[Math.floor(Math.random() * from.length)];
    }
    function ekle(oyun) {
      const e = (A.ekle || {})[oyun];
      return Array.isArray(e) ? e : [];
    }
    // Panel için: kelimeyi hangi kuralın yasakladığını söyle
    function neden(w) {
      w = low(w).replace(/\s+/g, "");
      if (exact.has(w)) return w;
      const p = prefix.find(p => w.startsWith(p));
      if (p) return p + "*";
      for (let k = w.length - 1; k >= 3; k--) if (exact.has(w.slice(0, k)) && ekMi(w.slice(k))) return w.slice(0, k);
      return yasak(w) ? "?" : null;
    }
    return { yasak, ifadeYasak, ileri, rastgele, ekle, low, neden, ayarlar: A };
  }

  window.Filtre = olustur(window.OYUN_AYARLARI);
  window.Filtre.olustur = olustur;
})();
