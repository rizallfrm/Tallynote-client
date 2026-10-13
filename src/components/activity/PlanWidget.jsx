import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import api from "../../api/axios";
import { useActivity } from "../../context/ActivityContext";
import { useToast } from "../../context/ToastContext";
import { errMsg, shiftDate, today } from "../../utils/format";

export default function PlanWidget({ onDone }) {
  const { categories } = useActivity();
  const toast = useToast();
  const [text, setText] = useState("");
  const [cat, setCat] = useState("");
  const [day, setDay] = useState("tomorrow");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const titles = text.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!titles.length) return;
    setBusy(true);
    try {
      const date = day === "today" ? today() : shiftDate("daily", today(), 1);
      const { data } = await api.post("/activities/plan", { titles, date, category_id: Number(cat) });
      toast.success(`${data.created} rencana ditambahkan untuk ${day === "today" ? "hari ini" : "besok"}`);
      setText("");
      onDone?.();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <CalendarPlus size={18} className="text-primary-700" /> Rencana cepat
      </h2>
      <textarea className="input min-h-20" value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"Satu rencana per baris (maks. 10)\nContoh:\nReview PR tim\nBelajar Redis 1 jam"} />
      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto" required value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Kategori...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" className={`chip ${day === "tomorrow" ? "chip-active" : ""}`} onClick={() => setDay("tomorrow")}>Besok</button>
        <button type="button" className={`chip ${day === "today" ? "chip-active" : ""}`} onClick={() => setDay("today")}>Hari ini</button>
        <button className="btn ml-auto" disabled={busy || !text.trim()}>Tambah rencana</button>
      </div>
      <p className="text-xs text-stone-500">Rencana tersimpan berstatus <b>Direncanakan</b>. Centang di kartunya saat sudah selesai.</p>
    </form>
  );
}