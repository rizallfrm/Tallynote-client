import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CopyPlus,
  FileText,
  Lightbulb,
  Pencil,
  Quote,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import api from "../api/axios";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";
import ActivityForm from "../components/activity/ActivityForm";
import StatusBadge from "../components/activity/StatusBadge";
import CopyButton from "../components/common/CopyButton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  activityToText,
  errMsg,
  formatDate,
  today,
  formatDeadline,
} from "../utils/format";
import DeadlineBadge from "../components/activity/DeadlineBadge";
import { fromLocalInput } from "../utils/format";
import LinkedNotes from "../components/activity/LinkedNotes";

function Section({
  icon: Icon,
  title,
  text,
  tone = "bg-white",
  iconTone = "bg-primary-100 text-primary-700",
}) {
  return (
    <div className={`card ${tone}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`rounded-lg p-1.5 ${iconTone}`}>
          <Icon size={16} />
        </span>
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        {text && (
          <CopyButton
            text={`${title}:\n${text}`}
            iconOnly
            className="btn-ghost p-1.5"
          />
        )}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
        {text || <span className="text-stone-400">Belum diisi</span>}
      </p>
    </div>
  );
}

export default function ActivityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const toast = useToast();
  const { getActivity, updateActivity, removeActivity, regenerateActivity } =
    useActivity();

  const [a, setA] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    getActivity(id)
      .then(setA)
      .catch(() => nav("/activities", { replace: true }));
  }, [id, getActivity, nav]);

  useEffect(() => {
    if (!state?.justCreated) return;
    toast.success("Aktivitas tersimpan");
    window.history.replaceState({}, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (f) => {
    setSaving(true);
    try {
      setA(
        await updateActivity(id, {
          title: f.title,
          category_id: Number(f.category_id),
          activity_date: f.activity_date,
          status: f.status,
          description: f.description,
          learning: f.learning,
          obstacle: f.obstacle,
          tags: f.tags,
        }),
      );
      setEditing(false);
      toast.success("Perubahan disimpan");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleFav = async () => {
    try {
      setA(await updateActivity(id, { is_favorite: !a.is_favorite }));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const duplicate = async () => {
    try {
      const { data } = await api.post(`/activities/${id}/duplicate`, {
        date: today(),
      });
      toast.success("Disalin ke hari ini");
      nav(`/activities/${data.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const doRegenerate = async () => {
    setWorking(true);
    try {
      setA(await regenerateActivity(id));
      toast.success("Berhasil digenerate ulang oleh AI");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setWorking(false);
      setDialog(null);
    }
  };

  const doDelete = async () => {
    setWorking(true);
    try {
      await removeActivity(Number(id));
      toast.success("Aktivitas dihapus");
      nav("/activities", { replace: true });
    } catch (e) {
      toast.error(errMsg(e));
      setWorking(false);
      setDialog(null);
    }
  };

  if (!a)
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="skeleton h-32" />
        <div className="skeleton h-40" />
      </div>
    );

  const linked = !!(a.workspace_task_id || a.workspace_meeting_id);

  if (editing && linked)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
          onClick={() => setEditing(false)}
        >
          <ArrowLeft size={16} /> Kembali ke detail
        </button>
        <h1 className="page-title">Catatan pribadi</h1>
        <LinkedNotes
          activity={a}
          busy={saving}
          onCancel={() => setEditing(false)}
          onSave={async (f) => {
            setSaving(true);
            try {
              setA(await updateActivity(id, f));
              setEditing(false);
              toast.success("Catatan disimpan");
            } catch (e) {
              toast.error(errMsg(e));
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
    );

  if (editing)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
          onClick={() => setEditing(false)}
        >
          <ArrowLeft size={16} /> Kembali ke detail
        </button>
        <h1 className="page-title">Edit Aktivitas</h1>
        <ActivityForm
          edit
          initial={{ ...a, category_id: String(a.category_id) }}
          onSubmit={save}
          busy={saving}
          submitLabel="Simpan perubahan"
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/activities"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft size={16} /> Riwayat aktivitas
      </Link>
      {linked && (
        <div className="card flex flex-wrap items-center gap-3 bg-primary-50">
          <span className="rounded-lg bg-primary-100 p-2 text-primary-700">
            <Users size={16} />
          </span>
          <p className="min-w-0 flex-1 text-sm text-stone-700">
            Berasal dari ruang <b>{a.Workspace?.name || "Together"}</b>. Judul,
            tanggal, status, dan deadline mengikuti{" "}
            {a.workspace_task_id ? "tugas" : "meeting"} di ruang. Kamu bisa
            menambah pembelajaran dan kendala pribadi.
          </p>
          {a.workspace_id && (
            <Link
              className="btn-ghost !py-1.5 text-sm"
              to={`/together/${a.workspace_id}?tab=${a.workspace_task_id ? "tasks" : "meetings"}`}
            >
              Buka di ruang
            </Link>
          )}
        </div>
      )}
      <div className="card animate-fade-up">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{formatDate(a.activity_date)}</span>
          {a.Category && (
            <span className="rounded-full bg-sand px-2.5 py-0.5">
              {a.Category.name}
            </span>
          )}
          <StatusBadge status={a.status} />
          <DeadlineBadge activity={a} />
          {a.ai_generated && a.activity_input && !linked && (
            <button
              className="btn-ghost"
              onClick={() => setDialog("regenerate")}
            >
              <Sparkles size={16} /> Generate ulang
            </button>
          )}
          {!linked && (
            <button
              className="btn-danger ml-auto"
              onClick={() => setDialog("delete")}
            >
              <Trash2 size={16} /> Hapus
            </button>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2">
          <h1 className="flex-1 text-2xl font-semibold tracking-tight">
            {a.title}
          </h1>
          <button
            className="btn-ghost !p-2"
            onClick={toggleFav}
            aria-label="Favorit"
            title={a.is_favorite ? "Hapus dari favorit" : "Tandai favorit"}
          >
            <Star
              size={18}
              className={a.is_favorite ? "fill-amber-400 text-amber-500" : ""}
            />
          </button>
        </div>
        {a.Tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {a.Tags.map((t) => (
              <Link
                key={t.id}
                to={`/activities?tag=${encodeURIComponent(t.name)}`}
                className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton text={() => activityToText(a)} label="Salin semua" />
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit
          </button>
          <button className="btn-ghost" onClick={duplicate}>
            <CopyPlus size={16} /> Salin ke hari ini
          </button>
          {a.ai_generated && a.activity_input && (
            <button
              className="btn-ghost"
              onClick={() => setDialog("regenerate")}
            >
              <Sparkles size={16} /> Generate ulang
            </button>
          )}
          <button
            className="btn-danger ml-auto"
            onClick={() => setDialog("delete")}
          >
            <Trash2 size={16} /> Hapus
          </button>
        </div>
      </div>

      <Section
        icon={FileText}
        title="Uraian aktivitas"
        text={a.description || a.activity_input}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Section
          icon={Lightbulb}
          title="Pembelajaran yang diperoleh"
          text={a.learning}
          tone="bg-primary-50"
        />
        <Section
          icon={AlertTriangle}
          title="Kendala yang dialami"
          text={a.obstacle}
          tone="bg-amber-50"
          iconTone="bg-amber-100 text-amber-700"
        />
      </div>
      {a.deadline_at && (
        <p className="mt-2 text-sm text-stone-600">
          Deadline: <b>{formatDeadline(a.deadline_at)}</b>
        </p>
      )}

      {a.ai_generated && a.activity_input && (
        <details className="card">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-stone-600">
            <Quote size={16} /> Lihat cerita asli
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
            {a.activity_input}
          </p>
        </details>
      )}

      <ConfirmDialog
        open={dialog === "regenerate"}
        title="Generate ulang dengan AI?"
        message="Uraian, pembelajaran, dan kendala saat ini akan ditimpa hasil baru dari AI."
        confirmLabel="Generate ulang"
        busy={working}
        onConfirm={doRegenerate}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        danger
        title="Hapus aktivitas ini?"
        message="Aktivitas dan riwayat generate AI-nya akan dihapus permanen."
        confirmLabel="Hapus"
        busy={working}
        onConfirm={doDelete}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
