export declare enum ProblemType {
  OJ = 0,
  FillIn = 1,
  HandWritten = 2,
}

export declare enum ProblemStatus {
  Hidden = 1,
  Visible = 0,
}

export interface ProblemTag {
  id: number;
  name: string;
  usage_count: number;
}

export interface ProblemItem {
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

export interface ProblemList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProblemItem[];
}

export interface ProblemTestCase {
  taskScore: number;
  caseCount: number;
  memoryLimit: number;
  timeLimit: number;
}

export interface ProblemInfo {
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
}

export interface ProblemForm {
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
}

export interface ProblemCreatePayload {
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
}

export interface ProblemStats {
  acUserRatio: [number, number];
  triedUserCount: number;
  average: number;
  std: number;
  scoreDistribution: { score: number; count: number }[];
  statusCount: { [key: string]: number };
  top10RunTime: any[];
  top10MemoryUsage: any[];
}

export interface MossReport {
  cpp_report: string | null;
  python_report: string | null;
}

export type LangOption = { value: number; text: string; mask: number };
export type ProblemUpdater = <K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) => void;
