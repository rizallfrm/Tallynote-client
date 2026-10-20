import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, LogOut, MessageCircle, ShieldCheck, Trash2, UserMinus } from "lucide-react";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import ConfirmDialog from "../common/ConfirmDialog";
import CopyButton from "../common/CopyButton";
import { useToast } from "../../context/ToastContext";
import { ROLE, dtShort, same } from "../../utils/together";
import { errMsg } from "../../utils/format";

const STATUS = {
  active: ["Aktif", "bg-primary-100 text-primary-800"], expired: ["Kedaluwarsa", "bg-stone-100 text-stone-600"],
  revoked: ["Dicabut", "bg-red-100 text-red-700"], full: ["Penuh", "bg-amber-100 text-amber-700"],
};

export default function MembersTab({ wid, me, ws, isAdmin, members, reloadMembers, reloadWs }) {
  const toast = useToast();
  const nav = useNavigate();
  const isOwner = ws.role === "owner";
  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ days: 7, max: "", revoke: false });
  const [fresh, setFresh] = useState(null);
  const [settings, setSettings] = useState({ name: ws.name, description: ws.description || "" });
  const [dialog, setDialog] = useState(null); // { type, member? }
  const [busy, setBusy] = useState(false);

  const loadInvites = useCallback(() => {
    if (isAdmin) api.get(`/workspaces/${wid}/invites`).then((r) => setInvites(r.data)).catch(() => {});
  }, [wid, isAdmin]);
  useEffect(() => { loadInvites(); }, [loadInvites]);

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); if (ok) toast.success(ok); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const createInvite = () => run(async () => {
    const { data } = await api.post(`/workspaces/${wid}/invites`, {
      expires_in_days: Number(form.days), max_uses: form.max ? Number(form.max) : null, revoke_others: form.revoke,
    });
    setFresh(data);
    loadInvites();
  }, "Link undangan dibuat");

  const confirm = () => {
    const { type, member } = dialog;
    run(async () => {
      if (type === "remove") { await api.delete(`/workspaces/${wid}/members/${member.user_id}`); await reloadMembers(); await reloadWs(); }
      if (type === "transfer") { await api.put(`/workspaces/${wid}/members/${member.user_id}`, { role: "owner" }); await reloadMembers(); await reloadWs(); }
      if (type === "leave") { await api.post(`/workspaces/${wid}/leave`); nav("/together", { replace: true }); }
      if (type === "delete") { await api.delete(`/workspaces/${wid}`); nav("/together", { replace: true }); }
    }, null).finally(() => setDialog(null));
  };

  const setRole = (m, role) => run(async () => {
    await api.put(`/workspaces/${wid}/members/${m.user_id}`, { role });
    await reloadMembers();
  }, "Peran diperbarui");

  const saveSettings = (e) => {
    e.preventDefault();
    run(async () => { await api.put(`/workspaces/${wid}`, settings); await reloadWs(); }, "Pengaturan ruang disimpan");
  };

  const DIALOG = {
    remove: ["Keluarkan anggota?", "Anggota ini kehilangan akses ke ruang dan dicopot dari tugas dan meeting.", "Keluarkan"],
    transfer: ["Pindahkan kepemilikan?", "Kamu menjadi admin dan anggota ini menjadi pemilik ruang.", "Pindahkan"],
    leave: ["Keluar dari ruang?", "Kamu tidak lagi bisa mengakses ruang ini kecuali diundang kembali.", "Keluar"],
    delete: ["Hapus ruang ini?", "Seluruh forum, tugas, dan meeting di ruang ini dihapus permanen untuk semua anggota.", "Hapus ruang"],
  };

  return (
    <div className="space-y-5">
      {isAdmin && (
        <section className="card space-y-4">
          <h2 className="flex items-center gap-2 font-semibold"><Link2 size={18} /> Undang lewat link</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Berlaku</label>
              <select className="input" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })}>
                {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} hari</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batas pemakaian</label>
              <select className="input" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })}>
                <option value="">Tanpa batas</option>
                {[1, 5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} orang</option>)}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[rgb(106,120,80)]" checked={form.revoke}
                onChange={(e) => setForm({ ...form, revoke: e.target.checked })} /> Cabut link lama
            </label>
          </div>
          <button className="btn" disabled={busy} onClick={createInvite}>Buat link undangan</button>

          {fresh && (
            <div className="animate-fade-up space-y-2 rounded-xl border border-primary-300 bg-primary-50 p-3">
              <p className="text-xs text-primary-800">Salin sekarang. Demi keamanan, link ini tidak ditampilkan lagi setelah kamu meninggalkan halaman.</p>
              <input readOnly className="input text-xs" value={fresh.link} onFocus={(e) => e.target.select()} />
              <div className="flex flex-wrap gap-2">
                <CopyButton text={fresh.link} label="Salin link" className="btn !py-1.5 text-sm" />
                <a className="btn-ghost !py-1.5 text-sm" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(`Gabung ke ruang "${ws.name}" di Tallynote: ${fresh.link}`)}`}>
                  <MessageCircle size={14} /> Bagikan ke WhatsApp
                </a>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <ul className="divide-y divide-sand text-sm">
              {invites.slice(0, 8).map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[i.status][1]}`}>{STATUS[i.status][0]}</span>
                  <span className="text-xs text-stone-500">
                    Dibuat {dtShort(i.created_at)} · sampai {dtShort(i.expires_at)} · {i.uses}{i.max_uses ? `/${i.max_uses}` : ""} dipakai
                  </span>
                  {i.status === "active" && (
                    <button className="btn-danger ml-auto !px-3 !py-1 text-xs" disabled={busy}
                      onClick={() => run(async () => { await api.delete(`/workspaces/${wid}/invites/${i.id}`); loadInvites(); }, "Link dicabut")}>
                      Cabut
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> Anggota ({members.length})</h2>
        <ul className="divide-y divide-sand">
          {members.map((m) => {
            const self = same(m.user_id, me.id);
            const canRemove = isAdmin && !self && m.role !== "owner" && (m.role === "member" || isOwner);
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Avatar user={m} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}{self && <span className="text-stone-400"> (kamu)</span>}</div>
                  <div className="text-xs text-stone-500">Bergabung {dtShort(m.joined_at)}</div>
                </div>
                {isOwner && !self ? (
                  <select className="input !w-auto !py-1 text-xs" value={m.role} onChange={(e) => setRole(m, e.target.value)}>
                    <option value="member">Anggota</option><option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">{ROLE[m.role]}</span>
                )}
                {isOwner && !self && (
                  <button className="chip text-xs" onClick={() => setDialog({ type: "transfer", member: m })}>Jadikan pemilik</button>
                )}
                {canRemove && (
                  <button className="btn-danger !p-2" aria-label="Keluarkan" onClick={() => setDialog({ type: "remove", member: m })}><UserMinus size={15} /></button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isAdmin && (
        <form onSubmit={saveSettings} className="card space-y-3">
          <h2 className="font-semibold">Pengaturan ruang</h2>
          <input className="input" required minLength={2} maxLength={100} value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
          <textarea className="input min-h-20" maxLength={1000} placeholder="Deskripsi" value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
          <button className="btn" disabled={busy}>Simpan</button>
        </form>
      )}

      <section className="card flex flex-wrap gap-2">
        {!isOwner && <button className="btn-danger" onClick={() => setDialog({ type: "leave" })}><LogOut size={16} /> Keluar dari ruang</button>}
        {isOwner && <button className="btn-danger" onClick={() => setDialog({ type: "delete" })}><Trash2 size={16} /> Hapus ruang</button>}
        {isOwner && <p className="w-full text-xs text-stone-500">Pemilik tidak bisa keluar. Pindahkan kepemilikan ke anggota lain atau hapus ruang.</p>}
      </section>

      <ConfirmDialog open={!!dialog} danger={dialog?.type !== "transfer"} busy={busy}
        title={dialog ? DIALOG[dialog.type][0] : ""} message={dialog ? DIALOG[dialog.type][1] : ""}
        confirmLabel={dialog ? DIALOG[dialog.type][2] : ""} onConfirm={confirm} onCancel={() => setDialog(null)} />
    </div>
  );
}