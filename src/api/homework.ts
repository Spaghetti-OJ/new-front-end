import { fetcher } from "./fetcher";

const homework = {
  create: (body: HomeworkCreationForm) => fetcher.post("/homework/", body),
  get: (id: string) => fetcher.get<Homework>(`/homework/${id}/`).then((r) => r.data),
  modify: (id: string, body: HomeworkEditionForm) => fetcher.put(`/homework/${id}/`, body),
  delete: (id: string) => fetcher.delete(`/homework/${id}`),
  list: (courseId: string) =>
    fetcher.get<GetHomeworksResponse>(`/course/${courseId}/homework/`).then((r) => r.data),
  getScoreboard: (homeworkId: string | number) =>
    fetcher
      .get<HomeworkScoreboardResponse>(`/homework/${homeworkId}/scoreboard/`)
      .then((r) => (r.data ?? r) as unknown as HomeworkScoreboardData),
};

export const Homework = homework;
