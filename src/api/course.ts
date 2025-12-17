import { fetcher } from "./fetcher";

export const Course = {
  create: (body: CourseForm) => fetcher.post("/course/", body),
  list: () => fetcher.get<{ courses: CourseList }>("/course/"),
  info: (courseId: string | number) => fetcher.get<Course>(`/course/${courseId}/`),
  importCSV: (courseId: string | number, file: File, force?: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("force", force ? "1" : "0");
    return fetcher.post<CourseImportCSVResponse>(`/course/${courseId}/import-csv/`, formData);
  },
  editMember: (courseId: string | number, body: { remove: string[]; new: string[] }) =>
    fetcher.put<{ message: string }>(`/course/${courseId}/`, body),
  generateInviteCode: (courseId: string | number) =>
    fetcher.post<{ joinCode: string }>(`/course/${courseId}/invite-code/`),
  deleteInviteCode: (courseId: string | number, code: string) =>
    fetcher.delete<{ message: string }>(`/course/${courseId}/invite-code/${code}/`),
  editCourse: (body: { courseId: number; newCourse: string; teacher: string }) =>
    fetcher.put<{ message: string }>(`/course/`, {
      course_id: body.courseId,
      new_course: body.newCourse,
      teacher: body.teacher,
    }),
  deleteCourse: (body: { courseId: number }) =>
    fetcher.delete<{ message: string }>(`/course/`, { data: { course_id: body.courseId } }),
  getSummary: () => fetcher.get<CourseSummary>("/course/summary/"),
  getScoreBoard: (courseId: string | number, params: { pids: string; start?: number; end?: number }) =>
    fetcher.get<ScoreBoardResponse>(`/course/${courseId}/scoreboard/`, { params }),
};

export const Announcement = {
  getAnnouncement: (course_id: number | string) => fetcher.get<AnnouncementList>(`/ann/${course_id}/ann`),
  create: (body: AnnouncementCreationForm) =>
    fetcher.post<{ annId: string; created_at: number }>("/ann/", body),
  modify: (body: AnnouncementEditionForm) => fetcher.put<{ message: string }>("/ann/", body),
  delete: (body: { annId: number }) => fetcher.delete("/ann/", { data: body }),
  getOne: (courseId: string, annId: string) => fetcher.get<AnnouncementList>(`/ann/${courseId}/${annId}`),
};
