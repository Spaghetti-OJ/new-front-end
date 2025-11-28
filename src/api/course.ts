import { fetcher } from "./fetcher";

export const Course = {
  create: (body: CourseForm) => fetcher.post("/course/", body),
  list: () => fetcher.get<{ courses: CourseList }>("/course/"),
};

export const Announcement = {
  create: (body: AnnouncementCreationForm) => fetcher.post<{ annId: string }>("/ann", body),
  modify: (body: AnnouncementEditionForm) => fetcher.put("/ann", body),
  delete: (body: { annId: string }) => fetcher.delete("/ann", { data: body }),
};
