import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, LogIn, Users } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Logo from "../components/common/Logo";
import { clearPendingInvite, savePendingInvite } from "../utils/together";
import { errMsg } from "../utils/format";

export default function JoinWorkspace() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { savePendingInvite(token); return; } // login dulu, lalu kembali ke sini
    clearPendingInvite();
    api.get(`/invites/${token}`).then((r) => setInfo(r.data)).catch((e) => setError(errMsg(e)));
  }, [loading, user, token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const join = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/invites/${token}/join`);
      toast.success(data.already_member ? "Kamu sudah menjadi anggota" : "Berhasil bergabung");
      nav(data.workspace_id ? `/together/${data.workspace_id}` : "/together", { replace: true });
    } catch (e) { setError(errMsg(e)); setInfo(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card animate-fade-up w-full max-w-sm space-y-4 text-center">
        <Logo size="auth" className="mx-auto" />
        {error ? (
          <>
            <p className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-600">{error}</p>
            <p className="text-xs text-stone-500">Minta admin ruang membuat link undangan baru.</p>
            <Link to="/together" className="btn-ghost w-full">Ke daftar ruang</Link>
          </>
        ) : !info ? (
          <Loader2 className="mx-auto animate-spin text-primary-600" />
        ) : (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700"><Users /></span>
            <div>
              <p className="text-sm text-stone-500">Kamu diundang ke ruang</p>
              <h1 className="text-xl font-semibold">{info.workspace.name}</h1>
              {info.workspace.description && <p className="mt-1 text-sm text-stone-600">{info.workspace.description}</p>}
              <p className="mt-2 text-xs text-stone-400">{info.workspace.member_count} anggota</p>
            </div>
            {info.already_member ? (
              <Link to={`/together/${info.workspace_id}`} className="btn w-full">Buka ruang</Link>
            ) : (
              <button className="btn w-full" onClick={join} disabled={busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Gabung ke ruang
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}