import { Auth, Copycat } from "./auth";
import { Problem } from "./problem";
import { Submission } from "./submission";
import { Assignments, Homework } from "./homework";
import { Announcement, Course } from "./course";
import { User } from "./user";
import { AIVTuber } from "./aivtuber";

export { fetcher } from "./fetcher";
export { Auth, Copycat } from "./auth";
export { Problem } from "./problem";
export { Submission } from "./submission";
export { Assignments, Homework } from "./homework";
export { Announcement, Course } from "./course";
export { User } from "./user";
export { AIVTuber } from "./aivtuber";

const api = {
  Auth,
  Problem,
  Submission,
  Assignments,
  Homework,
  Announcement,
  Course,
  User,
  Copycat,
  AIVTuber,
};

export default api;
