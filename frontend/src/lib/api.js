import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });

export const getToken = () => localStorage.getItem("virana_token");
export const setTokens = (access, refreshTok) => {
  if (access) localStorage.setItem("virana_token", access);
  if (refreshTok) localStorage.setItem("virana_refresh", refreshTok);
};
export const clearTokens = () => {
  localStorage.removeItem("virana_token");
  localStorage.removeItem("virana_refresh");
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && localStorage.getItem("virana_refresh")) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${API}/auth/refresh`, { refresh_token: localStorage.getItem("virana_refresh") });
        const { data } = await refreshing;
        refreshing = null;
        setTokens(data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => (d && typeof d.msg === "string" ? d.msg : JSON.stringify(d))).join(" ");
  if (typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// Heritage
export const fetchHeritage = (params = {}) => api.get("/heritage", { params }).then(r => r.data);
export const fetchHeritageById = (id) => api.get(`/heritage/${id}`).then(r => r.data);
export const searchHeritage = (q) => api.get("/heritage/search", { params: { q } }).then(r => r.data);
export const fetchStates = () => api.get("/states").then(r => r.data.states);
export const fetchStats = () => api.get("/stats").then(r => r.data);
export const askAI = (message, session_id) => api.post("/ai/ask", { message, session_id }).then(r => r.data);
export const analyzeImage = (image_base64, mime_type = "image/jpeg") =>
  api.post("/heritage-lens/analyze", { image_base64, mime_type }).then(r => r.data);

// Auth
export const authRegister = (payload) => api.post("/auth/register", payload).then(r => r.data);
export const authLogin = (payload) => api.post("/auth/login", payload).then(r => r.data);
export const authLogout = () => api.post("/auth/logout").then(r => r.data);
export const authMe = () => api.get("/auth/me").then(r => r.data);
export const authVerifyEmail = (token) => api.post("/auth/verify-email", { token }).then(r => r.data);
export const authResendVerification = () => api.post("/auth/resend-verification").then(r => r.data);
export const authForgotPassword = (email) => api.post("/auth/forgot-password", { email }).then(r => r.data);
export const authResetPassword = (token, new_password) => api.post("/auth/reset-password", { token, new_password }).then(r => r.data);

// User
export const fetchMe = () => api.get("/users/me").then(r => r.data);
export const updateMe = (payload) => api.put("/users/me", payload).then(r => r.data);
export const deleteMe = (password) => api.delete("/users/me", { data: { password } }).then(r => r.data);
export const changePassword = (current_password, new_password) => api.put("/users/me/password", { current_password, new_password }).then(r => r.data);
export const fetchSessions = () => api.get("/users/me/sessions").then(r => r.data);
export const clearSessions = () => api.post("/users/me/sessions/clear").then(r => r.data);
export const fetchSettings = () => api.get("/users/me/settings").then(r => r.data);
export const updateSettings = (payload) => api.put("/users/me/settings", payload).then(r => r.data);
export const updateNotifications = (payload) => api.put("/users/me/notifications", payload).then(r => r.data);
export const updatePrivacy = (payload) => api.put("/users/me/privacy", payload).then(r => r.data);
export const fetchSaved = (item_type) => api.get("/users/me/saved", { params: item_type ? { item_type } : {} }).then(r => r.data);
export const toggleSave = (item_type, item_id) => api.post("/users/me/saved", { item_type, item_id }).then(r => r.data);
export const checkSaved = (item_type, item_id) => api.get("/users/me/saved/check", { params: { item_type, item_id } }).then(r => r.data);
export const trackView = (item_type, item_id) => api.post("/users/me/track-view", { item_type, item_id }).then(r => r.data);
export const fetchActivity = () => api.get("/users/me/activity").then(r => r.data);
export const fetchRecentlyExplored = () => api.get("/users/me/recently-explored").then(r => r.data);
export const fetchCollections = () => api.get("/users/me/collections").then(r => r.data);
export const createCollection = (name, description) => api.post("/users/me/collections", { name, description }).then(r => r.data);
export const deleteCollection = (id) => api.delete(`/users/me/collections/${id}`).then(r => r.data);
export const addToCollection = (id, item_type, item_id) => api.post(`/users/me/collections/${id}/items`, { item_type, item_id }).then(r => r.data);
export const fetchContributions = () => api.get("/users/me/contributions").then(r => r.data);
export const fetchReminders = () => api.get("/users/me/reminders").then(r => r.data);
export const fetchNotifications = () => api.get("/users/me/notifications").then(r => r.data);
export const exportMyData = () => api.get("/users/me/export").then(r => r.data);

// Festivals
export const fetchFestivals = (params = {}) => api.get("/festivals", { params }).then(r => r.data);
export const fetchUpcomingFestivals = (limit = 6) => api.get("/festivals/upcoming", { params: { limit } }).then(r => r.data);
export const fetchFestivalById = (id) => api.get(`/festivals/${id}`).then(r => r.data);
export const toggleReminder = (id) => api.post(`/festivals/${id}/remind`).then(r => r.data);
export const reminderStatus = (id) => api.get(`/festivals/${id}/reminder-status`).then(r => r.data);

// Map (geospatial)
export const fetchMapMeta = () => api.get("/map/meta").then(r => r.data);
export const fetchMapRecords = (params = {}) => api.get("/map/records", { params }).then(r => r.data);
export const fetchRegionStats = () => api.get("/map/regions").then(r => r.data.regions);
export const fetchRegionProfile = (state) => api.get(`/map/regions/${encodeURIComponent(state)}`).then(r => r.data);
export const mapSearch = (q) => api.get("/map/search", { params: { q } }).then(r => r.data);
export const mapNearby = (lat, lng, radius = 25000) => api.get("/map/nearby", { params: { lat, lng, radius } }).then(r => r.data);
export const mapTrack = (ref_type, ref_id, event = "location_opened") => api.post("/map/track", { ref_type, ref_id, event }).then(r => r.data).catch(() => {});
export const mapRecordStats = (ref_type, ref_id) => api.get(`/map/record/${ref_type}/${ref_id}/stats`).then(r => r.data);
export const mapAiSearch = (query) => api.post("/map/ai-search", { query }).then(r => r.data);
export const mapAiRegion = (payload) => api.post("/map/ai-region", payload).then(r => r.data);
