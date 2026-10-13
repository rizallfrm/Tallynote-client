const SHADES = ["bg-sand/70", "bg-primary/30", "bg-primary/60", "bg-primary"];
const level = (c) => (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : 3);

export default function Heatmap({ data, today }) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col gap-1">
              {w.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count} aktivitas`}
                  className={`h-3.5 w-3.5 rounded-[4px] ${
                    d.date > today ? "bg-transparent" : SHADES[level(d.count)]
                  } ${d.date === today ? "ring-1 ring-primary-dark" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-stone-400">
        Sedikit
        {SHADES.map((s) => <span key={s} className={`h-3 w-3 rounded-[3px] ${s}`} />)}
        Banyak
      </div>
    </div>
  );
}