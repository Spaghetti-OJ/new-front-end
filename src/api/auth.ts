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
  active: (body: { profile: { displayedName: string; bio: string }; agreement: boolean }) =>
    fetcher.post<string>("/auth/active/", body).then((r) => r.data ?? r),
  changePassword: (body: { old_password: string; new_password: string }) =>
    fetcher.post<string>("/auth/change-password/", body).then((r) => r.data ?? r),
  checkEmail: (item: "username" | "email", body: { email?: string; username?: string }) =>
    fetcher.post<{ message: string; data: { valid: number } }>(`/auth/check/${item}/`, body), //<CheckEmail>
  resendemail: (body: { email: string }) => fetcher.post<string>("/auth/resend-email/", body),
  sendRecoveryEmail: (body: { email: string }) =>
    fetcher.post<string>("/auth/password-recovery/", body).then((r) => r.data ?? r),
  adduser: (body: { username: string; password: string; email: string }) =>
    fetcher.post<string>("/auth/user/", body).then((r) => r.data ?? r),
  getSession: () => fetcher.get<UserProperties>("/auth/me/").then((r) => r.data ?? r),
  sendVerifyEmail: () => fetcher.post("/auth/send-email/", {}).then((r) => r.data ?? r),
  refresh: (body: { refresh: string }) =>
    fetcher.post<{ access: string; refresh?: string }>("/auth/refresh/", body).then((r) => r.data ?? r),
  verify: (body: { token: string }) => fetcher.post("/auth/verify/", body).then((r) => r.data ?? r),
  verifyEmail: (body: { token: string }) =>
    fetcher.post("/auth/verify-email/", body).then((r) => r.data ?? r),
  generatetoken: (body: { name: string; permissions?: string[]; expires_at?: string }) =>
    fetcher.post<{ full_token: string }>(`/api-tokens/`, body).then((r) => r.data ?? r),

  listtokens: () => fetcher.get<apikeyresponse[]>("/api-tokens/").then((r) => r.data ?? r),
  deleteTokens: (tokenId: string) => fetcher.delete(`/api-tokens/${tokenId}`).then((r) => r.data ?? r),
  getProfile: () => fetcher.get<UserProperties>("/profile/").then((r) => r.data ?? r),
};
export const Copycat = {
  detect: (body: { problem_id: number | string }) => fetcher.post("/copycat/", body),
  getCopycatReport: (problem_id: number) => fetcher.get(`/copycat/?problem_id=${problem_id}`),
};
