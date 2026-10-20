import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Pencil, Plus, Video, X } from "lucide-react";
import api from "../../api/axios";
import ConfirmDialog from "../common/ConfirmDialog";
import CopyButton from "../common/CopyButton";
import { useToast } from "../../context/ToastContext";
import { dtShort, hm, same } from "../../utils/together";
import { errMsg, fromLocalInput, toLocalInput } from "../../utils/format";

const plusHour = (local) => {
  const d = new Date(local);
  d.setHours(d.getHours() + 1);
  return toLocalInput(d.toISOString());
};

function MeetingForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState({ title: "", agenda: "", starts_at: "", ends_at: "", meeting_url: "", ...initial });
  const setStart = (v) => setF((p) => ({ ...p, starts_at: v, ends_at: !p.ends_at || p.ends_at <= v ? plusHour(v) : p.ends_at }));
  return (
    <form className="card animate-fade-up space-y-4"
      onSubmit={(e) => { e.preventDefault(); onSave({ ...f, starts_at: fromLocalInput(f.starts_at), ends_at: fromLocalInput(f.ends_at) }); }}>
      <h2 className="font-semibold">{initial?.title ? "Edit meeting" : "Jadwalkan meeting"}</h2>
      <div>
        <label className="label">Judul</label>
        <input className="input" required maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Agenda <span className="text-stone-400">(opsional)</span></label>
        <textarea className="input min-h-20" maxLength={3000} value={f.agenda || ""} onChange={(e) => setF({ ...f, agenda: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Mulai</label>
          <input type="datetime-local" className="input" required value={f.starts_at} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">Selesai</label>
          <input type="datetime-local" className="input" required min={f.starts_at} value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Tautan Google Meet atau meeting lain <span className="text-stone-400">(opsional)</span></label>
        <input type="url" className="input" maxLength={500} placeholder="https://meet.google.com/xxx-xxxx-xxx"
          value={f.meeting_url || ""} onChange={(e) => setF({ ...f, meeting_url: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

export default function MeetingsTab({ wid, me, isAdmin }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [past, setPast] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(null);

  const load = useCallback(
    () => api.get(`/workspaces/${wid}/meetings`, { params: { past: past ? 1 : 0 } })
      .then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e))),
    [wid, past, toast]);
  useEffect(() => { setList(null); load(); }, [load]);

  const save = async (payload) => {
    setBusy(true);
    try {
      if (form.id) await api.put(`/workspaces/${wid}/meetings/${form.id}`, payload);
      else await api.post(`/workspaces/${wid}/meetings`, payload);
      toast.success("Meeting disimpan");
      setForm(null);
      await load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const answer = async (m, response) => {
    try { await api.put(`/workspaces/${wid}/meetings/${m.id}/rsvp`, { response }); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const doCancel = async () => {
    try { await api.post(`/workspaces/${wid}/meetings/${cancel.id}/cancel`); toast.success("Meeting dibatalkan"); await load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setCancel(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={`chip ${!past ? "chip-active" : ""}`} onClick={() => setPast(false)}>Akan datang</button>
        <button className={`chip ${past ? "chip-active" : ""}`} onClick={() => setPast(true)}>Sudah lewat</button>
        {!form && <button className="btn ml-auto" onClick={() => setForm({})}><Plus size={16} /> Jadwalkan</button>}
      </div>

      {form && (
        <MeetingForm
          initial={form.id ? {
            title: form.title, agenda: form.agenda, meeting_url: form.meeting_url,
            starts_at: toLocalInput(form.starts_at), ends_at: toLocalInput(form.ends_at),
          } : undefined}
          busy={busy} onSave={save} onCancel={() => setForm(null)} />
      )}

      {!list ? <div className="skeleton h-28" /> : list.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-500">{past ? "Belum ada meeting yang lewat." : "Tidak ada meeting terjadwal."}</div>
      ) : (
        <div className="space-y-3">
          {list.map((m) => {
            const cancelled = m.status === "cancelled";
            const canManage = !cancelled && (same(m.created_by, me.id) || isAdmin);
            const acc = m.attendees.filter((a) => a.rsvp === "accepted");
            const dec = m.attendees.filter((a) => a.rsvp === "declined");
            return (
              <div key={m.id} className={`card animate-fade-up space-y-3 ${cancelled ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-sky-100 p-2 text-sky-700"><Video size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`break-words font-semibold ${cancelled ? "line-through" : ""}`}>{m.title}</h3>
                    <p className="text-sm text-stone-600">{dtShort(m.starts_at)} - {hm(m.ends_at)}</p>
                    <p className="text-xs text-stone-400">Dibuat oleh {m.creator?.name || "anggota"}</p>
                  </div>
                  {cancelled && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Dibatalkan</span>}
                </div>
                {m.agenda && <p className="whitespace-pre-line text-sm text-stone-600">{m.agenda}</p>}

                {!cancelled && m.meeting_url && (
                  <div className="flex flex-wrap gap-2">
                    <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="btn !py-1.5 text-sm"><ExternalLink size={14} /> Buka meeting</a>
                    <CopyButton text={m.meeting_url} label="Salin tautan" className="btn-ghost !py-1.5 text-sm" />
                  </div>
                )}

                {!cancelled && !past && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button className={`chip ${m.my_rsvp === "accepted" ? "chip-active" : ""}`} onClick={() => answer(m, "accepted")}><Check size={13} className="mr-1" /> Hadir</button>
                    <button className={`chip ${m.my_rsvp === "declined" ? "!border-red-600 !bg-red-600 !text-white" : ""}`} onClick={() => answer(m, "declined")}><X size={13} className="mr-1" /> Tidak hadir</button>
                    {m.my_rsvp === "pending" && <span className="text-xs text-amber-700">Belum merespons</span>}
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-stone-500">{acc.length} hadir · {dec.length} tidak hadir · {m.attendees.length - acc.length - dec.length} belum merespons</summary>
                  <ul className="mt-2 space-y-1 text-xs text-stone-600">
                    {m.attendees.map((a) => (
                      <li key={a.id}>{a.name}: {{ accepted: "hadir", declined: "tidak hadir", pending: "belum merespons" }[a.rsvp]}</li>
                    ))}
                  </ul>
                </details>

                {canManage && (
                  <div className="flex gap-2 border-t border-sand pt-3">
                    <button className="btn-ghost !py-1.5 text-sm" onClick={() => setForm(m)}><Pencil size={14} /> Edit</button>
                    <button className="btn-danger !py-1.5 text-sm" onClick={() => setCancel(m)}>Batalkan</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!cancel} danger title="Batalkan meeting?" message="Peserta akan diberi tahu lewat WhatsApp (jika aktif)."
        confirmLabel="Batalkan meeting" onConfirm={doCancel} onCancel={() => setCancel(null)} />
    </div>
  );
}