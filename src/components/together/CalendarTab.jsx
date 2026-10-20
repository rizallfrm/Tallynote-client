import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks, Video } from "lucide-react";
import api from "../../api/axios";
import { hm } from "../../utils/together";
import { formatDate, toLocalInput } from "../../utils/format";

const WD = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad = (n) => String(n).padStart(2, "0");
const keyOf = (iso) => toLocalInput(iso).slice(0, 10);
const todayKey = () => new Date().toLocaleDateString("en-CA");

export default function CalendarTab({ wid }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [data, setData] = useState({ tasks: [], meetings: [] });
  const [sel, setSel] = useState(todayKey());

  useEffect(() => {
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    api.get(`/workspaces/${wid}/calendar`, { params: { start: cursor.toISOString(), end: end.toISOString() } })
      .then((r) => setData(r.data)).catch(() => {});
  }, [wid, cursor]);

  const byDay = useMemo(() => {
    const m = {};
    data.tasks.forEach((t) => ((m[keyOf(t.deadline_at)] ||= { t: [], m: [] }).t.push(t)));
    data.meetings.forEach((x) => ((m[keyOf(x.starts_at)] ||= { t: [], m: [] }).m.push(x)));
    return m;
  }, [data]);

  const y = cursor.getFullYear(), mo = cursor.getMonth();
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null),
    ...Array.from({ length: new Date(y, mo + 1, 0).getDate() }, (_, i) => `${y}-${pad(mo + 1)}-${pad(i + 1)}`)];
  const move = (d) => setCursor(new Date(y, mo + d, 1));
  const day = byDay[sel] || { t: [], m: [] };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[420px_1fr]">
      <div className="card min-w-0 !p-3 sm:!p-5">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-ghost !px-2" onClick={() => move(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
          <span className="font-medium text-primary-800">
            {cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
          <button className="btn-ghost !px-2" onClick={() => move(1)} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
        </div>
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-stone-400">{WD.map((d) => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const x = byDay[d];
            const on = d === sel;
            return (
              <button key={d} onClick={() => setSel(d)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${
                  on ? "bg-primary-600 text-white" : x ? "bg-primary-50 hover:bg-primary-100" : "hover:bg-stone-50"
                } ${d === todayKey() && !on ? "ring-1 ring-primary-600" : ""}`}>
                <span>{Number(d.slice(8))}</span>
                <span className="flex h-1.5 gap-0.5">
                  {x?.t.length > 0 && <i className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-amber-500"}`} />}
                  {x?.m.length > 0 && <i className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-sky-500"}`} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-500" /> Deadline tugas</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> Meeting</span>
        </div>
      </div>

      <section className="min-w-0 space-y-3">
        <h2 className="font-semibold">{formatDate(sel)}</h2>
        {day.t.length + day.m.length === 0 && <div className="card py-8 text-center text-sm text-stone-500">Tidak ada deadline atau meeting.</div>}
        {day.m.map((m) => (
          <div key={m.id} className="card flex items-start gap-3">
            <span className="rounded-lg bg-sky-100 p-2 text-sky-700"><Video size={16} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-stone-500">{hm(m.starts_at)} - {hm(m.ends_at)}</div>
            </div>
            {m.meeting_url && <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-1.5 text-sm">Buka</a>}
          </div>
        ))}
        {day.t.map((t) => (
          <div key={t.id} className="card flex items-start gap-3">
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><ListChecks size={16} /></span>
            <div className="min-w-0 flex-1">
              <div className={`font-medium ${t.status === "done" ? "line-through" : ""}`}>{t.title}</div>
              <div className="text-xs text-stone-500">
                Jam {hm(t.deadline_at)} · {t.assignees.map((a) => a.name).join(", ") || "Belum ada penanggung jawab"}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}