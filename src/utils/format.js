export const today = () => new Date().toLocaleDateString("en-CA");

const loc = (d, opt) => new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", opt);

export const formatDate = (d) =>
  loc(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const periodLabel = (range, s, e) =>
  range === "daily"
    ? formatDate(s)
    : range === "weekly"
    ? `${loc(s, { day: "numeric", month: "short" })} – ${loc(e, { day: "numeric", month: "short", year: "numeric" })}`
    : loc(s, { month: "long", year: "numeric" });

export const STATUS = {
  planned: { label: "Direncanakan", cls: "bg-sand text-stone-600", border: "border-l-stone-300" },
  in_progress: { label: "Berjalan", cls: "bg-amber-100 text-amber-700", border: "border-l-amber-400" },
  completed: { label: "Selesai", cls: "bg-primary/20 text-primary-dark", border: "border-l-primary" },
};

export const errMsg = (e) => e.response?.data?.message || "Terjadi kesalahan, coba lagi";

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

export const shiftDate = (range, date, dir) => {
  const d = new Date(`${date}T00:00:00`);
  if (range === "daily") d.setDate(d.getDate() + dir);
  else if (range === "weekly") d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir, 1);
  return d.toLocaleDateString("en-CA");
};

export const eachDay = (start, end) => {
  const out = [];
  const d = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  while (d <= e) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
};

export const METRICS = {
  activities: { label: "Jumlah aktivitas", unit: "aktivitas", max: 500, hint: "Total aktivitas yang dicatat dalam seminggu" },
  active_days: { label: "Hari aktif", unit: "hari", max: 7, hint: "Jumlah hari yang ada catatannya (maksimal 7)" },
  completed: { label: "Tugas selesai", unit: "selesai", max: 500, hint: "Aktivitas berstatus Selesai" },
};

const dayName = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long" });

/* ---------- Salin teks ---------- */
export const activityToText = (a) =>
  [
    a.title,
    `${formatDate(a.activity_date)} | ${a.Category?.name || "-"} | ${STATUS[a.status]?.label || a.status}`,
    "",
    "Uraian aktivitas:",
    a.description || a.activity_input || "-",
    "",
    "Pembelajaran yang diperoleh:",
    a.learning || "-",
    "",
    "Kendala yang dialami:",
    a.obstacle || "-",
    "Deadline:",
    a.deadline_at ? `${formatDeadline(a.deadline_at)} (${dayName(a.deadline_at)})` : "-",
  ].join("\n");

export const activitiesToText = (list) =>
  list.map(activityToText).join("\n\n----------------------------------------\n\n");

export async function copyText(text) {
  const value = String(text ?? "");
  if (!value) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch { /* lanjut ke cadangan */ }
  }

  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, value.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* abaikan */ }
  document.body.removeChild(ta);
  return ok;
}


const pad = (n) => String(n).padStart(2, "0");

// ISO <-> nilai input datetime-local (zona waktu perangkat)
export const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const humanMs = (ms) => {
  const m = Math.max(1, Math.round(Math.abs(ms) / 60000));
  if (m < 60) return `${m} menit`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} jam` : `${Math.round(h / 24)} hari`;
};

export const formatDeadline = (iso) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// null jika tidak ada deadline atau aktivitas sudah selesai
export const deadlineInfo = (a) => {
  if (!a?.deadline_at || a.status === "completed") return null;
  const ms = new Date(a.deadline_at) - Date.now();
  if (ms <= 0) return { label: `Terlambat ${humanMs(ms)}`, cls: "bg-red-100 text-red-700" };
  if (ms <= 24 * 3600 * 1000) return { label: `Sisa ${humanMs(ms)}`, cls: "bg-amber-100 text-amber-700" };
  return { label: `${humanMs(ms)} lagi`, cls: "bg-sand text-stone-600" };
};