export const ROLE = { owner: "Pemilik", admin: "Admin", member: "Anggota" };
export const PRIORITY = {
  low: { label: "Rendah", cls: "bg-stone-100 text-stone-600" },
  medium: { label: "Sedang", cls: "bg-amber-100 text-amber-700" },
  high: { label: "Tinggi", cls: "bg-red-100 text-red-700" },
};
export const TSTATUS = { todo: "Belum mulai", in_progress: "Dikerjakan", done: "Selesai" };

export const same = (a, b) => String(a) === String(b);
export const isAdminRole = (r) => r === "admin" || r === "owner";
export const dtShort = (iso) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const hm = (iso) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

// token undangan disimpan sementara agar tidak hilang saat user login atau mendaftar
const KEY = "pending_invite";
export const savePendingInvite = (t) => { try { localStorage.setItem(KEY, t); } catch { /* abaikan */ } };
export const clearPendingInvite = () => { try { localStorage.removeItem(KEY); } catch { /* abaikan */ } };
export const postLoginPath = () => {
  try { const t = localStorage.getItem(KEY); return t ? `/join/${t}` : "/"; } catch { return "/"; }
};