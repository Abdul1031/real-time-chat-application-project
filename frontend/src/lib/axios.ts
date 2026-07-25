import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// primary auth path in production: the frontend (Vercel) and backend (Render)
// are different domains, and browsers increasingly block cross-site cookies
// (Chrome Incognito, Safari, Firefox) — so the JWT cookie alone isn't reliable.
// A Bearer token stored client-side sidesteps that entirely.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);
