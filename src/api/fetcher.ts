import axios, { AxiosError, AxiosRequestConfig } from "axios";

type TokenProvider = () => string | undefined | null;
type RefreshProvider = () => Promise<string | null>;
type ServerErrorHandler = (error: unknown) => unknown;

let tokenProvider: TokenProvider | null = null;
let refreshProvider: RefreshProvider | null = null;
let serverErrorHandler: ServerErrorHandler | null = null;
function shouldRefreshToken(error: AxiosError) {
  const status = error.response?.status;
  if (!status) return false;

  if (status === 401) return true;

  if (status === 403) {
    const data = error.response?.data;
    const code = String(data?.code ?? "");
    return code === "token_not_valid";
  }

  return false;
}
export const setTokenProvider = (provider: TokenProvider | null) => {
  tokenProvider = provider;
};
export const setRefreshProvider = (provider: RefreshProvider | null) => {
  refreshProvider = provider;
};

export const setServerErrorHandler = (handler: ServerErrorHandler | null) => {
  serverErrorHandler = handler;
};

export const fetcher = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL || "/api",
  withCredentials: false,
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
let isRefreshing = false;
let waitingQueue: Array<(token: string) => void> = [];

function publishNewToken(newToken: string) {
  waitingQueue.forEach((resolve) => resolve(newToken));
  waitingQueue = [];
}

fetcher.interceptors.response.use(
  (response) => ({
    ...response,
    ...response.data,
  }),
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error?.response?.status && error?.response?.status >= 500 && serverErrorHandler) {
      void serverErrorHandler(error);
    }
    if (!shouldRefreshToken(error) || original?._retry) {
      return Promise.reject(error);
    }
    if (!refreshProvider) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (isRefreshing) {
        const newToken = await new Promise<string>((resolve) => waitingQueue.push(resolve));
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return fetcher(original);
      }
      isRefreshing = true;
      const newAccess = await refreshProvider();

      if (!newAccess) {
        waitingQueue = [];
        return Promise.reject(error);
      }

      publishNewToken(newAccess);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return fetcher(original);
    } catch (e) {
      waitingQueue = [];
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
