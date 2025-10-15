import { fetcher } from "./fetcher";

export const Auth = {
  getSession: () => fetcher.get<UserProperties>("/auth/me"),
  login: (body: { username: string; password: string }) => fetcher.post("/auth/session", body),
  logout: () => fetcher.get("/auth/session"),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    fetcher.post("/auth/change-password", body),
  batchSignup: (body: { newUsers: string; force: boolean; course: string }) =>
    fetcher.post("/auth/batch-signup", body),
  checkEmail: (body: { email: string }) => fetcher.post<CheckEmail>("/auth/check/email", body),
  sendRecoveryEmail: (body: { email: string }) => fetcher.post("/auth/password-recovery", body),
};

export const Copycat = {
  detect: (body: { course: string; problemId: number; studentNicknames: { [k: string]: string } }) =>
    fetcher.post("/copycat", body),
};
