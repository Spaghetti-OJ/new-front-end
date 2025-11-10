import { defineStore } from "pinia";
import api from "@/api";
import { setTokenProvider,setRefreshProvider } from "@/api/fetcher";

export enum SessionState {
  NotValidated = -1,
  IsNotLogin = 0,
  IsLogin = 1,
}

export enum UserRole {
  Guest = -1,
  Admin = 0,
  Teacher = 1,
  Student = 2,
}

export const useSession = defineStore("session", {
  state: () => ({
      
    state: SessionState.NotValidated,    
    username: "",  
    displayedName: "", 
    role: UserRole.Guest,
    bio: "",
    email: "",
    token:"",
    refreshtoken:"",
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
      if (!this.token) {
    this.state = SessionState.IsNotLogin;
    return;
  }   try {
        const me = await api.Auth.getSession();
        const { user_name, real_name, introduction, role, email } = me;
        this.username = user_name;
        this.displayedName = real_name;
        this.bio = introduction;
        this.role = role ;
        this.email = email;
        this.state = SessionState.IsLogin;
      } catch (error) {
        this.logoutLocally();
      }
    },
     async setTokens(access: string, refresh: string) {
      this.token = access;
      this.refreshtoken = refresh;
      await this.validateSession();
    },
    logoutLocally() {
      this.$reset();
      this.state = SessionState.IsNotLogin;
    },
  },
});


// To avoid circular dependency, export a function to set the token provider after store initialization.
export function initSessionTokenProvider(sessionStore: ReturnType<typeof useSession>) {
  setTokenProvider(() => {
    return sessionStore.token || null;
  });

  setRefreshProvider(async () => {
    if (!sessionStore.refreshtoken) return null;
    try {
      const { access } = await api.Auth.refresh({ refresh: sessionStore.refreshtoken });
      sessionStore.token = access; // 更新新 access
      return access;
    } catch {
      sessionStore.logoutLocally();
      return null;
    }
  });
}