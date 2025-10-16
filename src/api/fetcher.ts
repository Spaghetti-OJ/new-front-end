import axios from "axios";

type TokenProvider = () => string | undefined | null;
type ServerErrorHandler = (error: unknown) => unknown;

let tokenProvider: TokenProvider | null = null;
let serverErrorHandler: ServerErrorHandler | null = null;

export const setTokenProvider = (provider: TokenProvider | null) => {
  tokenProvider = provider;
};

export const setServerErrorHandler = (handler: ServerErrorHandler | null) => {
  serverErrorHandler = handler;
};

export const fetcher = axios.create({
  baseURL: (import.meta.env.VITE_APP_API_BASE_URL as string) || "/api",
  withCredentials: true,
  timeout: 20000,
});

fetcher.interceptors.request.use((config) => {
  const token = tokenProvider?.();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
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
    if (error?.response?.status >= 500 && serverErrorHandler) {
      void serverErrorHandler(error);
    }
    return Promise.reject(error);
  },
);
