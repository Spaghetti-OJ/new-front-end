interface User {
  user_name: string;
  real_name: string;
  introduction: string;
  role: number;
  email: string;
  md5: string;
  student_id:string;
  user_id: string;
}

interface UserSignup{
  id:string,
  username:string,
  email: string, 
  real_name: string,
  identity: string,
  date_joined: string,
  last_login: string|null,
}
type UserInfo = Pick<User, "user_name" | "real_name" | "role" | "md5">;

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
  access : string;
  refresh : string;
}
/*interface AuthProfile {
  id: string;
  username: string;
  email: string;
  real_name: string;
  identity: "teacher" | "admin" | "student";
  date_joined: string;
  last_login: string | null;
  profile: {
    student_id: string;
    bio: string;
    avatar: string | null;
    email_verified: boolean;
    updated_at: string;
  };
}*/