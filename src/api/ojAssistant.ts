// src/api/ojAssistant.ts
import { fetcher } from "./fetcher";

interface ProblemData {
  id: number;
  title: string;
  [key: string]: unknown;
}

interface SubmissionData {
  code: string;
  lang: string;
  [key: string]: unknown;
}

interface AssistantResponse {
  answer: string;
  confidence?: number;
  sources?: string[];
}

export const ojAssistant = {
  quickAsk: async (question: string): Promise<AssistantResponse> => {
    const res = await fetcher.post("/assistant/ask", { question });
    return res.data;
  },

  askWithProblem: async (question: string, problem: ProblemData): Promise<AssistantResponse> => {
    const res = await fetcher.post("/assistant/ask", { question, problem });
    return res.data;
  },

  askWithSubmission: async (
    question: string,
    problem: ProblemData,
    submission: SubmissionData,
  ): Promise<AssistantResponse> => {
    const res = await fetcher.post("/assistant/ask", { question, problem, submission });
    return res.data;
  },
};
