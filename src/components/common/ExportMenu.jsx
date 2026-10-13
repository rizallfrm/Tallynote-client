import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

export default function ExportMenu({ disabled, onExcel, onCsv, onPdf }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const items = [
    [FileSpreadsheet, "Excel (.xlsx)", "Disarankan. Bisa diubah dan dipantau, ringkasan ikut berubah", onExcel],
    [Printer, "Cetak / PDF", "Laporan rapi untuk dikirim atau dicetak (A4)", onPdf],
    [FileText, "CSV", "Data mentah, untuk diimpor ke aplikasi lain", onCsv],
  ];

  return (
    <div ref={ref} className="relative">
      <button className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <Download size={16} /> Export <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu"
          className="animate-fade-up absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-sand bg-white p-1.5 shadow-lg">
          {items.map(([Icon, title, desc, fn]) => (
            <button key={title} role="menuitem" disabled={disabled}
              onClick={() => { setOpen(false); fn(); }}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="mt-0.5 rounded-lg bg-primary-100 p-1.5 text-primary-700"><Icon size={16} /></span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-stone-500">{desc}</span>
              </span>
            </button>
          ))}
          {disabled && <p className="px-3 py-2 text-xs text-stone-400">Belum ada aktivitas pada periode ini.</p>}
        </div>
      )}
    </div>
  );
}