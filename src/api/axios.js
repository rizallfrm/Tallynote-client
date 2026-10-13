import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://tallynote-server-production-d76c.up.railway.app/api",
  timeout: 12000,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthCall = /\/auth\/(login|register|google)/.test(
      err.config?.url || "",
    );
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
