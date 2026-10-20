import { useRef } from "react";

// Geser kiri = tab berikutnya, geser kanan = tab sebelumnya.
// Diabaikan jika sentuhan dimulai di input, tombol, atau area bertanda data-no-swipe.
export default function useSwipeTabs(keys, current, setTab) {
  const start = useRef(null);

  const onTouchStart = (e) => {
    if (e.target.closest("input, textarea, select, button, a, [data-no-swipe]")) { start.current = null; return; }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // harus gerakan horizontal yang jelas
    const i = keys.indexOf(current);
    const next = keys[i + (dx < 0 ? 1 : -1)];
    if (next) setTab(next);
  };

  return { onTouchStart, onTouchEnd };
}