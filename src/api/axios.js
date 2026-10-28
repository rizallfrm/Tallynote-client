import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL || "https://tallynote-server-production-d76c.up.railway.app/api").replace(/\/$/, "");

// peringatan saat dev memanggil server production (penyebab CORS di kasus ini)
if (import.meta.env.DEV && !/localhost|127\.0\.0\.1/.test(baseURL)) {
  console.warn(
    `[API] Mode dev memakai server remote: ${baseURL}\n` +
    "Jika terkena CORS, pakai http://localhost:5000/api di client/.env.development " +
    "dan hapus VITE_API_URL dari .env.local"
  );
}

const api = axios.create({ baseURL, timeout: 12000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthCall = /\/auth\/(login|register|google|verify)/.test(err.config?.url || "");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;