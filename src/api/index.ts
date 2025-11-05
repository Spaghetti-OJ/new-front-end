import { Auth, Copycat } from "./auth";
import { Problem } from "./problem";
import { Submission } from "./submission";
import { Homework } from "./homework";
import { Announcement, Course } from "./course";
import { User } from "./user";
import { AIVTuber } from "./aivtuber";
import { Ranking } from "./ranking";

export { fetcher } from "./fetcher";
export { Auth, Copycat } from "./auth";
export { Problem } from "./problem";
export { Submission } from "./submission";
export { Homework } from "./homework";
export { Announcement, Course } from "./course";
export { User } from "./user";
export { AIVTuber } from "./aivtuber";
export { Ranking } from "./ranking";

const api = {
  Auth,
  Problem,
  Submission,
  Homework,
  Announcement,
  Course,
  User,
  Copycat,
  AIVTuber,
  Ranking,
};

export default api;
