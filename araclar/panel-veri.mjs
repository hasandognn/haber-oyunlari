// Oyun dosyalarındaki kelime verisinden panel önizlemesi için panel-veri.js üretir.
// Çalıştırma: node araclar/panel-veri.mjs   (oyun içeriği değişince yeniden çalıştırın)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

// "const NAME = <literal>" ifadesindeki değeri (dizi, nesne ya da metin) çözümle
function literal(src, name) {
  let i = src.indexOf(`const ${name} = `);
  if (i < 0) throw new Error(`${name} bulunamadı`);
  i += `const ${name} = `.length;
  while (!"[{\"".includes(src[i])) i++;
  let depth = 0, j = i, str = false;
  for (; j < src.length; j++) {
    const c = src[j];
    if (str) { if (c === "\\") j++; else if (c === '"') { str = false; if (depth === 0) { j++; break; } } continue; }
    if (c === '"') str = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") { depth--; if (depth === 0) { j++; break; } }
  }
  return new Function(`return (${src.slice(i, j)});`)();
}
const uniq = a => [...new Set(a)];

const wordle = read("wordle.html"), pool = literal(read("inat.html"), "WORDS").pool.split(" ");
const oyunlar = [
  { id: "kelime", ad: "Kelime · Sınırsız · Dörtlü · Sekizli · İnat", tur: "liste",
    not: "Yasaklı kelime cevap olarak seçilmez ve tahmin olarak kabul edilmez.",
    kelimeler: uniq([...literal(wordle, "ANSWERS").split(" "), ...pool]) },
  { id: "baglanti", ad: "Bağlantı", tur: "bulmaca", not: "Yasaklı kelime içeren bulmaca gösterilmez.",
    bulmacalar: literal(read("baglanti.html"), "PUZZLES").map(p => p.flatMap(([t, ws]) => ws.map(w => w.toLocaleLowerCase("tr-TR")))) },
  { id: "petek", ad: "Petek", tur: "liste", not: "Yasaklı kelime cevaplardan çıkar.",
    kelimeler: uniq(literal(read("petek.html"), "PUZZLES").flatMap(p => p.w)) },
  { id: "iz", ad: "İz", tur: "bulmaca", not: "Tema kelimesi yasaklı olan ızgara gösterilmez.",
    bulmacalar: literal(read("iz.html"), "PUZZLES").map(p => p.w.map(([w]) => w)) },
  { id: "anlam", ad: "Anlam · Sıcak Soğuk", tur: "liste",
    not: "Yasaklı kelime gizli kelime, tahmin, ipucu ya da yakın kelime olarak çıkmaz.",
    kelimeler: uniq([...literal(read("anlam.html"), "DATA").vocab.split(" "), ...literal(read("sicaksoguk.html"), "DATA").vocab.split(" ")]),
    hedefler: uniq([...literal(read("anlam.html"), "DATA").p.map(p => p.t), ...literal(read("sicaksoguk.html"), "DATA").p.map(p => p.t)]) },
  { id: "gofret", ad: "Gofret", tur: "bulmaca", not: "Yasaklı kelime içeren gofret gösterilmez.",
    bulmacalar: literal(read("gofret.html"), "PUZZLES").map(p => p.w) },
  { id: "deyim", ad: "Deyim", tur: "bulmaca", not: "Yasaklı kelime içeren söz gösterilmez.",
    bulmacalar: literal(read("deyim.html"), "PHRASES").map(p => p.p.split(" ")) },
  { id: "kutu", ad: "Kutu", tur: "bulmaca", not: "Çözümü yasaklı olan kutu gösterilmez; diğer yasaklılar geçerli kelimelerden çıkar.",
    bulmacalar: literal(read("kutu.html"), "PUZZLES").map(p => p.sol) },
  { id: "anagram", ad: "Anagram", tur: "bulmaca", not: "Kökü yasaklı olan bulmaca gösterilmez; diğer yasaklılar cevaplardan çıkar.",
    bulmacalar: literal(read("anagram.html"), "PUZZLES").map(p => [p.l]) },
  { id: "ortak", ad: "Ortak", tur: "bulmaca", not: "Yasaklı kelime içeren kategori gösterilmez.",
    bulmacalar: literal(read("ortak.html"), "PUZZLES").map(p => [...p.i, ...p.a.toLocaleLowerCase("tr-TR").split(" ")]) },
  { id: "zincir", ad: "Zincir", tur: "bulmaca", not: "Yasaklı kelime içeren zincir gösterilmez.",
    bulmacalar: literal(read("zincir.html"), "PUZZLES").map(p => p.w) },
  { id: "kodadi", ad: "Kod Adı", tur: "bulmaca", not: "Kartlarında ya da ipuçlarında yasaklı kelime olan tahta gösterilmez.",
    bulmacalar: literal(read("kodadi.html"), "BOARDS").map(b => [...b.w, ...b.c.map(c => c.c)]) },
];
const out = `/* Otomatik üretildi: node araclar/panel-veri.mjs — elle düzenlemeyin. */\nwindow.PANEL_VERI = ${JSON.stringify({ uretildi: new Date().toISOString().slice(0, 10), oyunlar })};\n`;
fs.writeFileSync(path.join(ROOT, "panel-veri.js"), out);
console.log("panel-veri.js", (out.length / 1024).toFixed(0) + " KB", oyunlar.map(o => `${o.id}:${(o.kelimeler || o.bulmacalar).length}`).join(" "));
