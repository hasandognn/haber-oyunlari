/* Haber Oyunları — oyunların ortak davranışı: başlık, menü, pencereler, bildirimler, günlük bulmaca, paylaşım.
   Kullanım: T.kur({ ad, modlar, yardim, ayarlar, altyazi, modDegisti }) sayfanın iskeletini kurar;
   oyun kendi <main> içeriğini yazar ve istatistik penceresini T.istatistik(fn) ile doldurur. */
(function () {
  const $ = s => document.querySelector(s);
  const ICON = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/>',
    stats: '<path d="M5 20V12M12 20V5M19 20v-9"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    daily: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    practice: '<path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 4l2 3-2 3M18 14l2 3-2 3"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    size: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>'
  };
  const svg = (k, attr = "") => `<svg viewBox="0 0 24 24"${attr}>${ICON[k] || k}</svg>`;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const EPOCH = new Date(2026, 0, 1);
  function dayIndex() {
    const n = new Date();
    return Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - EPOCH) / 864e5);
  }
  function rng(seed) { seed = seed >>> 0; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function shuffle(a, rand = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function toast(msg, ms = 1400) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    $("#toasts").prepend(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, ms);
  }

  const hooks = {};
  let cfg = {};
  function isOpen() { return $("#scrim").classList.contains("open"); }
  function closeAll() {
    $("#scrim").classList.remove("open"); $("#drawer").classList.remove("open");
    document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
    document.activeElement && document.activeElement.blur();
  }
  function open(id) {
    const drawer = $("#drawer"), wasDrawer = drawer.classList.contains("open");
    drawer.classList.remove("open");
    document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
    if (hooks[id]) hooks[id]();
    $("#scrim").classList.add("open");
    setTimeout(() => $("#" + id).classList.add("open"), wasDrawer ? 180 : 0);
  }
  function modal(id, title, body, closable = true) {
    return `<div class="modal" id="${id}" role="dialog" aria-modal="true" aria-labelledby="${id}T"><div class="card">${closable ? `<button class="ib close" data-close aria-label="Kapat">${svg("close")}</button>` : ""}<h2 id="${id}T">${title}</h2>${body}</div></div>`;
  }

  /* Sayfa iskeleti: başlık, menü, yardım, istatistik ve (varsa) ayarlar */
  function kur(c) {
    cfg = c;
    const modlar = c.modlar || [["daily", "Günün Bulmacası", "daily"], ["practice", "Pratik Modu", "practice"]];
    const right = [["help", "Nasıl oynanır"], ["stats", "İstatistikler"], ...(c.ayarlar ? [["settings", "Ayarlar"]] : [])];
    // başlık .app içinde olmalı; yoksa tam ekran .app'in üstüne eklenip sayfayı kaydırır
    (document.querySelector(".app") || document.body).insertAdjacentHTML("afterbegin", `<header><div class="bar">
      <div><button class="ib" id="menuBtn" aria-label="Menü">${svg("menu")}</button></div>
      <h1 class="title">${c.ad}</h1>
      <div class="right">${right.map(([k, l]) => `<button class="ib" data-open="${k}" aria-label="${l}">${svg(k)}</button>`).join("")}</div>
    </div></header>`);
    let i = 0;
    document.body.insertAdjacentHTML("beforeend", `<div id="toasts" aria-live="polite"></div><div class="scrim" id="scrim"></div>
      <nav class="drawer" id="drawer" aria-label="Menü">
        <div class="dh"><div class="brand">${c.ad}<small>Haber Oyunları</small></div><button class="ib" data-close aria-label="Kapat">${svg("close")}</button></div>
        ${modlar.map(([id, ad, ik]) => `<button class="item" style="--i:${i++}" data-mode="${id}">${svg(ik || "practice")}${ad}</button>`).join("")}
        <div class="sep"></div>
        <button class="item" style="--i:${i++}" data-open="help">${svg("help")}Nasıl Oynanır</button>
        <button class="item" style="--i:${i++}" data-open="stats">${svg("stats")}İstatistikler</button>
        ${(c.menuEk || []).map(([href, ad]) => `<a class="item" style="--i:${i++}" href="${href}">${svg("size")}${ad}</a>`).join("")}
        <div class="sep"></div>
        <a class="item" style="--i:${i++}" href="index.html">${svg("grid")}Tüm Oyunlar</a>
        <div class="dfoot">${c.altyazi || "Her gün yeni bir bulmaca."}</div>
      </nav>
      ${modal("help", "Nasıl Oynanır", c.yardim || "")}
      ${modal("stats", "İstatistikler", '<div id="statsBody"></div>')}
      ${c.ayarlar ? modal("settings", "Ayarlar", c.ayarlar) : ""}
      ${(c.pencereler || []).map(([id, t, b, cl]) => modal(id, t, b, cl !== false)).join("")}`);
    $("#menuBtn").onclick = () => { $("#scrim").classList.add("open"); $("#drawer").classList.add("open"); };
    $("#scrim").onclick = closeAll;
    document.querySelectorAll(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeAll(); }));
    document.addEventListener("click", e => {
      const o = e.target.closest("[data-open]"), cl = e.target.closest("[data-close]"), md = e.target.closest("[data-mode]");
      if (o) open(o.dataset.open);
      else if (cl) closeAll();
      else if (md) { closeAll(); if (c.modDegisti) setTimeout(() => c.modDegisti(md.dataset.mode), 200); }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
  }
  function aktifMod(m) { document.querySelectorAll(".item[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === m)); }
  function ilkZiyaret(key) { if (!store.get(key, false)) { store.set(key, true); setTimeout(() => open("help"), 400); } }

  /* Alt satır: tarih ve sıra no ya da pratik modu + yeni bulmaca düğmesi */
  function altSatir(mode, day, yeni, ek = "") {
    const sub = $("#sub");
    if (!sub) return;
    if (mode === "daily") {
      const date = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
      sub.innerHTML = `<span>${date}</span><span class="dot"></span><span>#${day + 1}</span>${ek ? `<span class="dot"></span><span>${ek}</span>` : ""}`;
    } else {
      sub.innerHTML = `<span>${cfg.pratikAdi || "Pratik modu"}${ek ? " · " + ek : ""}</span>${yeni ? `<button class="chip" id="newPz">${yeni[0]}</button>` : ""}`;
      if (yeni) $("#newPz").onclick = yeni[1];
    }
  }

  /* İstatistik penceresi: fn() HTML döndürür; günlükse geri sayım ve paylaş düğmesi eklenir */
  function istatistik(fn) { hooks.stats = () => { $("#statsBody").innerHTML = fn(); tick(); }; }
  function ayk(fn) { hooks.settings = fn; }
  /* Pencere altı: günlükte geri sayım + paylaş, pratikte "yeni" düğmesi (kur'daki yeni() çağrılır) */
  function altBolum({ gunluk, bitti, paylas = true }) {
    if (!bitti) return "";
    if (gunluk) return `<div class="foot"><div><small>Sonraki bulmaca</small><div class="clock" data-countdown></div></div>${paylas ? `<button class="btn" onclick="T.paylasimYap()">${svg("share")}Paylaş</button>` : ""}</div>`;
    return cfg.yeni ? `<div class="foot"><div></div><button class="btn" onclick="T.yeniOyun()">${cfg.yeniEtiket || "Yeni bulmaca"}</button></div>` : "";
  }
  function yeniOyun() { closeAll(); setTimeout(() => cfg.yeni(), 250); }
  let paylasMetni = () => "";
  function paylasim(fn) { paylasMetni = fn; }
  async function paylasimYap() {
    const text = paylasMetni();
    if (navigator.share && matchMedia("(pointer:coarse)").matches) { try { await navigator.share({ text }); return; } catch {} }
    try { await navigator.clipboard.writeText(text); toast("Panoya kopyalandı"); } catch { toast("Kopyalanamadı"); }
  }
  function dagilim(values, labels, hl) {
    const max = Math.max(1, ...values);
    setTimeout(() => document.querySelectorAll("#statsBody .db").forEach((b, i) => { b.style.transitionDelay = i * 50 + "ms"; b.style.width = b.dataset.w + "%"; }), 30);
    return `<div class="dist">${values.map((n, i) => `<div class="dr"><i>${labels[i]}</i><div class="db${i === hl ? " hl" : ""}" data-w="${Math.max(7, n / max * 100)}">${n}</div></div>`).join("")}</div>`;
  }
  function sayilar(list) { return `<div class="stats">${list.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join("")}</div>`; }
  function seri(st) { return st.lastDay !== null && st.lastDay !== undefined && st.lastDay >= dayIndex() - 1 ? st.streak : 0; }
  function seriGuncelle(st, day, kazandi) {
    if (kazandi) { st.streak = st.lastDay === day - 1 ? st.streak + 1 : 1; st.best = Math.max(st.best || 0, st.streak); st.lastDay = day; }
    else st.streak = 0;
  }

  let gunCb = null;
  function tick() {
    const el = document.querySelector("[data-countdown]");
    if (el) {
      const n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
      const s = Math.max(0, Math.floor((next - n) / 1000));
      el.textContent = [s / 3600, s / 60 % 60, s % 60].map(v => String(Math.floor(v)).padStart(2, "0")).join(":");
    }
    if (gunCb) gunCb();
  }
  setInterval(tick, 1000);
  function gunDegisince(fn) { gunCb = fn; }

  window.T = { $, svg, store, dayIndex, rng, shuffle, fmt, toast, open, closeAll, isOpen, kur, aktifMod, ilkZiyaret, altSatir,
    istatistik, ayk, altBolum, yeniOyun, paylasim, paylasimYap, dagilim, sayilar, seri, seriGuncelle, gunDegisince };
})();
