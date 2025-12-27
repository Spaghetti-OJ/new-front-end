import { fetcher } from "./fetcher";

export const Problem = {
  getProblemList: (params?: {
    page_size?: number;
    course_id?: number | string;
    [key: string]: string | number | boolean | undefined;
  }) => fetcher.get<ProblemList>("/search/problems", { params }),
  getManageData: (problemId: string | number) => fetcher.get(`/problem/manage/${problemId}`),
  create: (body: ProblemCreatePayload) => fetcher.post("/problem/manage", body),
  getProblemStat: (problemId: number) => fetcher.get<ProblemStats>(`/problem/${problemId}/stats`),
  getProblemInfo: (problemId: number) => fetcher.get<ProblemInfo>(`/problem/${problemId}`),
  getTestCaseUrl: (problemId: number) =>
    fetcher.get(`/problem/${problemId}/test-case`, { responseType: "blob" }),
  modify: (id: string | number, body: ProblemCreatePayload) => fetcher.put(`/problem/manage/${id}`, body),
  modifyTestdata: (id: string | number, body: FormData) =>
    fetcher.put(`/problem/manage/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: string | number) => fetcher.delete(`/problem/manage/${id}`),

  initiateTestCaseUpload: (problemId: number, body: { length: number; part_size: number }) =>
    fetcher.post<{ upload_id: string; urls: string[] }>(
      `/problem/${problemId}/initiate-test-case-upload`,
      body,
    ),

  completeTestCaseUpload: (
    problemId: number,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ) => fetcher.post(`/problem/${problemId}/complete-test-case-upload`, { uploadId, parts }),

  getSubtasks: (problemId: number | string) => fetcher.get<SubtaskResponse>(`/problem/${problemId}/subtasks`),
  createSubtasks: (problemId: number, body: SubtaskPayload) =>
    fetcher.post(`/problem/${problemId}/subtasks`, body),
  deleteSubtasks: (problemId: number | string, subtaskId: number | string) =>
    fetcher.delete(`/problem/${problemId}/subtasks/${subtaskId}`),

  searchGlobal: (q: string) => fetcher.get<SearchProblemResponse>("/search/", { params: { q } }),
  createTestCase: (problemId: number, body: CreateTestCaseBody) =>
    fetcher.post(`/problem/${problemId}/test-cases`, body),
  deleteTestCase: (problemId: number, caseId: number) =>
    fetcher.delete(`/problem/${problemId}/test-cases/${caseId}`),
  getTestCases: (problemId: number) =>
    fetcher.get<{
      data: Array<{
        id: number;
        subtask_id: number;
        idx: number;
        input_path: string;
        output_path: string;
        status: string;
      }>;
    }>(`/problem/${problemId}/test-cases`),
  like: (problemId: number) =>
    fetcher.post<{ data: { likes_count: number }; message: string; status: string }>(
      `/problem/${problemId}/like`,
    ),
  unlike: (problemId: number) =>
    fetcher.delete<{ data: { likes_count: number }; message: string; status: string }>(
      `/problem/${problemId}/like`,
    ),
  getLikes: (problemId: number) =>
    fetcher.get<{ data: { likes_count: number }; message: string; status: string }>(
      `/problem/${problemId}/likes`,
    ),
  listLiked: () => fetcher.get<{ data: ProblemList; message: string; status: string }>(`/problem/liked`),
  uploadTestCasesZip: (problemId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetcher.post(`/problem/${problemId}/test-cases/upload-zip`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
