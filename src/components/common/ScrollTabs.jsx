import { useCallback, useEffect, useRef, useState } from "react";

export default function ScrollTabs({ tabs, value, onChange }) {
  const box = useRef(null);
  const btns = useRef({});
  const [edge, setEdge] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    setEdge({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  // tab aktif otomatis ke tengah (hanya menggeser bar, tidak menggeser halaman)
  useEffect(() => {
    const el = box.current;
    const b = btns.current[value];
    if (el && b) el.scrollTo({ left: b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2, behavior: "smooth" });
  }, [value]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className="relative">
      <div ref={box} onScroll={measure} role="tablist"
        className="no-scrollbar flex snap-x gap-1 overflow-x-auto rounded-xl bg-sand/60 p-1">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} ref={(el) => (btns.current[k] = el)} role="tab" aria-selected={value === k}
            onClick={() => onChange(k)}
            className={`flex shrink-0 snap-center items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-1 sm:justify-center ${
              value === k ? "bg-white text-primary-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {/* bayangan tepi: petunjuk masih ada tab yang bisa digeser */}
      <div aria-hidden className={`pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-gradient-to-r from-cream to-transparent transition-opacity sm:hidden ${edge.left ? "opacity-100" : "opacity-0"}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-cream to-transparent transition-opacity sm:hidden ${edge.right ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}