// src/api/ojAssistant.ts
import { fetcher } from "./fetcher";

export const ojAssistant = {
  quickAsk: async (question: string) => {
    return fetcher.post("/assistant/ask", { question }).then((r) => r.data);
  },
  askWithProblem: async (question: string, problem: any) => {
    return fetcher.post("/assistant/ask", { question, problem }).then((r) => r.data);
  },
  askWithSubmission: async (question: string, problem: any, submission: any) => {
    return fetcher.post("/assistant/ask", { question, problem, submission }).then((r) => r.data);
  },
};
