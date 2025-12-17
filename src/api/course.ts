import { fetcher } from "./fetcher";

export const Course = {
  create: (body: CourseForm) => fetcher.post("/course/", body),
  list: () => fetcher.get<{ courses: CourseList }>("/course/"),
  info: (courseId: string) => fetcher.get<Course>(`/course/${courseId}/`),
  importCSV: (courseId: string, file: File, force?: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("force", force ? "1" : "0");
    return fetcher.post<CourseImportCSVResponse>(`/course/${courseId}/import-csv/`, formData);
  },
  editMember: (courseId: string, body: { remove: string[]; new: string[] }) =>
    fetcher.put<{ message: string }>(`/course/${courseId}/`, body),
  generateInviteCode: (courseId: string) =>
    fetcher.post<{ joinCode: string }>(`/course/${courseId}/invite-code/`),
};

export const Announcement = {
  getAnnouncement: (course_id: number | string) => fetcher.get<AnnouncementList>(`/ann/${course_id}/ann`),
  create: (body: AnnouncementCreationForm) =>
    fetcher.post<{ annId: string; created_at: number }>("/ann/", body),
  modify: (body: AnnouncementEditionForm) => fetcher.put<{ message: string }>("/ann/", body),
  delete: (body: { annId: number }) => fetcher.delete("/ann/", { data: body }),
  getOne: (courseId: string, annId: string) => fetcher.get<AnnouncementList>(`/ann/${courseId}/${annId}`),
};
