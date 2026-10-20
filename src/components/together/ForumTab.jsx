import { useCallback, useEffect, useState } from "react";
import { CornerDownRight, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import ConfirmDialog from "../common/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { dtShort, isAdminRole, same } from "../../utils/together";
import { errMsg } from "../../utils/format";

function Bubble({ p, canDelete, onDelete, onReply, small }) {
  const activity = p.kind === "activity";
  return (
    <div className={`flex gap-3 ${small ? "" : "py-3"}`}>
      <Avatar user={{ name: p.User?.name, avatar_url: p.User?.avatar_url }} size={small ? 26 : 34} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
          <b className="text-sm text-stone-800">{p.User?.name || "Anggota"}</b>
          <span>{dtShort(p.created_at)}</span>
        </div>
        {activity ? (
          <p className="mt-0.5 flex items-start gap-1.5 text-sm italic text-stone-500">
            <Sparkles size={13} className="mt-1 shrink-0 text-primary-600" /> {p.body}
          </p>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-stone-700">{p.body}</p>
        )}
        <div className="mt-1 flex gap-3 text-xs">
          {onReply && <button className="text-primary-700 hover:underline" onClick={onReply}>Balas</button>}
          {canDelete && <button className="text-red-600 hover:underline" onClick={onDelete}><Trash2 size={12} className="mr-1 inline" />Hapus</button>}
        </div>
      </div>
    </div>
  );
}

export default function ForumTab({ wid, me, isAdmin }) {
  const toast = useToast();
  const [first, setFirst] = useState(null);
  const [firstMore, setFirstMore] = useState(false);
  const [older, setOlder] = useState([]);
  const [olderMore, setOlderMore] = useState(null);
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() =>
    api.get(`/workspaces/${wid}/posts`).then(({ data }) => { setFirst(data.items); setFirstMore(data.has_more); })
      .catch(() => {}), [wid]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 15000); // polling 15 detik
    return () => clearInterval(id);
  }, [load]);

  const items = [...(first || []), ...older.filter((o) => !first?.some((f) => same(f.id, o.id)))];
  const hasMore = older.length ? olderMore : firstMore;

  const loadOlder = async () => {
    const before = items[items.length - 1]?.id;
    const { data } = await api.get(`/workspaces/${wid}/posts`, { params: { before } });
    setOlder((o) => [...o, ...data.items]);
    setOlderMore(data.has_more);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await api.post(`/workspaces/${wid}/posts`, { body: text, parent_id: reply?.id });
      setText(""); setReply(null);
      await load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try {
      await api.delete(`/workspaces/${wid}/posts/${del.id}`);
      setOlder((o) => o.filter((x) => !same(x.id, del.id)));
      await load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setDel(null); }
  };

  const canDel = (p) => isAdmin || (p.kind === "message" && same(p.user_id, me.id));

  return (
    <div className="space-y-4">
      <form onSubmit={send} className="card space-y-2">
        {reply && (
          <p className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs text-primary-800">
            <CornerDownRight size={13} /> Membalas {reply.User?.name}
            <button type="button" className="ml-auto underline" onClick={() => setReply(null)}>Batal</button>
          </p>
        )}
        <textarea className="input min-h-20" maxLength={2000} value={text} placeholder="Tulis pesan untuk anggota ruang..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e); }} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-400">Ctrl+Enter untuk kirim</span>
          <button className="btn" disabled={busy || !text.trim()}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Kirim
          </button>
        </div>
      </form>

      {!first ? <div className="skeleton h-32" /> : items.length === 0 ? (
        <div className="card py-10 text-center text-sm text-stone-500">Belum ada diskusi. Mulai percakapan pertama.</div>
      ) : (
        <div className="card divide-y divide-sand !py-2">
          {items.map((p) => (
            <div key={p.id}>
              <Bubble p={p} canDelete={canDel(p)} onDelete={() => setDel(p)} onReply={() => setReply(p)} />
              {p.replies?.length > 0 && (
                <div className="mb-3 ml-9 space-y-3 border-l-2 border-sand pl-4">
                  {p.replies.map((r) => <Bubble key={r.id} p={r} small canDelete={canDel(r)} onDelete={() => setDel(r)} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {hasMore && <button className="btn-ghost mx-auto" onClick={loadOlder}>Muat lebih lama</button>}

      <ConfirmDialog open={!!del} danger title="Hapus pesan ini?" message="Balasan di bawahnya (jika ada) ikut terhapus."
        confirmLabel="Hapus" onConfirm={remove} onCancel={() => setDel(null)} />
    </div>
  );
}