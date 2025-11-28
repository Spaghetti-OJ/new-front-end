import { fetcher } from "./fetcher";

export const Course = {
  create: (body: CourseForm) => fetcher.post("/course/", body),
  list: () => fetcher.get<{ courses: CourseList }>("/course/"),
  info: (courseId: string) =>
    fetcher.get<Course>(`/course/${courseId}/`).then((res) => {
      if (!res?.data) return res;
      return {
        ...res,
        data: {
          ...res.data,
          teacher: {
            ...res.data.teacher,
            role: "teacher",
          },
          TAs: (res.data.TAs ?? []).map((ta) => ({
            ...ta,
            role: "ta",
          })),
          students: (res.data.students ?? []).map((student) => ({
            ...student,
            role: "student",
          })),
        },
      };
    }),
};

export const Announcement = {
  create: (body: AnnouncementCreationForm) => fetcher.post<{ annId: string }>("/ann", body),
  modify: (body: AnnouncementEditionForm) => fetcher.put("/ann", body),
  delete: (body: { annId: string }) => fetcher.delete("/ann", { data: body }),
};
