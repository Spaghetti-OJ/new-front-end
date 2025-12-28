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
  problem_ids: number[];
  markdown: string;
  studentStatus: string;
}

type HomeworkProblemMetaItem = {
  id: number;
  title?: string;
  name?: string;
  total_quota?: number;
  quota?: number;
  highScore?: number;
  high_score?: number;
};

type HomeworkProblemListItem = number | HomeworkProblemMetaItem;

type HomeworkProblemListFields = {
  problemIds?: number[];
  problems?: HomeworkProblemListItem[];
  problem_list?: HomeworkProblemListItem[];
};

type HomeworkProblemListPayload = (HomeworkListItem | HomeworkPreviewForm) & HomeworkProblemListFields;

interface GetHomeworksResponse {
  items: HomeworkListItem[];
}

type HomeworkList = HomeworkListItem[];
