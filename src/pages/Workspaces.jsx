import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListChecks, Plus, Users } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { ROLE } from "../utils/together";
import { errMsg } from "../utils/format";

export default function Workspaces() {
  const toast = useToast();
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/workspaces").then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e))); }, [toast]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/workspaces", form);
      toast.success("Ruang dibuat");
      nav(`/together/${data.id}?tab=members`); // langsung ke tab Anggota untuk membuat link undangan
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Tallynote Together"
        subtitle="Ruang kerja bersama untuk tim, kelompok kuliah, organisasi, atau proyek."
        actions={!form && <button className="btn" onClick={() => setForm({ name: "", description: "" })}><Plus size={16} /> Ruang baru</button>} />

      {form && (
        <form onSubmit={create} className="card animate-fade-up space-y-4">
          <h2 className="font-semibold">Ruang baru</h2>
          <div>
            <label className="label">Nama ruang</label>
            <input className="input" required minLength={2} maxLength={100} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Tim Skripsi Kelompok 3" />
          </div>
          <div>
            <label className="label">Deskripsi <span className="text-stone-400">(opsional)</span></label>
            <textarea className="input min-h-20" maxLength={1000} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className="btn" disabled={busy}>{busy ? "Membuat..." : "Buat ruang"}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {!list ? <div className="skeleton h-24" /> : list.length === 0 && !form ? (
        <EmptyState icon={Users} title="Belum ada ruang kolaborasi"
          description="Buat ruang baru, atau minta link undangan dari temanmu lalu buka di browser ini."
          action={<button className="btn" onClick={() => setForm({ name: "", description: "" })}>Buat ruang pertama</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((w) => (
            <Link key={w.id} to={`/together/${w.id}`} className="card animate-fade-up block transition hover:border-primary-300 hover:shadow-md">
              <div className="flex items-start gap-2">
                <h3 className="flex-1 break-words font-semibold">{w.name}</h3>
                <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">{ROLE[w.role]}</span>
              </div>
              {w.description && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{w.description}</p>}
              <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1"><Users size={13} /> {w.member_count} anggota</span>
                <span className="flex items-center gap-1"><ListChecks size={13} /> {w.my_open_tasks} tugasmu</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}