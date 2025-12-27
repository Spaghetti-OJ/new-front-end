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
    fetcher.get<UserStatsResponse>(`/stats/user/${userId}/`).then((r) => r.data),
  getSubmissionsActivity: (userId: string) =>
    fetcher
      .get<SubmissionActivityResponse>(`/auth/stats/submission-activity/${userId}/`)
      .then((r) => r.data ?? r),
};
export const Copycat = {
  detect: (body: { problem_id: number | string }) => fetcher.post("/copycat/", body),
  getCopycatReport: (problem_id: number) =>
    fetcher.get<CopycatResp>(`/copycat/?problem_id=${problem_id}`).then((r) => r.data ?? r),
};
