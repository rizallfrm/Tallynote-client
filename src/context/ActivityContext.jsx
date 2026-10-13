import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const ActivityContext = createContext(null);
export const useActivity = () => useContext(ActivityContext);

export function ActivityProvider({ children }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [recap, setRecap] = useState(null);
  const [stats, setStats] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const withAi = async (fn) => {
    setAiLoading(true);
    try { return await fn(); } finally { setAiLoading(false); }
  };

  const fetchCategories = useCallback(async () => {
    const { data } = await api.get("/categories");
    setCategories(data);
  }, []);

  useEffect(() => {
    if (user) fetchCategories().catch(() => {});
    else { setActivities([]); setRecap(null); setStats(null); setCategories([]); }
  }, [user, fetchCategories]);

  const fetchActivities = useCallback(async (params = {}) => {
    const { data } = await api.get("/activities", { params });
    setActivities(data.items);
    setPagination({ total: data.total, page: data.page, pages: data.pages });
    return data;
  }, []);

  const getActivity = useCallback(async (id) => (await api.get(`/activities/${id}`)).data, []);
  const previewActivity = (activity_input) =>
    withAi(async () => (await api.post("/activities/preview", { activity_input })).data);
  const createActivity = (payload) => withAi(async () => (await api.post("/activities", payload)).data);
  const updateActivity = async (id, payload) => (await api.put(`/activities/${id}`, payload)).data;
  const removeActivity = async (id) => { await api.delete(`/activities/${id}`); };
  const regenerateActivity = (id) =>
    withAi(async () => (await api.post(`/activities/${id}/regenerate`)).data);

  const fetchRecap = useCallback(async (range, date) => {
    const { data } = await api.get("/summaries", { params: { range, date } });
    setRecap(data);
    return data;
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await api.get("/summaries/stats");
    setStats(data);
    return data;
  }, []);

  const generateAiSummary = (date, range) =>
    withAi(async () => (await api.post("/summaries/ai", { date, range })).data.ai_summary);

  return (
    <ActivityContext.Provider
      value={{
        activities, pagination, categories, recap, stats, aiLoading,
        fetchCategories, fetchActivities, getActivity, previewActivity, createActivity,
        updateActivity, removeActivity, regenerateActivity, fetchRecap, fetchStats,
        generateAiSummary,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}