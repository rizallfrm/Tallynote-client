import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import api from "../../api/axios";
import DeadlineBadge from "./DeadlineBadge";

export default function UpcomingDeadlines() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api.get("/activities/upcoming").then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  if (items && items.length === 0) return null;

  return (
    <div className="card space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <CalendarClock size={18} className="text-primary-700" /> Deadline terdekat
      </h2>
      {!items ? <div className="skeleton h-12" /> : (
        <ul className="divide-y divide-sand">
          {items.map((a) => (
            <li key={a.id}>
              <Link to={`/activities/${a.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <span className="flex-1 truncate text-sm font-medium">{a.title}</span>
                <DeadlineBadge activity={a} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}