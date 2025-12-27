declare enum ProblemType {
  OJ = 0,
  FillIn = 1,
  HandWritten = 2,
}

declare enum ProblemStatus {
  Hidden = 1,
  Visible = 0,
}

interface ProblemTag {
  id: number;
  name: string;
  usage_count: number;
}

interface ProblemItem {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  max_score: number;
  is_public: "public" | "hidden" | "course";
  total_submissions: number;
  accepted_submissions: number;
  acceptance_rate: string;
  like_count: number;
  view_count: number;
  total_quota: number;
  description: string;
  input_description: string;
  output_description: string;
  sample_input: string;
  sample_output: string;
  hint: string;
  subtask_description: string;
  supported_languages: string[];
  creator_id: string;
  course_id: number;
  course_name: string;
  created_at: string;
  updated_at: string;
  tags: ProblemTag[];
}

interface ProblemList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProblemItem[];
}

type ProblemTagLike = string | { name: string };

interface RawProblemItem {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: ProblemTagLike[];
  course_id?: number | string | null;
  course_name?: string | null;
  acceptance_rate?: number | string | null;
}

interface ProblemListResponseLike {
  items?: RawProblemItem[];
  results?: RawProblemItem[];
  data?: {
    items?: RawProblemItem[];
    results?: RawProblemItem[];
  };
}

interface ProblemSearchResponseLike {
  data?: {
    items?: RawProblemItem[];
  };
  items?: RawProblemItem[];
  results?: RawProblemItem[];
}

interface ProblemTestCase {
  taskScore: number;
  caseCount: number;
  memoryLimit: number;
  timeLimit: number;
}

interface ProblemInfo {
  problemName: string;
  description: {
    description: string;
    input: string;
    output: string;
    hint: string;
    sampleInput: string;
    sampleOutput: string;
  };
  owner: {
    id: string;
    username: string;
    real_name: string;
  };
  tags: ProblemTag[];
  allowedLanguage: number;
  courses: { id: number; name: string }[];
  quota: number;
  defaultCode: { [key: string]: string } | string;
  status: "public" | "hidden" | "course";
  type: ProblemType;
  testCase: ProblemTestCase[];
  fillInTemplate: string | null;
  submitCount: number;
  highScore: number;
  solution: string;
  like_count?: number;
  is_liked_by_user?: boolean;
  subtaskDescription: string;
}

interface ProblemForm {
  problemName: string;
  description: {
    description: string;
    input: string;
    output: string;
    hint: string;
    sampleInput: string[];
    sampleOutput: string[];
  };
  courses: string[];
  tags: string[];
  allowedLanguage: number;
  quota: number;
  type: ProblemType;
  status: number;
  testCaseInfo: {
    language: number;
    fillInTemplate: string;
    tasks: ProblemTestCase[];
  };
  canViewStdout: boolean;
  defaultCode: string;
  solution: string;
  subtaskDescription: string;
  staticAnalysis: string[];
  allowedDomains: string[];
}
interface CreateTestCaseBody {
  subtask_id: number;
  idx: number;
  input_path: string;
  output_path: string;
  status?: "ready";
}
interface ProblemCreatePayload {
  title: string;
  description: string;
  course_id: string;
  difficulty: "easy" | "medium" | "hard";
  is_public: "public" | "hidden" | "course";
  max_score: number;
  total_quota: number;
  input_description: string | null;
  output_description: string | null;
  sample_input: string | null;
  sample_output: string | null;
  hint: string | null;
  subtask_description: string | null;
  supported_languages?: string[];
  tags: number[];
  allowed_domains?: string[];
}

interface ProblemTop10RunTimeItem {
  id: string;
  user: string;
  execution_time: number;
  score: number;
  status?: string;
}

interface Editorial {
  id: string;
  problem_id: number;
  content: string;
  author_username: string;
  author: string; // UUID
  likes_count: number;
  views_count: number;
  status: string;
  is_liked_by_user: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

interface ProblemTop10MemoryItem {
  id: string;
  user: string;
  memory_usage: number;
  score: number;
  status?: string;
}

interface ProblemStats {
  acUserRatio: [number, number];
  triedUserCount: number;
  average: number;
  std: number;
  scoreDistribution: { score: number; count: number }[];
  statusCount: { [key: string]: number };
  top10RunTime: ProblemTop10RunTimeItem[];
  top10MemoryUsage: ProblemTop10MemoryItem[];
}

interface MossReport {
  cpp_report: string | null;
  python_report: string | null;
}

type LangOption = { value: number; text: string; mask: number };
type ProblemUpdater = <K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) => void;

type SubtaskPayload = {
  subtask_no: number;
  weight: number;
  time_limit_ms: number;
  memory_limit_mb: number;
};

interface Subtasks {
  created_at: string;
  id: number;
  memory_limit_mb: number;
  problem_id: number;
  subtask_no: number;
  time_limit_ms: number;
  updated_at: string;
  weight: number;
}
type SubtaskResponse = Subtasks[];

type LlmMode = "" | "LLM_INPUT_ONLY" | "LLM_DIRECT";

interface GeneratePayload {
  llmMode: LlmMode;
}
interface SearchProblemItem {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  course_id: number;
  course_name: string;
  acceptance_rate: string; // "50.00"
  tags: { id: number; name: string; usage_count: number }[];
}
interface SearchProblemResponse {
  data: { items: SearchProblemItem[]; total: number };
  message: string;
  status: "ok" | "error";
}

interface CopycatReport {
  id: number;
  status: "pending" | "success" | "failed";
  moss_url: string | null;
  created_at: string;
  error_message: string;
}

interface CopycatResp {
  data: CopycatReport | null;
  message: string;
  status: "ok" | "error";
}
