import { defineStore } from "pinia";
import api from "@/api";
import { setTokenProvider, setRefreshProvider } from "@/api/fetcher";

export enum SessionState {
  NotValidated = -1,
  IsNotLogin = 0,
  IsLogin = 1,
}

export enum UserRole {
  Guest = "Guest",
  Admin = "Admin",
  Teacher = "Teacher",
  Student = "Student",
}

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const useSession = defineStore("session", {
  state: () => ({
    state: SessionState.NotValidated,
    username: "",
    displayedName: "",
    role: UserRole.Guest,
    bio: "",
    email: "",
    token: localStorage.getItem(ACCESS_KEY) || "",
    refreshtoken: localStorage.getItem(REFRESH_KEY) || "",
  }),
  getters: {
    isAdmin(state) {
      return state.role === UserRole.Admin;
    },
    isNotValidated(state) {
      return state.state === SessionState.NotValidated;
    },
    isNotLogin(state) {
      return state.state === SessionState.IsNotLogin;
    },
    isLogin(state) {
      return state.state === SessionState.IsLogin;
    },
  },
  actions: {
    async validateSession() {
      this.state = SessionState.NotValidated;
      // Only skip validation if there is truly no token in both the store and localStorage
      const storedToken = this.token || localStorage.getItem(ACCESS_KEY);
      if (!storedToken) {
        this.state = SessionState.IsNotLogin;
        return;
      }
      // Ensure this.token is set from localStorage if needed
      if (!this.token && storedToken) {
        this.token = storedToken;
      }
      try {
        const me = await api.Auth.getSession();
        const { user_name, real_name, introduction, role, email } = me;
        this.username = user_name;
        this.displayedName = real_name;
        this.bio = introduction;
        this.role = role as UserRole;
        this.email = email;
        this.state = SessionState.IsLogin;
      } catch (error) {
        this.logoutLocally();
      }
      
    },
    async verifyAccessToken(): Promise<boolean> {
      if (!this.token) return false;
      try {
        console.log("[Verify Access Token] 開始驗證 access token...");
        await api.Auth.verify({ token: this.token });
        return true; 
      } catch {
        return false;
      }
    },
    async setTokens(access: string, refresh: string) {
      this.token = access;
      this.refreshtoken = refresh;
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
      await this.validateSession();
    },
    logoutLocally() {
      this.$reset();
      this.state = SessionState.IsNotLogin;
      this.token = "";
      this.refreshtoken = "";
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    },
  },
});

// To avoid circular dependency, export a function to set the token provider after store initialization.
export function initSessionTokenProvider(sessionStore: ReturnType<typeof useSession>) {
  setTokenProvider(() => {
    return sessionStore.token || null;
  });

  setRefreshProvider(async () => {
    if (!sessionStore.refreshtoken) {
      console.log("[Refresh Token] 沒有 refresh token，無法刷新");
      return null;
    }
    try {
      console.log("[Refresh Token] 開始刷新 access token...");
      const response = await api.Auth.refresh({ refresh: sessionStore.refreshtoken });
      const { access, refresh: newRefresh } = response;
      
      // 更新 access token
      sessionStore.token = access;
      localStorage.setItem(ACCESS_KEY, access);
      
      // 如果後端回傳新的 refresh token（啟用 ROTATE_REFRESH_TOKENS），也要更新
      if (newRefresh) {
        console.log("[Refresh Token] ✅ 刷新成功！已更新 access token 和新的 refresh token");
        sessionStore.refreshtoken = newRefresh;
        localStorage.setItem(REFRESH_KEY, newRefresh);
      } else {
        console.log("[Refresh Token] ✅ 刷新成功！已更新 access token（未啟用 ROTATE_REFRESH_TOKENS）");
      }
      
      return access;
    } catch (error) {
      console.error("[Refresh Token] ❌ 刷新失敗：", error);
      sessionStore.logoutLocally();
      return null;
    }
  });
}
