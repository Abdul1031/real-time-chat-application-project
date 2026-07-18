import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
