import { METRICS, STATUS, formatDate, periodLabel } from "../../utils/format";
import Logo, { APP_NAME } from "../common/Logo";

const TITLE = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" };
const cell = "border border-stone-400 px-2 py-1 align-top";

export default function PrintReport({
  user,
  range,
  recap,
  aiText,
  targets = [],
}) {
  if (!recap) return null;

  const acts = recap.activities;
  const done = acts.filter((a) => a.status === "completed").length;
  const days = new Set(acts.map((a) => a.activity_date)).size;
  const reflections = acts.filter((a) => a.learning || a.obstacle).length;
  const rate = acts.length ? Math.round((done / acts.length) * 100) : 0;

  const grouped = acts.reduce(
    (m, a) => ((m[a.activity_date] ||= []).push(a), m),
    {},
  );
  let n = 0;

  return (
    <div className="hidden text-[10.5pt] leading-relaxed text-black print:block">
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2">
        <h1 className="text-xl font-bold">
          Laporan Jurnal Aktivitas {TITLE[range]}
        </h1>
        <Logo className="h-10" />
      </div>

      <table className="mt-3 w-full">
        <tbody>
          <tr>
            <td className="w-28 py-0.5 font-medium">Nama</td>
            <td>: {user.name}</td>
          </tr>
          <tr>
            <td className="py-0.5 font-medium">Periode</td>
            <td>: {periodLabel(range, recap.start, recap.end)}</td>
          </tr>
          <tr>
            <td className="py-0.5 font-medium">Dicetak</td>
            <td>: {new Date().toLocaleString("id-ID")}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mb-1 mt-4 font-bold">Ringkasan</h2>
      <table className="w-full text-center">
        <thead>
          <tr className="bg-stone-100">
            {[
              "Total aktivitas",
              "Selesai",
              "Tingkat selesai",
              "Hari aktif",
              "Dengan refleksi",
            ].map((h) => (
              <th key={h} className={`${cell} font-semibold`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[acts.length, done, `${rate}%`, days, reflections].map((v, i) => (
              <td key={i} className={`${cell} text-base font-semibold`}>
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {targets.length > 0 && (
        <>
          <h2 className="mb-1 mt-4 font-bold">Target Mingguan</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 text-left">
                {["Target", "Jenis", "Capaian", "Status"].map((h) => (
                  <th key={h} className={`${cell} font-semibold`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id}>
                  <td className={cell}>
                    {t.title}
                    {t.Category ? ` (${t.Category.name})` : ""}
                  </td>
                  <td className={cell}>{METRICS[t.metric]?.label}</td>
                  <td className={cell}>
                    {t.current}/{t.target_value} ({t.percent}%)
                  </td>
                  <td className={cell}>
                    {t.achieved ? "Tercapai" : "Belum tercapai"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {aiText && (
        <>
          <h2 className="mb-1 mt-4 font-bold">Ringkasan AI</h2>
          <p className="whitespace-pre-line border border-stone-400 p-2">
            {aiText}
          </p>
        </>
      )}

      <h2 className="mb-2 mt-5 border-b border-stone-400 pb-1 font-bold">
        Rincian Aktivitas
      </h2>
      {acts.length === 0 && <p>Tidak ada aktivitas pada periode ini.</p>}

      {Object.entries(grouped).map(([d, list]) => (
        <div key={d} className="mb-3">
          <h3 className="mb-1 break-after-avoid font-semibold">
            {formatDate(d)}
          </h3>
          {list.map((a) => (
            <div
              key={a.id}
              className="mb-2 break-inside-avoid border border-stone-400"
            >
              <div className="flex justify-between gap-3 bg-stone-100 px-2 py-1 font-semibold">
                <span>
                  {++n}. {a.title}
                </span>
                <span className="whitespace-nowrap text-[9pt] font-normal">
                  {a.Category?.name || "-"} · {STATUS[a.status]?.label}
                </span>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    ["Uraian", a.description || a.activity_input],
                    ["Pembelajaran", a.learning],
                    ["Kendala", a.obstacle],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className={`${cell} w-28 font-medium`}>{k}</td>
                      <td className={`${cell} whitespace-pre-line`}>
                        {v || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}

      <p className="mt-6 flex items-center gap-2 border-t border-stone-400 pt-1 text-[9pt] text-stone-500">
        <Logo variant="icon" className="h-4" /> {APP_NAME}
      </p>
    </div>
  );
}
