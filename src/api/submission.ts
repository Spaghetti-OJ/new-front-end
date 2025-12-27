import { fetcher } from "./fetcher";

export const Submission = {
  create: async (body: { problemId: number; languageType: number }) => {
    const payload = {
      problem_id: body.problemId,
      language_type: body.languageType,
    };
    return fetcher.post<{ message: string; status: string; data: null }>("/submission/", payload);
  },

  upload: (id: string, body: { source_code: string }) => {
    return fetcher.put(`/submission/${id}/`, body);
  },

  rejudge: (id: string) => fetcher.get(`/submission/${id}/rejudge/`),
  getDetail: (id: string) => fetcher.get<SubmissionInfo>(`/submission/${id}/`),
  getCode: (id: string) =>
    fetcher.get<{ source_code: string; language_type: number }>(`/submission/${id}/code/`),
  list: (params: SubmissionListQuery) =>
    fetcher
      .get<GetSubmissionListResponse>("/submission/", { params })
      .then((res) => (res as unknown as { data: { results: SubmissionList; count: number } }).data),
};
