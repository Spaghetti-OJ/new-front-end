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
  languageType: number;
  lastSend: number;
  memoryUsage: number;
  problemId: number;
  runTime: number;
  score: number;
  status: SubmissionStatusCodes;
  submissionId: string;
  timestamp: number;
  user: UserInfo;
  ipAddr: string;
}

type SubmissionList = SubmissionListItem[];

interface Submission extends SubmissionListItem {
  code: string;
  tasks: Task[];
}

interface GetSubmissionListResponse {
  submissions?: SubmissionList; // Legacy support
  submissionCount?: number; // Legacy support
  results?: SubmissionList;
  count?: number;
}

interface SubmissionListQuery {
  page?: number;
  page_size?: number;
  offset?: number;
  count?: number;
  course?: string;
  problemId?: string;
  status?: string;
  languageType?: string;
  username?: string;
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

interface SubmissionListFilter {
  problemId?: string;
  status?: string;
  languageType?: string;
  username?: string;
}

interface CustomTestSubmitPayload {
  language: number;
  source_code: string;
  stdin?: string;
}

interface CustomTestSubmitData {
  test_id: string;
  submission_id: string;
  status: string;
}

interface CustomTestSubmitResponse {
  data: CustomTestSubmitData;
  message: string;
  status: string;
}

interface CustomTestCompileInfo {
  status: string;
  message: string;
}

interface CustomTestResultData {
  test_id: string;
  problem_id: number;
  language: number;
  status: string;
  stdout: string;
  stderr: string;
  time: number;
  memory: number;
  message: string;
  compile_info: CustomTestCompileInfo;
  created_at: string;
}

interface CustomTestResultResponse {
  data: CustomTestResultData;
  message: string;
  status: string;
}
