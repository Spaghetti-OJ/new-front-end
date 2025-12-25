interface HomeworkForm {
  name: string;
  start: number;
  end: number;
  markdown: string;
  problem_ids: number[];
}

interface HomeworkCreationForm extends HomeworkForm {
  course_id: number;
}

interface HomeworkEditionForm extends HomeworkForm {
  name?: string;
}

type HomeworkStudentStatus = {
  [username: string]: {
    [pid: string]: {
      problemStatus: string | null;
      score: number;
      submissionIds: string[];
    };
  };
};

interface HomeworkPreviewForm extends HomeworkForm {
  id: string;
  studentStatus: HomeworkStudentStatus;
}

interface Homework extends HomeworkForm {
  studentStatus: HomeworkStudentStatus;
}

interface HomeworkListItem {
  id: number;
  name: string;
  start: number | null;
  end: number | null;
  problemIds: number[];
  markdown: string;
  studentStatus: string;
}

interface GetHomeworksResponse {
  items: HomeworkListItem[];
}

type HomeworkList = HomeworkListItem[];
