interface User {
  username: string;
  role: string;
  email: string;
  userid: string;
}

interface UserSignup {
  id: string;
  username: string;
  email: string;
  userid: string;
  identity: string;
  date_joined: string;
  last_login: string | null;
}
type UserInfo = Pick<User, "username" | "role">;

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

interface UserProperties extends User {
  editorConfig: UserEditorConfig;
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
