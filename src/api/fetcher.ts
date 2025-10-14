import axios from "axios";
import { useGlobal } from "@/stores/global";
import { useSession } from "@/stores/session";

export const fetcher = axios.create({
  baseURL: (import.meta.env.VITE_APP_API_BASE_URL as string) || "/api",
  withCredentials: true,
  timeout: 20000,
});

fetcher.interceptors.request.use((config) => {
  const session = useSession();
  if (session.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  const lang = localStorage.getItem("lang");
  if (lang) {
    config.headers = config.headers ?? {};
    config.headers["Accept-Language"] = lang;
  }

  return config;
});

fetcher.interceptors.response.use(
  (response) => ({
    ...response,
    ...response.data,
  }),
  (error) => {
    const global = useGlobal();
    if (error?.response?.status >= 500) {
      global.onServerError?.();
    }
    return Promise.reject(error);
  },
);
