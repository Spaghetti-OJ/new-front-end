interface CourseListItem {
  id: number;
  course: string;
  teacher: UserInfo;
}

type CourseList = CourseListItem[];

interface Course {
  course: CourseInfo;
  teacher: UserInfo;
  TAs: UserInfo[];
  students: UserInfo[];
}

interface CourseInfo {
  id: number;
  course: string;
  description: string;
  joinCode: string;
  studentLimit: number;
  semester: "Spring" | "Fall" | "Summer";
  academicYear: string;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseForm {
  course: string;
  teacher: UserInfo["username"];
}

interface CourseSummary {
  courseCount: number;
  breakdown: {
    course: string;
    userCount: number;
    problemCount: number;
    submissionCount: number;
    homeworkCount: number;
  }[];
}

interface CourseImportCSVResult {
  id: string;
  status: string;
  fileName: string;
  fileSize: number;
  importResult: boolean;
  createdUsers: number;
  newMembers: number;
  skippedExistingMembers: number;
  errorCount: number;
  errors: { row?: number; message: string }[];
}

interface CourseImportCSVResponse {
  message: string;
  status_code: number;
  data: {
    import: CourseImportCSVResult;
  };
}
