import { defineStore } from "pinia";
import api from "@/api";
import { setTokenProvider } from "@/api/fetcher";

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
      try {
        const me = (await api.Auth.getSession());
        const { username, displayedName, bio, role, email } = me;
        this.username = username;
        this.displayedName = displayedName;
        this.bio = bio;
        this.role = role;
        this.email = email;
        this.state = SessionState.IsLogin;
      } catch (error) {
        this.$reset();
        this.state = SessionState.IsNotLogin;
      }
    },
  },
});

