import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Users } from "lucide-react";
import api from "../../api/axios";

export default function WorkspacesWidget() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get("/workspaces").then((r) => setList(r.data)).catch(() => setList([])); }, []);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><Users size={18} className="text-primary-700" /> Ruang kolaborasi</h2>
        <Link to="/together" className="text-sm text-primary-700 underline">Semua</Link>
      </div>
      {!list ? <div className="skeleton h-12" /> : list.length === 0 ? (
        <p className="text-sm text-stone-500">Belum ada ruang. <Link to="/together" className="text-primary-700 underline">Buat ruang</Link> atau buka link undangan dari temanmu.</p>
      ) : (
        <ul className="divide-y divide-sand">
          {list.slice(0, 4).map((w) => (
            <li key={w.id}>
              <Link to={`/together/${w.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.name}</span>
                <span className="flex items-center gap-1 text-xs text-stone-500"><ListChecks size={13} /> {w.my_open_tasks}</span>
                <span className="flex items-center gap-1 text-xs text-stone-500"><Users size={13} /> {w.member_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}