import { Clock } from "lucide-react";
import { deadlineInfo, formatDeadline } from "../../utils/format";

export default function DeadlineBadge({ activity }) {
  const d = deadlineInfo(activity);
  if (!d) return null;
  return (
    <span title={formatDeadline(activity.deadline_at)}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${d.cls}`}>
      <Clock size={12} /> {d.label}
    </span>
  );
}