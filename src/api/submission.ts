import { fetcher } from "./fetcher";

export const Submission = {
  create: (body: { problemId: number; languageType: number }) =>
    fetcher.post<{ submissionId: string }>("/submission", body),
  modify: (id: string, body: FormData) =>
    fetcher.put(`/submission/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } }),
  rejudge: (id: string) => fetcher.get(`/submission/${id}/rejudge`),
};
