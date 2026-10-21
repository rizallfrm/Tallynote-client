import { STATUS } from "./format";

/* ================= Helper ================= */
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n) => String(n).padStart(2, "0");

const isDate = (s) => DATE_RE.test(String(s || ""));
const ymd = (s) => String(s).split("-").map(Number);

// tanggal valid -> "2026-10-12", selain itu kosong (tidak pernah menulis "Invalid Date")
const cleanDate = (s) => (isDate(s) ? String(s) : "");
const dayName = (s) => {
  if (!isDate(s)) return "";
  const [y, m, d] = ymd(s);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};
// nilai tanggal untuk Excel (UTC supaya tidak bergeser sehari)
const excelDate = (s) => {
  if (!isDate(s)) return null;
  const [y, m, d] = ymd(s);
  return new Date(Date.UTC(y, m - 1, d));
};

const validDt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};
// jam deadline sesuai jam di perangkat user: "2026-10-12 17:00"
const deadlineText = (iso) => {
  const d = validDt(iso);
  return d
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : "";
};
const excelDeadline = (iso) => {
  const d = validDt(iso);
  return d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())) : null;
};

const statusLabel = (s) => STATUS[s]?.label || "Berjalan";
const tagsText = (a) => (a.Tags || []).map((t) => `#${t.name}`).join(" ");

// asal data: aktivitas dari Together, hasil AI, atau diisi manual
const sourceText = (a) =>
  a.workspace_id ? `Together: ${a.Workspace?.name || "ruang"}` : a.ai_generated ? "AI" : "Manual";

const sortRows = (rows) =>
  [...rows].sort((a, b) => String(a.activity_date).localeCompare(String(b.activity_date)) || a.id - b.id);

// pantauan deadline saat export (CSV). Di Excel dihitung ulang otomatis lewat rumus
function trackText(a) {
  if (a.status === "completed") return "Selesai";
  const d = validDt(a.deadline_at);
  if (!d) return "Tanpa deadline";
  const ms = d - Date.now();
  if (ms < 0) return "Terlambat";
  return ms < 86400000 ? "Kurang dari 1 hari" : `Sisa ${Math.floor(ms / 86400000)} hari`;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ================= CSV ================= */
// "sep=;" memaksa Excel memakai titik koma, jadi kolom rapi di semua pengaturan regional.
// Jika file akan dibuka di Google Sheets, ubah ke false (Sheets membaca pemisah otomatis).
const EXCEL_SEP_HINT = true;
const SEP = ";";

export function downloadCSV(rows, filename) {
  // teks dikutip dan dinetralkan; tanggal dan angka ditulis polos agar dikenali Excel
  const text = (v) => {
    let s = String(v ?? "").replace(/\s*\r?\n\s*/g, " ").trim();
    if (/^[=+\-@\t]/.test(s)) s = `'${s}`; // cegah CSV injection
    return `"${s.replace(/"/g, '""')}"`;
  };

  const head = [
    "No", "Tanggal", "Hari", "Judul", "Kategori", "Tag", "Status",
    "Deadline", "Pantauan deadline", "Uraian aktivitas", "Pembelajaran", "Kendala", "Favorit", "Sumber isi",
  ].map(text).join(SEP);

  const body = sortRows(rows).map((a, i) =>
    [
      i + 1,
      cleanDate(a.activity_date),
      text(dayName(a.activity_date)),
      text(a.title),
      text(a.Category?.name || "-"),
      text(tagsText(a)),
      text(statusLabel(a.status)),
      deadlineText(a.deadline_at),
      text(trackText(a)),
      text(a.description || a.activity_input || ""),
      text(a.learning || ""),
      text(a.obstacle || ""),
      text(a.is_favorite ? "Ya" : ""),
      text(sourceText(a)),
    ].join(SEP)
  );

  const csv = [...(EXCEL_SEP_HINT ? [`sep=${SEP}`] : []), head, ...body].join("\r\n");
  saveBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), filename);
}

/* ================= Excel ================= */
const C = {
  green: "FF6A7850", greenDark: "FF464F35", cream: "FFF7F2EB", white: "FFFFFFFF",
  text: "FF2B2723", muted: "FF6B6459", line: "FFDDD3C1", gold: "FF8B6B2E",
};
const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const cfFill = (argb) => ({ type: "pattern", pattern: "solid", bgColor: { argb } });
const LINE = { style: "thin", color: { argb: C.line } };
const BORDER = { top: LINE, left: LINE, bottom: LINE, right: LINE };
const METRIC_LABEL = { activities: "Jumlah aktivitas", active_days: "Hari aktif", completed: "Tugas selesai" };

