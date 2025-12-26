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

interface PublicUserProfile {
  username: string;
  role: string;
  email: string;
  user_id: string;
  bio: string;
  avatar: string | null;
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
interface apikeyresponse {
  id: string;
  name: string;
  prefix: string;
  permissions: PermissionRow[];
  usage_count: number;
  last_used_at: string;
  last_used_ip: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  is_expired: boolean;
}
type PermissionType = "submissions" | "courses" | "homeworks" | "announcements";

interface PermissionRow {
  type: PermissionType;
  read: boolean;
  create: boolean;
}

interface UserStats {
  user: User & {
    id: string;
    is_active: boolean;
    date_joined: string;
  };
  total_submissions: number;
  ac_submissions: number;
  ac_problems: number;
  best_score: number;
  average_score: number | null;
  first_ac_time: string | null;
  last_submission_time: string | null;
  acceptance_rate?: number;
  accept_percent?: number;
  top_languages?: string[];
  solved_problem_list?: number[];
}

interface UserStatsResponse {
  data: {
    user_stats: UserStats;
  };
  message: string;
  status: string;
}

interface SubmissionActivityResponse {
  status: string;
  data: Record<string, number>;
  message: string;
}
