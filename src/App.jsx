import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ActivityList from "./pages/ActivityList";
import ActivityCreate from "./pages/ActivityCreate";
import ActivityDetail from "./pages/ActivityDetail";
import Recap from "./pages/Recap";
import Settings from "./pages/Settings";
import AdminCategories from "./pages/AdminCategories";
import CalendarPage from "./pages/CalendarPage";
import Targets from "./pages/Targets";
import Templates from "./pages/Template";
import AskPage from "./pages/AskPage";
import VerifyEmail from "./pages/VerifyEmail";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import JoinWorkspace from "./pages/JoinWorkspace";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/register" element={<Register />} />

      <Route path="/join/:token" element={<JoinWorkspace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/activities" element={<ActivityList />} />
          <Route path="/activities/new" element={<ActivityCreate />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/recap" element={<Recap />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/together" element={<Workspaces />} />
          <Route path="/together/:wid" element={<WorkspaceDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
