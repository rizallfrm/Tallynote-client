import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ListChecks, MessageSquare, Users, Video } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ScrollTabs from "../components/common/ScrollTabs";
import useSwipeTabs from "../hooks/useSwipeTabs";
import ForumTab from "../components/together/ForumTab";
import TasksTab from "../components/together/TasksTab";
import CalendarTab from "../components/together/CalendarTab";
import MeetingsTab from "../components/together/MeetingsTab";
import MembersTab from "../components/together/MembersTab";
import { ROLE, isAdminRole } from "../utils/together";
import { errMsg } from "../utils/format";

const TABS = [
  ["forum", "Forum", MessageSquare],
  ["tasks", "Tugas", ListChecks],
  ["calendar", "Kalender", CalendarDays],
  ["meetings", "Meeting", Video],
  ["members", "Anggota", Users],
];
const KEYS = TABS.map(([k]) => k);

export default function WorkspaceDetail() {
  const { wid } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [ws, setWs] = useState(null);
  const [members, setMembers] = useState([]);

  const tab = KEYS.includes(sp.get("tab")) ? sp.get("tab") : "forum";
  const setTab = (k) => setSp({ tab: k }, { replace: true });
  const swipe = useSwipeTabs(KEYS, tab, setTab);

  const loadMembers = useCallback(
    () => api.get(`/workspaces/${wid}/members`).then((r) => setMembers(r.data)).catch(() => {}),
    [wid]
  );
  const loadWs = useCallback(
    () => api.get(`/workspaces/${wid}`).then((r) => setWs(r.data)),
    [wid]
  );

  useEffect(() => {
    loadWs().catch((e) => { toast.error(errMsg(e)); nav("/together", { replace: true }); });
    loadMembers();
  }, [loadWs, loadMembers, toast, nav]);

  if (!ws)
    return (
      <div className="space-y-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-64" />
      </div>
    );

  const admin = isAdminRole(ws.role);
  const shared = { wid, me: user, isAdmin: admin, members };

  return (
    <div className="space-y-4">
      <Link to="/together" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft size={16} /> Semua ruang
      </Link>

      <div className="card">
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="page-title flex-1 break-words">{ws.name}</h1>
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
            {ROLE[ws.role]}
          </span>
        </div>
        {ws.description && <p className="mt-1 text-sm text-stone-600">{ws.description}</p>}
        <p className="mt-2 text-xs text-stone-400">{ws.member_count} anggota</p>
      </div>

      {/* satu-satunya bar tab */}
      <div className="sticky top-[53px] z-10 -mx-4 bg-cream/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0">
        <ScrollTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {/* satu-satunya area isi: hanya SATU tab yang dirender */}
      <div {...swipe} key={tab} className="animate-fade-up touch-pan-y">
        {tab === "forum" && <ForumTab {...shared} />}
        {tab === "tasks" && <TasksTab {...shared} />}
        {tab === "calendar" && <CalendarTab {...shared} />}
        {tab === "meetings" && <MeetingsTab {...shared} />}
        {tab === "members" && (
          <MembersTab {...shared} ws={ws} reloadMembers={loadMembers} reloadWs={loadWs} />
        )}
      </div>
    </div>
  );
}