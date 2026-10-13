import { STATUS } from "../../utils/format";

const DOT = { planned: "bg-stone-400", in_progress: "bg-amber-500", completed: "bg-primary-600" };

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.in_progress;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <i className={`h-1.5 w-1.5 rounded-full ${DOT[status] || DOT.in_progress}`} />
      {s.label}
    </span>
  );
}