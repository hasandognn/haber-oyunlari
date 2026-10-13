/* Coğrafya oyunlarının ortak araçları: mesafe, yön, ülke arama kutusu.
   ulkeler.js'ten sonra yüklenir. */
(function () {
  const U = window.ULKELER || [];
  const byK = new Map(U.map(c => [c.k, c]));
  const rad = d => d * Math.PI / 180;
  // iki nokta arası büyük çember mesafesi (km)
  function km(a, b) {
    const R = 6371, dLat = rad(b.y - a.y), dLon = rad(b.x - a.x);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
  }
  // a'dan b'ye pusula yönü (derece, kuzey = 0)
  function derece(a, b) {
    const y = Math.sin(rad(b.x - a.x)) * Math.cos(rad(b.y));
    const x = Math.cos(rad(a.y)) * Math.sin(rad(b.y)) - Math.sin(rad(a.y)) * Math.cos(rad(b.y)) * Math.cos(rad(b.x - a.x));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  const YON = [["⬆️", "Kuzey"], ["↗️", "Kuzeydoğu"], ["➡️", "Doğu"], ["↘️", "Güneydoğu"], ["⬇️", "Güney"], ["↙️", "Güneybatı"], ["⬅️", "Batı"], ["↖️", "Kuzeybatı"]];
  function yon(a, b) { const [ok, ad] = YON[Math.round(derece(a, b) / 45) % 8]; return { ok, ad, d: derece(a, b) }; }
  // yakınlık yüzdesi: 0 km = %100, dünyanın yarısı = %0
  const yakinlik = d => Math.max(0, Math.round(100 - d / 20000 * 100));
  const kmYaz = d => d.toLocaleString("tr-TR") + " km";

  // aramada Türkçe karakter ve büyük/küçük harf farkını yok say
  const fold = s => s.toLocaleLowerCase("tr-TR").replace(/[çğıöşüâîû]/g, c => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }[c])).replace(/[^a-z0-9 ]/g, "").trim();
  const ARA = U.map(c => ({ c, keys: [fold(c.a), fold(c.e)] }));
  function ara(q, limit = 8, haric = new Set()) {
    q = fold(q);
    if (!q) return [];
    const starts = [], has = [];
    for (const { c, keys } of ARA) {
      if (haric.has(c.k)) continue;
      if (keys.some(k => k.startsWith(q) || k.split(" ").some(w => w.startsWith(q)))) starts.push(c);
      else if (keys.some(k => k.includes(q))) has.push(c);
    }
    return [...starts, ...has].slice(0, limit);
  }
  function bul(q) { const f = fold(q); return U.find(c => fold(c.a) === f || fold(c.e) === f) || null; }

  /* Ülke seçme kutusu: kutu.onSec(ülke) ile tahmin yapılır */
  function kutu(input, list, onSec, haric = () => new Set()) {
    let items = [], idx = 0;
    const draw = () => {
      list.innerHTML = items.map((c, i) => `<button type="button" class="opt${i === idx ? " on" : ""}" data-k="${c.k}"><img src="bayraklar/${c.k}.svg" alt="" loading="lazy">${c.a}</button>`).join("");
      list.hidden = !items.length;
    };
    const update = () => { items = ara(input.value, 8, haric()); idx = 0; draw(); };
    const choose = c => { if (!c) return; input.value = ""; items = []; draw(); onSec(c); };
    input.addEventListener("input", update);
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { idx = Math.min(items.length - 1, idx + 1); draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { idx = Math.max(0, idx - 1); draw(); e.preventDefault(); }
      else if (e.key === "Enter") { e.preventDefault(); choose(items[idx] || bul(input.value)); }
      else if (e.key === "Escape") { items = []; draw(); }
    });
    list.addEventListener("mousedown", e => e.preventDefault());
    list.addEventListener("click", e => { const b = e.target.closest(".opt"); if (b) choose(byK.get(b.dataset.k)); });
    input.addEventListener("blur", () => setTimeout(() => { items = []; draw(); }, 150));
    return { temizle() { input.value = ""; items = []; draw(); } };
  }

  // günlük hedef: tanınabilir büyüklükte ülkelerden, güne göre sabit sırayla
  function gunlukHavuz(minNufus = 1e6) { return U.filter(c => c.p >= minNufus).map(c => c.k); }

  window.G = { U, byK, km, yon, derece, yakinlik, kmYaz, ara, bul, kutu, gunlukHavuz, fold };
})();
