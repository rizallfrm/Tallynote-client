import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Star } from "lucide-react";
import api from "../../api/axios";
import StatusBadge from "./StatusBadge";
import DeadlineBadge from "./DeadlineBadge";
import CopyButton from "../common/CopyButton";
import { useToast } from "../../context/ToastContext";
import { activityToText, errMsg, formatDate } from "../../utils/format";

export default function ActivityCard({ activity, showDate = true }) {
  const toast = useToast();
  const [a, setA] = useState(activity);
  useEffect(() => setA(activity), [activity]);

  const patch = async (body) => {
    const prev = a;
    setA({ ...a, ...body }); // tampil langsung, dibatalkan jika gagal
    try { await api.put(`/activities/${a.id}`, body); }
    catch (e) { setA(prev); toast.error(errMsg(e)); }
  };
  const done = a.status === "completed";

  return (
    <div className="card animate-fade-up transition hover:border-primary-300 hover:shadow-md">
      <Link to={`/activities/${a.id}`} className="block">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-stone-500">
          {showDate && <span>{formatDate(a.activity_date)}</span>}
          {a.Category && <span className="rounded-full bg-sand px-2.5 py-0.5">{a.Category.name}</span>}
          <StatusBadge status={a.status} />
          <DeadlineBadge activity={a} />
          {a.ai_generated && <span className="flex items-center gap-1 text-primary-700"><Sparkles size={12} /> AI</span>}
        </div>
        <h3 className="mt-2.5 break-words font-semibold text-stone-900">{a.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{a.description || a.activity_input}</p>
      </Link>

      <div className="mt-3 flex items-center gap-2 border-t border-sand pt-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-x-2 text-xs text-primary-700">
          {a.Tags?.slice(0, 4).map((t) => <span key={t.id}>#{t.name}</span>)}
        </div>
        <button type="button" className="btn-ghost !p-2" aria-label={a.is_favorite ? "Hapus dari favorit" : "Tandai favorit"}
          title={a.is_favorite ? "Hapus dari favorit" : "Tandai favorit"}
          onClick={() => patch({ is_favorite: !a.is_favorite })}>
          <Star size={16} className={a.is_favorite ? "fill-amber-400 text-amber-500" : ""} />
        </button>
        <CopyButton text={() => activityToText(a)} iconOnly className="btn-ghost !p-2" />
        <button type="button" className={done ? "btn !px-3 !py-2" : "btn-ghost !px-3 !py-2"}
          onClick={() => patch({ status: done ? "in_progress" : "completed" })}>
          <Check size={16} /> <span className="hidden sm:inline">{done ? "Selesai" : "Tandai selesai"}</span>
        </button>
      </div>
    </div>
  );
}