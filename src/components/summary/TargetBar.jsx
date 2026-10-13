import { METRICS } from "../../utils/format";

export default function TargetBar({ t }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{t.title}</span>
        <span className="whitespace-nowrap text-stone-500">
          {t.current}/{t.target_value} {METRICS[t.metric]?.unit}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand">
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.achieved ? "bg-primary-dark" : "bg-primary"}`}
          style={{ width: `${t.percent}%` }}
        />
      </div>
    </div>
  );
}