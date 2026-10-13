import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open, title, message, confirmLabel = "Ya, lanjutkan",
  danger = false, busy = false, onConfirm, onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-fade-up w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${
          danger ? "bg-red-50 text-red-600" : "bg-primary-100 text-primary-700"}`}>
          <AlertTriangle size={20} />
        </div>
        <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>Batal</button>
          <button className={danger ? "btn-destructive" : "btn"} onClick={onConfirm} disabled={busy}>
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}