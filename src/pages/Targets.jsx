import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Pencil, Play, Plus, Trash2, Trophy } from "lucide-react";
import api from "../api/axios";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";
import TargetBar from "../components/summary/TargetBar";
import { METRICS, errMsg, periodLabel, shiftDate, today } from "../utils/format";

const emptyForm = { id: null, title: "", metric: "activities", target_value: 5, category_id: "" };

const PRESETS = [
  { label: "15 aktivitas / minggu", metric: "activities", target_value: 15 },
  { label: "Belajar 4 hari / minggu", metric: "active_days", target_value: 4, category: "Belajar" },
  { label: "Selesaikan 3 tugas", metric: "completed", target_value: 3 },
];

export default function Targets() {
  const { categories } = useActivity();
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null); // null = form tertutup
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api.get("/targets", { params: { date } })
      .then((r) => setData(r.data))
      .catch((e) => toast.error(errMsg(e))),
    [date, toast]
  );
  useEffect(() => { load(); }, [load]);

  const usePreset = (p) => {
    const cat = p.category ? categories.find((c) => c.name.toLowerCase() === p.category.toLowerCase()) : null;
    setForm({ ...emptyForm, title: p.label, metric: p.metric, target_value: p.target_value, category_id: cat ? String(cat.id) : "" });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const cat = categories.find((c) => String(c.id) === String(form.category_id));
    const payload = {
      title: form.title.trim() || `${cat ? `${cat.name}: ` : ""}${form.target_value} ${METRICS[form.metric].unit} per minggu`,
      metric: form.metric,
      target_value: Number(form.target_value),
      category_id: form.category_id || null,
    };
    try {
      if (form.id) await api.put(`/targets/${form.id}`, payload);
      else await api.post("/targets", payload);
      toast.success(form.id ? "Target diperbarui" : "Target ditambahkan");
      setForm(null);
      await load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const toggle = async (t) => {
    try { await api.put(`/targets/${t.id}`, { is_active: !t.is_active }); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async (t) => {
    if (!confirm(`Hapus target "${t.title}"?`)) return;
    try { await api.delete(`/targets/${t.id}`); toast.success("Target dihapus"); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const active = data?.items.filter((i) => i.is_active) || [];
  const achieved = active.filter((i) => i.achieved).length;
  const isThisWeek = data && data.start <= today() && today() <= data.end;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Target Mingguan</h1>
          <p className="text-sm text-stone-500">Target berlaku setiap minggu dan progresnya dihitung otomatis.</p>
        </div>
        {!form && <button className="btn" onClick={() => setForm(emptyForm)}><Plus size={16} /> Target baru</button>}
      </div>

      <div className="flex items-center gap-1">
        <button className="btn-ghost !px-2" onClick={() => setDate(shiftDate("weekly", date, -1))}><ChevronLeft size={18} /></button>
        <span className="min-w-52 text-center font-medium text-primary-dark">
          {data ? periodLabel("weekly", data.start, data.end) : "Memuat..."}
        </span>
        <button className="btn-ghost !px-2" onClick={() => setDate(shiftDate("weekly", date, 1))}><ChevronRight size={18} /></button>
        {!isThisWeek && <button className="chip ml-1" onClick={() => setDate(today())}>Minggu ini</button>}
      </div>

      {form && (
        <form onSubmit={save} className="card animate-fade-up space-y-4">
          <h2 className="font-semibold">{form.id ? "Edit target" : "Target baru"}</h2>

          {!form.id && (
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs text-stone-500">Contoh cepat:</span>
              {PRESETS.map((p) => (
                <button type="button" key={p.label} className="chip text-xs" onClick={() => usePreset(p)}>{p.label}</button>
              ))}
            </div>
          )}

          <div>
            <label className="label">Nama target <span className="text-stone-400">(kosongkan untuk otomatis)</span></label>
            <input className="input" maxLength={150} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Belajar rutin" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Jenis target</label>
              <select className="input" value={form.metric}
                onChange={(e) => {
                  const metric = e.target.value;
                  setForm({ ...form, metric, target_value: Math.min(Number(form.target_value) || 1, METRICS[metric].max) });
                }}>
                {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jumlah per minggu</label>
              <input type="number" className="input" min={1} max={METRICS[form.metric].max} required
                value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-stone-500">{METRICS[form.metric].hint}</p>

          <div>
            <label className="label">Kategori <span className="text-stone-400">(opsional)</span></label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Semua kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {data && active.length > 0 && (
        <div className="card flex items-center gap-3 bg-primary/10">
          <Trophy className="text-primary-dark" />
          <p className="text-sm">
            <b>{achieved}</b> dari <b>{active.length}</b> target aktif tercapai pada periode ini.
          </p>
        </div>
      )}

      {!data ? (
        <div className="skeleton h-28" />
      ) : data.items.length === 0 ? (
        <div className="card py-10 text-center text-stone-500">
          Belum ada target. Klik <b>Target baru</b> atau pilih salah satu contoh cepat.
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((t) => (
            <div key={t.id} className={`card animate-fade-up space-y-3 ${t.is_active ? "" : "opacity-60"}`}>
              <TargetBar t={t} />
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="rounded-full bg-sand px-2 py-0.5">{METRICS[t.metric]?.label}</span>
                {t.Category && <span className="rounded-full bg-sand px-2 py-0.5">{t.Category.name}</span>}
                {t.is_active && t.achieved && (
                  <span className="flex items-center gap-1 text-primary-dark"><Trophy size={12} /> Tercapai</span>
                )}
                {!t.is_active && <span>Dijeda</span>}
                <div className="ml-auto flex gap-1">
                  <button className="btn-ghost !p-1.5" title={t.is_active ? "Jeda" : "Aktifkan"} onClick={() => toggle(t)}>
                    {t.is_active ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button className="btn-ghost !p-1.5" title="Edit"
                    onClick={() => setForm({
                      id: t.id, title: t.title, metric: t.metric, target_value: t.target_value,
                      category_id: t.category_id ? String(t.category_id) : "",
                    })}>
                    <Pencil size={15} />
                  </button>
                  <button className="btn-danger !p-1.5" title="Hapus" onClick={() => remove(t)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}