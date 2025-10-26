import { fetcher } from "./fetcher";

export const Auth = {
  signup:(body:{username:string;password:string;email:string;real_name:string;identity:string;student_id:string;bio:string})=>fetcher.post<{id:string;username:string;email:string;real_name:string;identity:string;date_joined:string;last_login:string}>("/auth/signup/",body).then((r: any) => r.data ?? r),
  getSession: () => fetcher.get<User>("/auth/me/").then(r => r.data ?? r),
  login: (body: { username: string; password: string }) => fetcher.post<AuthToken>("/auth/session/", body).then(r => r.data ?? r),
  logout: () => fetcher.get("/auth/session/"),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    fetcher.post("/auth/change-password", body),
  batchSignup: (body: { newUsers: string; force: boolean; course: string }) =>
      fetcher.post("/auth/batch-signup", body),
    checkEmail: (body: { email: string }) => fetcher.post<CheckEmail>("/auth/check/email", body),
  sendRecoveryEmail: (body: { email: string }) => fetcher.post("/auth/password-recovery", body),
  refresh: (body: { refresh: string }) =>
    fetcher.post<{ access: string }>("/auth/refresh/", body).then((r: any) => r.data ?? r),
};

export const Copycat = {
  detect: (body: { course: string; problemId: number; studentNicknames: { [k: string]: string } }) =>
    fetcher.post("/copycat", body),
};
