interface ScoreboardHeader {
  title: string;
  selector: (row: ScoreboardRow) => string | number;
}

interface ScoreCell {
  avg: number;
  count: number;
  max: number;
  min: number;
  pid: number;
}

interface ScoreboardRow {
  user: UserInfo;
  avg: number;
  sum: number;
  [key: `${number}`]: ScoreCell;
}

type Scoreboard = ScoreboardRow[];

interface HomeworkScoreboardItemProblem {
  problem_id: number;
  best_score: number;
  max_possible_score: number;
  solve_status: "unsolved" | "partial" | "solved";
}

interface HomeworkScoreboardItem {
  rank: number;
  user_id: string;
  username: string;
  real_name: string;
  total_score: number;
  max_total_score: number;
  is_late: boolean;
  first_ac_time: string | null;
  last_submission_time: string | null;
  problems: HomeworkScoreboardItemProblem[];
}

interface HomeworkScoreboardData {
  homework_id: number;
  homework_title: string;
  course_id: string; // uuid
  items: HomeworkScoreboardItem[];
}

interface HomeworkScoreboardResponse {
  data: HomeworkScoreboardData;
  message: string;
  status: string;
}
