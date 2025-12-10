declare enum ProblemType {
  OJ = 0,
  FillIn = 1,
  HandWritten = 2,
}

declare enum ProblemStatus {
  "hidden" = 1,
  "public" = 0,
}

interface ProblemTestCase {
  taskScore: number;
  caseCount: number;
  memoryLimit: number;
  timeLimit: number;
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
  status: ProblemStatus;
  testCaseInfo: {
    language: number;
    fillInTemplate: string;
    tasks: ProblemTestCase[];
  };
  canViewStdout: boolean;
  defaultCode: string;
}

interface Problem {
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
  status: ProblemStatus;
  testCase: ProblemTestCase[];
  canViewStdout: boolean;
  owner: string;
  defaultCode: string;
  submitCount: number;
  highScore: number;
  ACUser: number;
  submitter: number;
}

interface ProblemListItem {
  problemId: number;
  problemName: string;
  status: ProblemStatus;
  ACUser: number;
  submitter: number;
  tags: string[];
  type: ProblemType;
  quota: number;
  submitCount: number;
}

type ProblemList = ProblemListItem[];
interface top10item {
  id: string;
  user: string;
  execution_time: number;
  score: number;
  status: string;
}
type top10list = top10item[];
interface scorestat {
  score: number;
  count: number;
}
interface ProblemStats {
  statusCount: {
    accepted: number;
    wrong_answer: number;
    runtime_error: number;
  };
  triedUserCount: number;
  average: number;
  std: number;
  scoreDistribution: scorestat[];
  acUserRatio: number[];
  top10RunTime: top10list;
  top10MemoryUsage: top10list;
}

interface MossReport {
  cpp_report: string;
  python_report: string;
}

type LangOption = { value: number; text: string; mask: number };
type ProblemUpdater = <K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) => void;

interface ApiTag {
  id: number;
  name: string;
  usage_count: number;
}

interface ApiProblemItem {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  is_public: "public" | "course" | "hidden";
  course_id: string; // uuid
  tags: ApiTag[];
  created_at: string;
  total_quota: number;
  total_submissions: number;
}

interface ApiProblemList {
  results: ApiProblemItem[];
}
interface problemresponse {
  id: number;
  problemName: string;
  allowedLanguage: numb;
  difficulty: "easy" | "medium" | "hard";
  status: "public" | "course" | "hidden";
  course_id: number;
  tags: ApiTag[];
  submit_count: number;
  high_score: number;
  create_at: string;
  quota: number;
  description: {
    description: string;
    input: string;
    output: string;
    hint: string;
    sampleInput: string[];
    sampleOutput: string[];
  };
}
interface ProblemCreatePayload {
  title: string;
  description: string;
  course_id: string;
  difficulty?: "easy" | "medium" | "hard";
  is_public?: "public" | "course" | "hidden";
  max_score?: number;
  total_quota?: number;
  input_description?: string | null;
  output_description?: string | null;
  sample_input?: string | null;
  sample_output?: string | null;
  hint?: string | null;
  subtask_description?: string | null;
  supported_languages?: string[];
}
