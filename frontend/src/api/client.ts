import axios from "axios";
import i18next from "i18next";
import { useAuthStore } from "@/stores/authStore";
import { useExamStore } from "@/stores/examStore";
import { mockAdapter } from "@/api/mock/adapter";
import { toast } from "@/stores/toastStore";

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  ...(IS_DEMO ? { adapter: mockAdapter } : {}),
});

// Bypasses client's request/response interceptors — used only for token refresh
// to avoid attaching stale auth headers and prevent interceptor re-entry loops.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  ...(IS_DEMO ? { adapter: mockAdapter } : {}),
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const sessionToken = useExamStore.getState().sessionToken;
  if (sessionToken) {
    config.headers["X-Session-Token"] = sessionToken;
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status as number | undefined;
    const backendMessage = error.response?.data?.error as string | undefined;

    // 401 with active session: attempt token refresh
    if (status === 401 && useAuthStore.getState().accessToken && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await refreshClient.post("/auth/refresh", {
          refreshToken: localStorage.getItem("codexam_refresh"),
        });
        const { accessToken, refreshToken } = refreshRes.data;
        useAuthStore.getState().setToken(accessToken);
        localStorage.setItem("codexam_refresh", refreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Global error toast — skip 401 (login form handles inline, refresh handles session)
    // and skip requests that opt out via _skipErrorToast config flag
    if (status !== 401 && !originalRequest._skipErrorToast) {
      if (!error.response) {
        toast.error(i18next.t("errors.network"));
      } else if (status === 403) {
        toast.error(backendMessage || i18next.t("errors.forbidden"));
      } else if (status === 404) {
        toast.error(backendMessage || i18next.t("errors.notFound"));
      } else if (status === 422) {
        toast.error(backendMessage || i18next.t("errors.unprocessable"));
      } else if (status && status >= 500) {
        toast.error(i18next.t("errors.server"));
      } else {
        toast.error(backendMessage || i18next.t("errors.generic"));
      }
    }

    return Promise.reject(error);
  }
);

export default client;
