import { fetcher } from "./fetcher";

export const Auth = {
  signup:(body: { username: string; password: string; email: string; real_name:string;identity:string;student_id?:string;bio?:string})=>fetcher.post<UserSignup>("/auth/signup/",body).then((r: any) => r.data ?? r),
  login: (body: { username: string; password: string }) => fetcher.post<AuthToken>("/auth/session/", body).then(r => r.data ?? r),
  logout: () => fetcher.get<string>("/auth/session/"),
  //activeredirect:(body:{token:string})=>,
  active:(body:{profile:{displayedName:string;bio:string};agreement:boolean})=>fetcher.post<string>("/auth/active/").then(r => r.data ?? r),
  changePassword: (body: { old_password: string; new_password: string}) =>fetcher.post<string>("/auth/change-password/", body).then(r => r.data ?? r),
  checkEmail: (item:"username" | "email" ,  body: { email?: string;username?:string }) => fetcher.post<{ message: string; data: { valid: number } }>(`/auth/check/${item}/`, body),//<CheckEmail>
  resendemail: (body:{email:string})=> fetcher.post<string>("/auth/resend-email/", body),
  sendRecoveryEmail: (body: { email: string }) => fetcher.post<string>("/auth/password-recovery/", body).then(r => r.data ?? r),
  adduser:(body:{ username:string;password:string;email:string})=>fetcher.post<string>("/auth/user/",body).then(r => r.data ?? r),
  batchSignup: (body: { new_users: string; force?: boolean; course?: string }) =>fetcher.post<string>("/auth/batch-signup/", body).then(r => r.data ?? r),
  getSession: () => fetcher.get<UserProperties>("/auth/me").then(r => r.data ?? r),
  refresh: (body: { refresh: string }) =>fetcher.post<{refresh:string; access: string }>("/auth/refresh/", body).then((r: any) => r.data ?? r),
};

export const Copycat = {
  detect: (body: { course: string; problemId: number; studentNicknames: { [k: string]: string } }) =>
    fetcher.post("/copycat", body),
};
