import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import api from "../../api/axios";
import { formatDate } from "../../utils/format";

const NAV = [
  ["Catat aktivitas baru", "/activities/new", "N"],
  ["Beranda", "/", "G H"],
  ["Kalender", "/calendar", "G K"],
  ["Riwayat aktivitas", "/activities", "G A"],
  ["Rekap", "/recap", "G R"],
  ["Target mingguan", "/targets", "G T"],
  ["Template", "/templates", "G M"],
  ["Tanya jurnalmu (AI)", "/ask", "G I"],
  ["Akun dan pengaturan", "/settings", ""],
];

export default function CommandPalette({ open, onClose }) {0
  const nav = useNavigate();
  const ref = useRef(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (open) { setQ(""); setFound([]); setIdx(0); setTimeout(() => ref.current?.focus(), 0); }
  }, [open]);

  useEffect(() => {
    setIdx(0);
    if (!open || q.trim().length < 2) { setFound([]); return; }
    const id = setTimeout(
      () => api.get("/activities", { params: { q: q.trim(), limit: 6 } })
        .then((r) => setFound(r.data.items)).catch(() => setFound([])),
      250
    );
    return () => clearTimeout(id);
  }, [q, open]);

  if (!open) return null;

  const items = [
    ...found.map((a) => ({ key: `a${a.id}`, label: a.title, hint: formatDate(a.activity_date), to: `/activities/${a.id}` })),
    ...NAV.filter(([l]) => !q || l.toLowerCase().includes(q.toLowerCase()))
      .map(([label, to, hint]) => ({ key: to, label, hint, to })),
  ];
  const go = (it) => { onClose(); nav(it.to); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && items[idx]) go(items[idx]);
    else if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="animate-fade-up w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-sand px-4">
          <Search size={18} className="text-stone-400" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Cari aktivitas atau buka halaman..."
            className="w-full bg-transparent py-4 text-sm outline-none" />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-stone-400">Tidak ada hasil</li>}
          {items.map((it, i) => (
            <li key={it.key}>
              <button onMouseEnter={() => setIdx(i)} onClick={() => go(it)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === idx ? "bg-primary-100" : ""}`}>
                <span className="flex-1 truncate">{it.label}</span>
                <span className="text-xs text-stone-400">{it.hint}</span>
                {i === idx && <CornerDownLeft size={14} className="text-stone-400" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-sand px-4 py-2 text-xs text-stone-400">
          Pintasan: N baru · / cari · G lalu H/K/A/R/T/M/I pindah halaman · Ctrl+K buka kotak ini
        </div>
      </div>
    </div>
  );
}