import { useState } from "react";
import TagInput from "./TagInput";

export default function LinkedNotes({ activity, onSave, onCancel, busy }) {
  const [f, setF] = useState({
    learning: activity.learning || "",
    obstacle: activity.obstacle || "",
    tags: activity.Tags?.map((t) => t.name) || [],
  });
  return (
    <form className="card animate-fade-up space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <p className="text-sm text-stone-600">
        Judul, tanggal, status, dan deadline mengikuti ruang Together. Di sini kamu mengisi refleksi pribadi.
      </p>
      <div>
        <label className="label">Pembelajaran yang diperoleh</label>
        <textarea className="input min-h-24" value={f.learning} onChange={(e) => setF({ ...f, learning: e.target.value })} />
      </div>
      <div>
        <label className="label">Kendala yang dialami</label>
        <textarea className="input min-h-24" value={f.obstacle} onChange={(e) => setF({ ...f, obstacle: e.target.value })} />
      </div>
      <div>
        <label className="label">Tag</label>
        <TagInput value={f.tags} onChange={(tags) => setF({ ...f, tags })} />
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan catatan"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}