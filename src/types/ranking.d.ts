export interface RankingUser {
  username: string;
  email: string;

  [k: string]: unknown;
}

export interface RankingItem {
  user: RankingUser;
  ACProblem: number;
  ACSubmission: number;
  Submission: number;
}

export interface RankingResponse {
  message: string; // "Success."
  ranking: RankingItem[];
}
