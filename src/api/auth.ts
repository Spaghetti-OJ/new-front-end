import { fetcher } from "./fetcher";

export const Auth = {
  signup: (body: {
    username: string;
    password: string;
    email: string;
    real_name: string;
    role: string;
    student_id?: string;
    bio?: string;
  }) => fetcher.post<UserSignup>("/auth/signup/", body).then((r) => r.data ?? r),
  login: (body: { username: string; password: string }) =>
    fetcher.post<AuthToken>("/auth/session/", body).then((r) => r.data ?? r),
  logout: (body: { refresh: string }) =>
    fetcher.post<string>("/auth/session/revoke/", body).then((r) => r.data ?? r),
  changePassword: (body: { old_password: string; new_password: string }) =>
    fetcher.post("/auth/change-password/", body).then((r) => r.data ?? r),
  forgotPassword: (body: { username: string; email: string }) => fetcher.post(`/auth/forgot-password/`, body),
  resetPassword: (body: { token: string; new_password: string }) =>
    fetcher.post("/auth/reset-password/", body),
  getSession: () => fetcher.get<UserProperties>("/auth/me/").then((r) => r.data ?? r),
  sendVerifyEmail: () => fetcher.post("/auth/send-email/", {}).then((r) => r.data ?? r),
  refresh: (body: { refresh: string }) =>
    fetcher.post<{ access: string; refresh?: string }>("/auth/refresh/", body).then((r) => r.data ?? r),
  verify: (body: { token: string }) => fetcher.post("/auth/verify/", body).then((r) => r.data ?? r),
  verifyEmail: (body: { token: string }) =>
    fetcher.post("/auth/verify-email/", body).then((r) => r.data ?? r),
  generateToken: (body: { name: string; permissions?: string[]; expires_at?: string }) =>
    fetcher.post<{ full_token: string }>(`/api-tokens/`, body).then((r) => r.data ?? r),

  listTokens: () => fetcher.get<apikeyresponse[]>("/api-tokens/").then((r) => r.data ?? r),
  deleteToken: (tokenId: string) => fetcher.delete(`/api-tokens/${tokenId}`).then((r) => r.data ?? r),
  getProfile: () => fetcher.get<UserProperties>("/profile/").then((r) => r.data ?? r),
  updateProfile: (body: Partial<UserProperties> | FormData) =>
    fetcher.post<UserProperties>("/profile/", body).then((r) => r.data ?? r),
  getPublicProfile: (username: string) =>
    fetcher.get<PublicUserProfile>(`/profile/${username}/`).then((r) => r.data ?? r),
  getUserStats: (userId: string) =>
    fetcher.get<UserStatsResponse>(`/stats/user/${userId}/`).then((r) => {
      const envelope = normalizeEnvelope(r);
      const data = extractUserStatsData(envelope.data) ??
        extractUserStatsData(r) ?? { user_stats: {} as UserStats };
      return {
        data,
        message: toStringOrEmpty(envelope.message),
        status: toStringOrEmpty(envelope.status),
      };
    }),
  getSubmissionsActivity: (userId: string) =>
    fetcher.get<SubmissionActivityResponse>(`/auth/stats/submission-activity/${userId}/`).then((r) => {
      const envelope = normalizeEnvelope(r);
      const data = extractSubmissionActivityData(envelope.data) ?? extractSubmissionActivityData(r) ?? {};
      return {
        data,
        message: toStringOrEmpty(envelope.message),
        status: toStringOrEmpty(envelope.status),
      };
    }),
};

type EnvelopeShape = {
  data?: unknown;
  message?: unknown;
  status?: unknown;
};

const normalizeEnvelope = (value: unknown): EnvelopeShape => (isRecord(value) ? value : {});

const toStringOrEmpty = (value: unknown): string => (typeof value === "string" ? value : "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractUserStatsData = (value: unknown): UserStatsResponse["data"] | null => {
  if (!isRecord(value)) return null;
  if ("user_stats" in value) return value as UserStatsResponse["data"];
  if ("data" in value) {
    const inner = (value as { data?: unknown }).data;
    if (isRecord(inner) && "user_stats" in inner) {
      return inner as UserStatsResponse["data"];
    }
  }
  return null;
};

const extractSubmissionActivityData = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0) return {};
  if (entries.every(([, count]) => typeof count === "number")) {
    return value as Record<string, number>;
  }
  if ("data" in value) {
    const inner = (value as { data?: unknown }).data;
    if (isRecord(inner)) {
      const innerEntries = Object.entries(inner);
      if (innerEntries.every(([, count]) => typeof count === "number")) {
        return inner as Record<string, number>;
      }
    }
  }
  return null;
};
export const Copycat = {
  detect: (body: { problem_id: number | string }) => fetcher.post("/copycat/", body),
  getCopycatReport: (problem_id: number) =>
    fetcher.get<CopycatResp>(`/copycat/?problem_id=${problem_id}`).then((r) => r.data ?? r),
};
