interface User {
  username: string;
  role: string;
  email: string;
  user_id: string;
  real_name?: string;
  email_verified: boolean;
}

interface UserSignup {
  id: string;
  username: string;
  email: string;
  userid: string;
  role: string;
  date_joined: string;
  last_login: string | null;
}
type UserInfo = Pick<User, "username" | "role" | "real_name" | "user_id" | "email_verified">;

interface UserSummary {
  userCount: number;
  breakdown: {
    role: string;
    count: number;
  }[];
}

interface UserEditorConfig {
  fontSize: number;
  theme: string;
  indentType: 0 | 1;
  tabSize: number;
  language: 0 | 1 | 2;
}

interface UserProperties {
  real_name: string;
  username: string;
  role: string;
  email: string;
  user_id: string;
  student_id: string;
  bio: string;
  avatar: string;
  email_verified: boolean;
}

interface UserEditionForm {
  password: string | null;
  displayedName: string;
  role: number;
}

interface CheckEmail {
  valid: number; // 1 for valid/unused email
}
interface AuthToken {
  access: string;
  refresh: string;
}
