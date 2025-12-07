import axios from "axios";
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
  //activeredirect:(body:{token:string})=>,
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
  batchSignup: (body: { new_users: string; force?: boolean; course?: string }) =>
    fetcher.post<string>("/auth/batch-signup/", body).then((r) => r.data ?? r),
  getSession: () => fetcher.get<UserProperties>("/auth/me/").then((r) => r.data ?? r),
  refresh: (body: { refresh: string }) =>
    fetcher.post<{ access: string; refresh?: string }>("/auth/refresh/", body).then((r) => r.data ?? r),
  verify: (body: { token: string }) => fetcher.post("/auth/verify/", body).then((r) => r.data ?? r),
  generatetoken: (body: { name: string; permissions?: string[]; expires_at?: string }) =>{
    const csrfToken = document.cookie .split('; ')
  .find(row => row.startsWith('csrftoken='))
  ?.split('=')[1];
  console.log("cstoken====",csrfToken);
  console.log("body===",body);
  return axios.post(
      // 注意這裡要加上後端的 baseURL
      `${import.meta.env.VITE_APP_API_BASE_URL || "/api"}/api-tokens/`,
      body,
      {
        withCredentials: true, // 要讓 sessionid / csrftoken cookie 一起送出去
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
          // 不給 Authorization，這樣後端就會走「Session + CSRF」那套，而不是 API Token 驗證
        },
      },
    ).then((r) => r.data ?? r);
  },
  listtokens: () => fetcher.get("/api-tokens/").then((r) => r.data ?? r),
  deletetokens: (tokenid:string) => fetcher.delete(`/api-tokens/${tokenid}/`).then((r) => r.data ?? r),
  getProfile: () => fetcher.get<UserProperties>("/profile/").then((r) => r.data ?? r),
};

export const Copycat = {
  detect: (body: { course: string; problemId: number; studentNicknames: { [k: string]: string } }) =>
    fetcher.post("/copycat", body),
};