const MAXROW = 2000; // rumus menghitung sampai baris ini, jadi baris tambahan user ikut terhitung
const rng = (col) => `Jurnal!$${col}$2:$${col}$${MAXROW}`;

export async function downloadXLSX(rows, filename, meta = {}) {
  const mod = await import("exceljs");
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tallynote";
  wb.created = new Date();

  const data = sortRows(rows);
  const n = data.length;

  /* ---------- hitungan awal (nilai cadangan untuk rumus) ---------- */
  const done = data.filter((a) => a.status === "completed").length;
  const running = data.filter((a) => a.status === "in_progress").length;
  const planned = data.filter((a) => a.status === "planned").length;
  const late = data.filter((a) => trackText(a) === "Terlambat").length;
  const rate = n ? done / n : 0;

  const ws1 = wb.addWorksheet("Ringkasan", { views: [{ showGridLines: false }] });
  const ws2 = wb.addWorksheet("Jurnal", { views: [{ state: "frozen", ySplit: 1, showGridLines: false }] });
  const ws3 = wb.addWorksheet("Cara pakai", { views: [{ showGridLines: false }] });

  /* =========================================================
     SHEET JURNAL
     A No | B Tanggal | C Hari | D Judul | E Kategori | F Tag | G Status
     H Deadline | I Pantauan deadline | J Uraian | K Pembelajaran | L Kendala
     M Favorit | N Sumber | O Catatan saya
     ========================================================= */
  const cols = [
    ["No", 5], ["Tanggal", 13], ["Hari", 10], ["Judul", 28], ["Kategori", 15], ["Tag", 16],
    ["Status ▼ (bisa diubah)", 18], ["Deadline", 18], ["Pantauan deadline (otomatis)", 24],
    ["Uraian aktivitas", 50], ["Pembelajaran", 42], ["Kendala", 42], ["Favorit", 9], ["Sumber isi", 22],
    ["Catatan saya (bebas diisi)", 30],
  ];
  ws2.columns = cols.map(([header, width]) => ({ header, width }));

  const head = ws2.getRow(1);
  head.height = 34;
  head.eachCell((c, i) => {
    const editable = i === 7 || i === 15; // kolom yang boleh diubah user berwarna emas
    c.font = { bold: true, color: { argb: C.white } };
    c.fill = fill(editable ? C.gold : C.green);
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = BORDER;
  });

  data.forEach((a, i) => {
    const r = i + 2;
    const row = ws2.getRow(r);
    const track = trackText(a);

    row.values = [
      i + 1,
      excelDate(a.activity_date),
      dayName(a.activity_date),
      a.title,
      a.Category?.name || "-",
      tagsText(a),
      statusLabel(a.status),
      excelDeadline(a.deadline_at),
      {
        formula:
          `IF(G${r}="Selesai","✔ Selesai",IF(H${r}="","Tanpa deadline",` +
          `IF(H${r}<NOW(),"⚠ Terlambat",IF(H${r}-NOW()<1,"⏳ Kurang dari 1 hari","⏳ Sisa "&INT(H${r}-NOW())&" hari"))))`,
        result:
          track === "Selesai" ? "✔ Selesai"
          : track === "Terlambat" ? "⚠ Terlambat"
          : track === "Tanpa deadline" ? track
          : `⏳ ${track}`,
      },
      a.description || a.activity_input || "",
      a.learning || "",
      a.obstacle || "",
      a.is_favorite ? "★" : "",
      sourceText(a),
      "",
    ];

    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = BORDER;
      c.font = { color: { argb: C.text }, bold: col === 4 };
      c.alignment = {
        vertical: "top",
        wrapText: true,
        horizontal: [1, 2, 3, 7, 8, 9, 13, 14].includes(col) ? "center" : "left",
      };
      if (i % 2 === 1) c.fill = fill(C.cream);
    });
    row.getCell(2).numFmt = "dd mmm yyyy";
    row.getCell(8).numFmt = "dd mmm yyyy hh:mm";
    row.getCell(7).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Direncanakan,Berjalan,Selesai"'],
      showErrorMessage: true,
      errorTitle: "Status tidak valid",
      error: "Pilih salah satu: Direncanakan, Berjalan, atau Selesai.",
    };
  });

  // dropdown juga berlaku untuk 50 baris kosong di bawah (jika user menambah baris sendiri)
  for (let r = n + 2; r < n + 52; r++) {
    ws2.getCell(r, 7).dataValidation = {
      type: "list", allowBlank: true, formulae: ['"Direncanakan,Berjalan,Selesai"'],
    };
  }

  const last = Math.max(n + 51, 60);
  ws2.addConditionalFormatting({
    ref: `G2:G${last}`,
    rules: [
      { type: "cellIs", operator: "equal", formulae: ['"Selesai"'], style: { fill: cfFill("FFDDE6CB"), font: { bold: true, color: { argb: "FF3F4B2C" } } } },
      { type: "cellIs", operator: "equal", formulae: ['"Berjalan"'], style: { fill: cfFill("FFFBE9BE"), font: { bold: true, color: { argb: "FF7A4F00" } } } },
      { type: "cellIs", operator: "equal", formulae: ['"Direncanakan"'], style: { fill: cfFill("FFEDE7DB"), font: { bold: true, color: { argb: "FF5A5448" } } } },
    ],
  });
  ws2.addConditionalFormatting({
    ref: `I2:I${last}`,
    rules: [
      { type: "expression", formulae: ['ISNUMBER(SEARCH("Terlambat",I2))'], style: { fill: cfFill("FFFAD4D4"), font: { bold: true, color: { argb: "FF9B1C1C" } } } },
      { type: "expression", formulae: ['ISNUMBER(SEARCH("Selesai",I2))'], style: { font: { color: { argb: "FF3F4B2C" } } } },
      { type: "expression", formulae: ['ISNUMBER(SEARCH("Kurang",I2))'], style: { fill: cfFill("FFFBE9BE"), font: { bold: true, color: { argb: "FF7A4F00" } } } },
    ],
  });
  // aktivitas dari Together diberi warna biru muda agar mudah dibedakan
  ws2.addConditionalFormatting({
    ref: `N2:N${last}`,
    rules: [
      { type: "expression", formulae: ['LEFT(N2,9)="Together:"'], style: { fill: cfFill("FFDDEBF7"), font: { bold: true, color: { argb: "FF1F4E79" } } } },
    ],
  });

  ws2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  ws2.pageSetup = {
    paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    printTitlesRow: "1:1",
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
  ws2.headerFooter.oddFooter = "&LTallynote&RHalaman &P dari &N";

  /* =========================================================
     SHEET RINGKASAN (rumus terhubung ke sheet Jurnal)
     ========================================================= */
  ws1.columns = [{ width: 36 }, { width: 18 }, { width: 18 }, { width: 22 }];

  ws1.mergeCells("A1:D1");
  const t = ws1.getCell("A1");
  t.value = meta.title || "Laporan Jurnal Aktivitas";
  t.font = { size: 16, bold: true, color: { argb: C.white } };
  t.fill = fill(C.green);
  t.alignment = { vertical: "middle", indent: 1 };
  ws1.getRow(1).height = 40;

  // logo (opsional, dilewati jika file tidak ada)
  try {
    const res = await fetch("/logo.png");
    if (res.ok) {
      const id = wb.addImage({ buffer: await res.arrayBuffer(), extension: "png" });
      ws1.addImage(id, { tl: { col: 3.1, row: 0.12 }, ext: { width: 110, height: 34 } });
    }
  } catch { /* abaikan */ }

  let r = 3;
  [
    ["Nama", meta.name || "-"],
    ["Periode", meta.period || "-"],
    ["Dibuat", new Date().toLocaleString("id-ID")],
  ].forEach(([k, v]) => {
    ws1.getCell(r, 1).value = k;
    ws1.getCell(r, 1).font = { bold: true, color: { argb: C.muted } };
    ws1.mergeCells(r, 2, r, 4);
    ws1.getCell(r, 2).value = v;
    ws1.getCell(r, 2).alignment = { horizontal: "left" };
    r++;
  });

  r++;
  ws1.mergeCells(r, 1, r, 4);
  const tip = ws1.getCell(r, 1);
  tip.value = "💡 Angka di bawah ini otomatis berubah saat kamu mengganti Status di sheet “Jurnal”. Baru pertama? Buka sheet “Cara pakai”.";
  tip.font = { color: { argb: "FF7A4F00" } };
  tip.fill = fill("FFFBF1D6");
  tip.alignment = { wrapText: true, vertical: "middle", indent: 1 };
  ws1.getRow(r).height = 34;
  r += 2;

  const section = (label) => {
    ws1.mergeCells(r, 1, r, 4);
    const c = ws1.getCell(r, 1);
    c.value = label;
    c.font = { size: 12, bold: true, color: { argb: C.greenDark } };
    c.border = { bottom: { style: "medium", color: { argb: C.green } } };
    r++;
  };
  const th = (labels) => {
    labels.forEach((l, i) => {
      const c = ws1.getCell(r, i + 1);
      c.value = l;
      c.font = { bold: true, color: { argb: C.white } };
      c.fill = fill(C.green);
      c.alignment = { horizontal: i ? "center" : "left", vertical: "middle", wrapText: true };
      c.border = BORDER;
    });
    ws1.getRow(r).height = 22;
    r++;
  };
  const line = (label, value, fmt) => {
    ws1.getCell(r, 1).value = label;
    ws1.getCell(r, 1).border = BORDER;
    ws1.mergeCells(r, 2, r, 4);
    const c = ws1.getCell(r, 2);
    c.value = value;
    c.font = { bold: true, size: 12, color: { argb: C.greenDark } };
    c.alignment = { horizontal: "left" };
    c.border = BORDER;
    if (fmt) c.numFmt = fmt;
    r++;
    return r - 1;
  };

  section("Ringkasan (otomatis)");
  const rTotal = line("Total aktivitas", { formula: `COUNTA(${rng("D")})`, result: n });
  const rDone = line("Selesai", { formula: `COUNTIF(${rng("G")},"Selesai")`, result: done });
  line("Berjalan", { formula: `COUNTIF(${rng("G")},"Berjalan")`, result: running });
  line("Direncanakan", { formula: `COUNTIF(${rng("G")},"Direncanakan")`, result: planned });
  line("Terlambat (lewat deadline, belum selesai)", { formula: `COUNTIF(${rng("I")},"*Terlambat*")`, result: late });
  const rRate = line("Tingkat selesai", { formula: `IF(B${rTotal}=0,0,B${rDone}/B${rTotal})`, result: rate }, "0%");
  line("Progres", {
    formula: `REPT("█",ROUND(B${rRate}*10,0))&REPT("░",10-ROUND(B${rRate}*10,0))&" "&TEXT(B${rRate},"0%")`,
    result: `${"█".repeat(Math.round(rate * 10))}${"░".repeat(10 - Math.round(rate * 10))} ${Math.round(rate * 100)}%`,
  });
  r++;

  // asal aktivitas (pribadi dan Together)
  const together = data.filter((a) => a.workspace_id).length;
  section("Asal aktivitas (otomatis)");
  th(["Sumber", "Aktivitas", "Selesai", "Tingkat selesai"]);
  [
    ["Together (tugas dan meeting ruang)", `COUNTIF(${rng("N")},"Together:*")`, `COUNTIFS(${rng("N")},"Together:*",${rng("G")},"Selesai")`, together, data.filter((a) => a.workspace_id && a.status === "completed").length],
    ["Pribadi (AI dan manual)", `B${r + 2}-B${r}`, `COUNTIF(${rng("G")},"Selesai")-C${r}`, n - together, done - data.filter((a) => a.workspace_id && a.status === "completed").length],
  ].forEach(([label, fTotal, fDone, vTotal, vDone], k) => {
    ws1.getCell(r, 1).value = label; ws1.getCell(r, 1).border = BORDER;
    const c2 = ws1.getCell(r, 2); c2.value = { formula: fTotal, result: vTotal };
    const c3 = ws1.getCell(r, 3); c3.value = { formula: fDone, result: vDone };
    const c4 = ws1.getCell(r, 4); c4.value = { formula: `IF(B${r}=0,0,C${r}/B${r})`, result: vTotal ? vDone / vTotal : 0 }; c4.numFmt = "0%";
    [c2, c3, c4].forEach((c) => { c.border = BORDER; c.alignment = { horizontal: "center" }; });
    if (k === 0) r++;
    else r++;
  });
  r++;

  // per kategori
  const cat = {};
  data.forEach((a) => {
    const nm = a.Category?.name || "-";
    cat[nm] ||= { total: 0, done: 0 };
    cat[nm].total++;
    if (a.status === "completed") cat[nm].done++;
  });
  if (Object.keys(cat).length) {
    section("Per kategori (otomatis)");
    th(["Kategori", "Aktivitas", "Selesai", "Tingkat selesai"]);
    Object.entries(cat)
      .sort((x, y) => y[1].total - x[1].total)
      .forEach(([nm, v]) => {
        const c1 = ws1.getCell(r, 1);
        c1.value = nm; c1.border = BORDER;
        const c2 = ws1.getCell(r, 2);
        c2.value = { formula: `COUNTIF(${rng("E")},A${r})`, result: v.total };
        const c3 = ws1.getCell(r, 3);
        c3.value = { formula: `COUNTIFS(${rng("E")},A${r},${rng("G")},"Selesai")`, result: v.done };
        const c4 = ws1.getCell(r, 4);
        c4.value = { formula: `IF(B${r}=0,0,C${r}/B${r})`, result: v.total ? v.done / v.total : 0 };
        c4.numFmt = "0%";
        [c2, c3, c4].forEach((c) => { c.border = BORDER; c.alignment = { horizontal: "center" }; });
        r++;
      });
    r++;
  }

  if (meta.targets?.length) {
    section("Target mingguan (per tanggal export)");
    th(["Target", "Jenis", "Capaian", "Status"]);
    meta.targets.forEach((x) => {
      const vals = [
        `${x.title}${x.Category ? ` (${x.Category.name})` : ""}`,
        METRIC_LABEL[x.metric] || x.metric,
        `${x.current}/${x.target_value} (${x.percent}%)`,
        x.achieved ? "Tercapai" : "Belum tercapai",
      ];
      vals.forEach((v, i) => {
        const c = ws1.getCell(r, i + 1);
        c.value = v; c.border = BORDER;
        c.alignment = { horizontal: i ? "center" : "left", wrapText: true };
      });
      ws1.getCell(r, 4).font = { bold: true, color: { argb: x.achieved ? "FF3F4B2C" : "FF7A4F00" } };
      r++;
    });
  }

  /* =========================================================
     SHEET CARA PAKAI
     ========================================================= */
  ws3.columns = [{ width: 4 }, { width: 100 }];
  const guide = [
    ["h", "Cara memakai file ini"],
    ["p", "File ini bukan sekadar laporan. Kamu bisa memperbaruinya di Excel, dan ringkasannya ikut menyesuaikan."],
    ["h", "1. Memantau progres"],
    ["b", "Buka sheet “Jurnal”. Kolom bertanda emas (Status dan Catatan saya) boleh kamu ubah."],
    ["b", "Klik sel Status, lalu pilih Direncanakan, Berjalan, atau Selesai dari dropdown."],
    ["b", "Sheet “Ringkasan” langsung ikut berubah: jumlah selesai, tingkat selesai, asal aktivitas, dan progres per kategori."],
    ["h", "2. Membaca kolom Pantauan deadline (otomatis)"],
    ["b", "✔ Selesai: status sudah Selesai."],
    ["b", "⏳ Sisa N hari atau Kurang dari 1 hari: deadline belum lewat."],
    ["b", "⚠ Terlambat: deadline lewat dan status belum Selesai (sel berwarna merah)."],
    ["b", "Kolom ini dihitung ulang setiap file dibuka, dihitung dari jam di komputermu."],
    ["h", "3. Membaca kolom Sumber isi"],
    ["b", "Together: nama ruang (sel biru) = tugas atau meeting dari Tallynote Together. Status aslinya diatur di aplikasi."],
    ["b", "AI = disusun otomatis oleh AI. Manual = kamu isi sendiri."],
    ["h", "4. Menyaring dan mengurutkan"],
    ["b", "Klik tanda panah di judul kolom (Jurnal) untuk menyaring, misalnya hanya yang Terlambat, satu kategori, atau hanya Together."],
    ["h", "5. Hal yang jangan diubah"],
    ["b", "Jangan mengganti nama sheet “Jurnal” dan jangan menghapus atau menyisipkan kolom, karena rumus Ringkasan membacanya."],
    ["b", "Boleh menambah baris baru tepat di bawah baris terakhir (sampai baris 2000). Angka Ringkasan akan ikut menghitungnya."],
    ["h", "6. Catatan"],
    ["b", "Perubahan di Excel tidak tersimpan kembali ke aplikasi. File ini adalah salinan untuk dipantau dan dibagikan."],
    ["b", "Ingin memperbarui data dari aplikasi? Export ulang dari halaman Rekap."],
  ];
  let g = 1;
  guide.forEach(([kind, txt]) => {
    const c = ws3.getCell(g, kind === "b" ? 2 : 1);
    if (kind === "h") {
      ws3.mergeCells(g, 1, g, 2);
      c.value = txt;
      c.font = { bold: true, size: 13, color: { argb: C.greenDark } };
      ws3.getRow(g).height = 26;
    } else {
      c.value = kind === "b" ? `•  ${txt}` : txt;
      c.alignment = { wrapText: true, vertical: "top" };
    }
    g++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename
  );
}