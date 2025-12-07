import { fetcher } from "./fetcher";

export const Problem = {
  getProblemList: (query?: {
    difficulty?: string;
    is_public?: string;
    course_id?: number;
  }) => fetcher.get<ApiProblemList>("/problem/", {params:query}),
  create: (body: ProblemForm) => fetcher.post("/problem/manage", body),
  getProblemInfo: (problemId: number)  => fetcher.get<problemresponse>(`/problem/${problemId}`),
  getTestCaseUrl: (problemId: number) => `${fetcher.defaults.baseURL}/problem/${problemId}/testcase`,
  modify: (id: string | number, body: ProblemForm) => fetcher.put(`/problem/manage/${id}`, body),
  modifyTestdata: (id: string | number, body: FormData) =>
    fetcher.put(`/problem/manage/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: string | number) => fetcher.delete(`/problem/manage/${id}`),

  initiateTestCaseUpload: (problemId: number, body: { length: number; partSize: number }) =>
    fetcher.post<{ upload_id: string; urls: string[] }>(
      `/problem/${problemId}/initiate-test-case-upload`,
      body,
    ),

  completeTestCaseUpload: (
    problemId: number,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ) => fetcher.post(`/problem/${problemId}/complete-test-case-upload`, { uploadId, parts }),
};
