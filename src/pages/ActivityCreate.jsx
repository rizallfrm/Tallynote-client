import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useActivity } from "../context/ActivityContext";
import { useToast } from "../context/ToastContext";
import ActivityForm from "../components/activity/ActivityForm";
import { errMsg, today } from "../utils/format";
import { fromLocalInput } from "../utils/format";

export default function ActivityCreate() {
  const { createActivity, previewActivity, aiLoading } = useActivity();
  const nav = useNavigate();
  const toast = useToast();
  const { state } = useLocation();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState(null);

  const qDate = params.get("date");
  const tpl = state?.template;
  const initial = {
    activity_date: /^\d{4}-\d{2}-\d{2}$/.test(qDate || "") ? qDate : today(),
    ...(tpl && {
      title: tpl.title,
      category_id: tpl.category_id ? String(tpl.category_id) : "",
      activity_input: tpl.activity_input || "",
    }),
  };

  const generate = async (story) => {
    setAiError(null);
    try { return await previewActivity(story); }
    catch (e) {
      const d = e.response?.data;
      setAiError({
        message: d?.message || "AI gagal memproses permintaan. Coba lagi atau isi manual.",
        code: d?.code,
        retryAfter: d?.retryAfter || 0,
      });
      return null;
    }
  };

  const submit = async (f, { mode }) => {
    setSaving(true);
    try {
      const base = {
        title: f.title, category_id: Number(f.category_id), activity_date: f.activity_date,
        status: f.status, mode, tags: f.tags,
        description: f.description, learning: f.learning, obstacle: f.obstacle,
        deadline_at: fromLocalInput(f.deadline_at),
      };
      const payload = mode === "ai" ? { ...base, activity_input: f.activity_input } : base;
      const { activity } = await createActivity(payload);
      nav(`/activities/${activity.id}`, { state: { justCreated: true } });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="page-title">Catat Aktivitas</h1>
        <p className="page-sub">
          Pilih <b>Generate AI</b> untuk menyusun otomatis dari ceritamu, atau <b>Isi Manual</b>.
        </p>
      </div>
      <ActivityForm initial={initial} onSubmit={submit} onGenerate={generate}
        busy={saving} aiBusy={aiLoading} aiError={aiError} />
    </div>
  );
}