import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import ActivityCard from "../components/activity/ActivityCard";
import CopyButton from "../components/common/CopyButton";
import StatCard from "../components/summary/StatCard";
import { activitiesToText, errMsg, formatDate, periodLabel, shiftDate, today } from "../utils/format";

const DOT = { completed: "bg-primary-dark", in_progress: "bg-amber-400", planned: "bg-stone-300" };
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad = (n) => String(n).padStart(2, "0");

export default function CalendarPage() {
  const toast = useToast();
  const [cursor, setCursor] = useState(`${today().slice(0, 8)}01`);
  const [selected, setSelected] = useState(today());
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = today();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/summaries", { params: { range: "monthly", date: cursor } })
      .then(({ data }) => alive && setActs(data.activities))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [cursor, toast]);

  const byDate = useMemo(
    () => acts.reduce((m, a) => ((m[a.activity_date] ||= []).push(a), m), {}),
    [acts]
  );

  const cells = useMemo(() => {
    const y = Number(cursor.slice(0, 4));
    const m = Number(cursor.slice(5, 7)) - 1;
    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = 0
    const total = new Date(y, m + 1, 0).getDate();
    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: total }, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`),
    ];
  }, [cursor]);

  const go = (dir) => {
    const next = shiftDate("monthly", cursor, dir);
    setCursor(next);
    setSelected(next.slice(0, 7) === t.slice(0, 7) ? t : next);
  };
  const goToday = () => { setCursor(`${t.slice(0, 8)}01`); setSelected(t); };

  const dayList = byDate[selected] || [];
  const done = acts.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Kalender Aktivitas</h1>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !px-2" onClick={() => go(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
          <span className="min-w-36 text-center font-medium text-primary-dark">{periodLabel("monthly", cursor)}</span>
          <button className="btn-ghost !px-2" onClick={() => go(1)} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
          <button className="chip ml-1" onClick={goToday}>Bulan ini</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Aktivitas" value={loading ? "–" : acts.length} />
        <StatCard label="Hari aktif" value={loading ? "–" : Object.keys(byDate).length} />
        <StatCard label="Selesai" value={loading ? "–" : done} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_1fr]">
        <div className="card !p-3 sm:!p-5">
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-stone-400">
            {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const list = byDate[d] || [];
              const isSel = d === selected;
              return (
                <button
                  key={d}
                  onClick={() => setSelected(d)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${
                    isSel ? "bg-primary text-white" : list.length ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-sand"
                  } ${d === t && !isSel ? "ring-1 ring-primary-dark" : ""}`}
                >
                  <span className={d === t ? "font-bold" : ""}>{Number(d.slice(8))}</span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {list.slice(0, 3).map((a) => (
                      <i key={a.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white" : DOT[a.status] || DOT.in_progress}`} />
                    ))}
                    {list.length > 3 && (
                      <span className={`text-[9px] leading-none ${isSel ? "text-white" : "text-stone-500"}`}>+</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-primary-dark" /> Selesai</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" /> Berjalan</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-stone-300" /> Direncanakan</span>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1">
              <h2 className="font-semibold">{formatDate(selected)}</h2>
              <p className="text-sm text-stone-500">{dayList.length} aktivitas</p>
            </div>
            {dayList.length > 0 && (
              <CopyButton text={() => activitiesToText(dayList)} label="Salin semua" />
            )}
            <Link to={`/activities/new?date=${selected}`} className="btn"><Plus size={16} /> Tambah</Link>
          </div>

          {loading ? (
            <div className="skeleton h-24" />
          ) : dayList.length === 0 ? (
            <div className="card py-10 text-center text-stone-500">Tidak ada jurnal pada tanggal ini.</div>
          ) : (
            <div className="space-y-3">
              {dayList.map((a) => <ActivityCard key={a.id} activity={a} showDate={false} />)}
            </div>
          )}

          <Link to="/activities" className="inline-block text-sm text-primary-dark underline">
            Lihat semua riwayat dengan pencarian dan filter →
          </Link>
        </section>
      </div>
    </div>
  );
}