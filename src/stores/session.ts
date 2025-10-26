import { defineStore } from "pinia";
import api from "@/api";
import { setTokenProvider } from "@/api/fetcher";

export enum SessionState {
  NotValidated = -1,
  IsNotLogin = 0,
  IsLogin = 1,
}

export enum UserRole {
  Guest = "guest",
  Admin = "admin",
  Teacher = "teacher",
  Student = "student",
}

export const useSession = defineStore("session", {
  state: () => {
    return {  
    state: SessionState.NotValidated,  
    id: "",  
    username: "",  
    realName: "",  
    identity: "",  
    profile: {  
      studentId: "",  
      bio: "",  
      avatar: null as string | null,  
      emailVerified: false,  
      updatedAt: "",  
    },  
    email: "",  
    dateJoined: "",  
    lastLogin: null as string | null,  
    token:"",
  }; 
  },
  getters: {
    isAdmin(state) {
      return state.identity === UserRole.Admin;
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
  }
      try {
        const { id, username, email, real_name, identity, date_joined, last_login, profile } = (await api.Auth.getSession());  
            this.id = id;  
            this.username = username;  
            this.email = email;  
            this.realName = real_name;  
            this.identity = identity;  
            this.dateJoined = date_joined;  
            this.lastLogin = last_login;  
            this.profile = {  
              studentId: profile.student_id,  
              bio: profile.bio,  
              avatar: profile.avatar,  
              emailVerified: profile.email_verified,  
              updatedAt: profile.updated_at,  
            };  
this.state = SessionState.IsLogin;
        this.state = SessionState.IsLogin;
      } catch (error) {
        this.$reset();
        this.state = SessionState.IsNotLogin;
      }
    },
  },
});

// To avoid circular dependency, export a function to set the token provider after store initialization.
export function initSessionTokenProvider(sessionStore: ReturnType<typeof useSession>) {
  setTokenProvider(() => {
    return sessionStore.token || null;
  });
}
