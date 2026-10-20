import { useCallback, useEffect, useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import ConfirmDialog from "../common/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { PRIORITY, TSTATUS, same } from "../../utils/together";
import { deadlineInfo, errMsg, formatDeadline, fromLocalInput, toLocalInput } from "../../utils/format";

function TaskForm({ initial, members, canFull, onSave, onCancel, busy }) {
  const [f, setF] = useState({ title: "", description: "", priority: "medium", deadline_at: "", assignee_ids: [], ...initial });
  const toggle = (id) =>
    setF((p) => ({ ...p, assignee_ids: p.assignee_ids.includes(id) ? p.assignee_ids.filter((x) => x !== id) : [...p.assignee_ids, id] }));

  return (
    <form className="card animate-fade-up space-y-4"
      onSubmit={(e) => { e.preventDefault(); onSave({ ...f, deadline_at: fromLocalInput(f.deadline_at) }); }}>
      <h2 className="font-semibold">{initial?.title ? "Edit tugas" : "Tugas baru"}</h2>
      <div>
        <label className="label">Judul</label>
        <input className="input" required maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Deskripsi <span className="text-stone-400">(opsional)</span></label>
        <textarea className="input min-h-20" maxLength={3000} value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Prioritas</label>
          <div className="flex gap-2">
            {Object.entries(PRIORITY).map(([k, v]) => (
              <button type="button" key={k} className={`chip ${f.priority === k ? "chip-active" : ""}`} onClick={() => setF({ ...f, priority: k })}>{v.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Deadline <span className="text-stone-400">(opsional)</span></label>
          <input type="datetime-local" className="input" value={f.deadline_at} onChange={(e) => setF({ ...f, deadline_at: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Penanggung jawab <span className="text-stone-400">(bisa lebih dari satu)</span></label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const id = Number(m.user_id);
            const on = f.assignee_ids.includes(id);
            return (
              <button type="button" key={id} onClick={() => toggle(id)}
                className={`chip gap-2 ${on ? "chip-active" : ""}`}>
                <Avatar user={m} size={18} /> {m.name}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-stone-500">Penanggung jawab menerima WhatsApp jika nomornya sudah terverifikasi.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

export default function TasksTab({ wid, me, isAdmin, members }) {
  const toast = useToast();
  const [tasks, setTasks] = useState(null);
  const [filter, setFilter] = useState("open"); // open | mine | done | all
  const [form, setForm] = useState(null);      // null | {} baru | task edit
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(
    () => api.get(`/workspaces/${wid}/tasks`).then((r) => setTasks(r.data)).catch((e) => toast.error(errMsg(e))),
    [wid, toast]);
  useEffect(() => { load(); }, [load]);

  const save = async (payload) => {
    setBusy(true);
    try {
      if (form.id) await api.put(`/workspaces/${wid}/tasks/${form.id}`, payload);
      else await api.post(`/workspaces/${wid}/tasks`, payload);
      toast.success("Tugas disimpan");
      setForm(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const patch = async (t, body) => {
    try { await api.put(`/workspaces/${wid}/tasks/${t.id}`, body); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async () => {
    try { await api.delete(`/workspaces/${wid}/tasks/${del.id}`); toast.success("Tugas dihapus"); await load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDel(null); }
  };

  const shown = (tasks || []).filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "done"
    : filter === "mine" ? t.assignees.some((a) => same(a.id, me.id)) && t.status !== "done"
    : t.status !== "done");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[["open", "Aktif"], ["mine", "Tugas saya"], ["done", "Selesai"], ["all", "Semua"]].map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? "chip-active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
        {!form && <button className="btn ml-auto" onClick={() => setForm({})}><Plus size={16} /> Tugas baru</button>}
      </div>

      {form && (
        <TaskForm
          initial={form.id ? {
            title: form.title, description: form.description, priority: form.priority,
            deadline_at: toLocalInput(form.deadline_at), assignee_ids: form.assignees.map((a) => Number(a.id)),
          } : undefined}
          members={members} canFull busy={busy} onSave={save} onCancel={() => setForm(null)} />
      )}

      {!tasks ? <div className="skeleton h-28" /> : shown.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-500">Tidak ada tugas pada filter ini.</div>
      ) : (
        <div className="space-y-3">
          {shown.map((t) => {
            const mineCreated = same(t.created_by, me.id);
            const isAsg = t.assignees.some((a) => same(a.id, me.id));
            const canEdit = mineCreated || isAdmin;
            const canUpdate = canEdit || isAsg;
            const dl = deadlineInfo({ deadline_at: t.deadline_at, status: t.status === "done" ? "completed" : "in_progress" });
            return (
              <div key={t.id} className={`card animate-fade-up space-y-3 ${t.status === "done" ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-0.5 font-medium ${PRIORITY[t.priority].cls}`}>{PRIORITY[t.priority].label}</span>
                  {dl && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${dl.cls}`}><Clock size={12} /> {dl.label}</span>}
                  {t.deadline_at && <span className="text-stone-500">{formatDeadline(t.deadline_at)}</span>}
                </div>
                <div>
                  <h3 className={`break-words font-semibold ${t.status === "done" ? "line-through" : ""}`}>{t.title}</h3>
                  {t.description && <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{t.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {t.assignees.length === 0 ? <span className="text-xs text-stone-400">Belum ada penanggung jawab</span>
                    : t.assignees.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-sand/70 py-0.5 pl-0.5 pr-2.5 text-xs">
                        <Avatar user={a} size={20} /> {a.name}
                      </span>
                    ))}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${t.progress}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-sand pt-3">
                  {canUpdate ? (
                    <>
                      <select className="input !w-auto !py-1.5 text-sm" value={t.status} onChange={(e) => patch(t, { status: e.target.value })}>
                        {Object.entries(TSTATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                      <select className="input !w-auto !py-1.5 text-sm" value={t.progress} disabled={t.status === "done"}
                        onChange={(e) => patch(t, { progress: Number(e.target.value) })}>
                        {[0, 25, 50, 75, 100].map((p) => <option key={p} value={p}>{p}%</option>)}
                      </select>
                    </>
                  ) : <span className="text-xs text-stone-500">{TSTATUS[t.status]} · {t.progress}%</span>}
                  <div className="ml-auto flex gap-1">
                    {canEdit && <button className="btn-ghost !p-2" aria-label="Edit" onClick={() => setForm(t)}><Pencil size={15} /></button>}
                    {canEdit && <button className="btn-danger !p-2" aria-label="Hapus" onClick={() => setDel(t)}><Trash2 size={15} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!del} danger title="Hapus tugas?" message={`Tugas “${del?.title}” akan dihapus permanen.`}
        confirmLabel="Hapus" onConfirm={remove} onCancel={() => setDel(null)} />
    </div>
  );
}