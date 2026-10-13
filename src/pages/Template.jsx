import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutTemplate, Pencil, Play, Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import { errMsg } from "../utils/format";

const empty = { id: null, name: "", title: "", category_id: "", activity_input: "" };

export default function Templates() {
  const { categories } = useActivity();
  const toast = useToast();
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api.get("/templates").then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e))),
    [toast]
  );
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name, title: form.title,
      category_id: form.category_id || null, activity_input: form.activity_input,
    };
    try {
      if (form.id) await api.put(`/templates/${form.id}`, payload);
      else await api.post("/templates", payload);
      toast.success("Template disimpan");
      setForm(null);
      await load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/templates/${del.id}`); toast.success("Template dihapus"); await load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); setDel(null); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Template Aktivitas"
        subtitle="Simpan aktivitas yang berulang, lalu pakai dengan satu klik."
        actions={!form && <button className="btn" onClick={() => setForm(empty)}><Plus size={16} /> Template baru</button>} />

      {form && (
        <form onSubmit={save} className="card animate-fade-up space-y-4">
          <h2 className="font-semibold">{form.id ? "Edit template" : "Template baru"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama template</label>
              <input className="input" required maxLength={100} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Stand-up harian" />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select className="input" value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Judul aktivitas</label>
            <input className="input" required maxLength={200} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Cerita awal <span className="text-stone-400">(opsional)</span></label>
            <textarea className="input min-h-24" value={form.activity_input || ""}
              onChange={(e) => setForm({ ...form, activity_input: e.target.value })}
              placeholder="Kerangka cerita yang akan diisi ulang setiap kali dipakai" />
          </div>
          <div className="flex gap-2">
            <button className="btn" disabled={busy}>Simpan</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {!list ? <div className="skeleton h-24" /> : list.length === 0 && !form ? (
        <EmptyState icon={LayoutTemplate} title="Belum ada template"
          description="Buat template di sini, atau klik “Simpan sebagai template” saat mencatat aktivitas." />
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <div key={t.id} className="card animate-fade-up">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-stone-600">{t.title}{t.Category ? ` · ${t.Category.name}` : ""}</div>
                  {t.activity_input && <p className="mt-1 line-clamp-2 text-xs text-stone-500">{t.activity_input}</p>}
                </div>
                <div className="flex gap-1">
                  <button className="btn !px-3 !py-1.5" onClick={() => nav("/activities/new", { state: { template: t } })}>
                    <Play size={14} /> Pakai
                  </button>
                  <button className="btn-ghost !p-2" aria-label="Edit"
                    onClick={() => setForm({ ...t, category_id: t.category_id ? String(t.category_id) : "" })}>
                    <Pencil size={15} />
                  </button>
                  <button className="btn-danger !p-2" aria-label="Hapus" onClick={() => setDel(t)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!del} danger title="Hapus template?" message={`Template "${del?.name}" akan dihapus. Aktivitas yang sudah dibuat tidak terpengaruh.`}
        confirmLabel="Hapus" busy={busy} onConfirm={remove} onCancel={() => setDel(null)} />
    </div>
  );
}