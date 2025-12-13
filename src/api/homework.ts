import { fetcher } from "./fetcher";

const homework = {
  create: (body: HomeworkCreationForm) => fetcher.post("/homework/", body),
  modify: (id: string, body: HomeworkEditionForm) => fetcher.put(`/homework/${id}`, body),
  delete: (id: string) => fetcher.delete(`/homework/${id}`),
  list: (courseId: string) => fetcher.get<GetHomeworksResponse>(`/course/${courseId}/homework/`),
};

export const Homework = homework;
