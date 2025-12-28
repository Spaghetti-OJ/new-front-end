declare enum SubmissionStatusCodes {
  PENDING = -1,
  ACCEPTED = 0,
  WRONG_ANSWER = 1,
  COMPILE_ERROR = 2,
  TIME_LIMIT_EXCEED = 3,
  MEMORY_LIMIT_EXCEED = 4,
  RUNTIME_ERROR = 5,
  JUDGE_ERROR = 6,
  OUTPUT_LIMIT_EXCEED = 7,
}

interface Case {
  execTime: number;
  memoryUsage: number;
  status: SubmissionStatusCodes;
}

interface Task {
  cases: Case[];
  execTime: number;
  memoryUsage: number;
  score: number;
  status: SubmissionStatusCodes;
}

interface SubmissionListItem {
  submissionId: string;
  problemId: number;
  user: {
    id: string;
    username: string;
    real_name: string; // Added real_name
  };
  status: number | string;
  score: number;
  runTime: number;
  memoryUsage: number;
  languageType: number | string;
  timestamp: string;
  ipAddr: string;
}

type SubmissionList = SubmissionListItem[];

interface Submission extends SubmissionListItem {
  code: string;
  tasks: Task[];
}

interface GetSubmissionListResponse {
  data: {
    results: SubmissionList;
    count: number;
  };
  message: string;
  status: string;
}

interface SubmissionListQuery {
  page?: number;
  page_size?: number;
  offset?: number;
  count?: number;
  count?: number;
  course_id?: string;
  problem_id?: string;
  status?: string;
  language_type?: string;
  username?: string;
  after?: number | string;
  before?: number | string;
  ip_prefix?: string;
}

interface SubmissionInfo {
  submissionId: string;
  problemId: number;
  user: UserInfo;
  timestamp: string;
  lastSend: string;
  status: string | number; // JSON example shows "0", but could be enum
  score: number;
  runTime: number;
  memoryUsage: number;
  languageType: string | number;
  ipAddr: string;
  tasks?: Task[];
}

interface SubmissionCaseOutput {
  submission_id: string;
  task_no: number;
  case_no: number;
  status: string;
  score: number;
  max_score: number;
  execution_time: number | null;
  memory_usage: number | null;
  output: string;
  error_message: string;
  judge_message: string;
}

interface SubmissionCaseOutputResponse {
  data: SubmissionCaseOutput;
  message: string;
  status: string;
}

interface SubmissionListFilter {
  problemId?: string;
  status?: string;
  languageType?: string;
  username?: string;
}
