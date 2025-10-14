import { Auth, Copycat } from "./auths";
import { Problem } from "./problems";
import { Submission } from "./submissions";
import { Assignments, Homework } from "./assignments";
import { Announcement, Course } from "./courses";
import { User } from "./user";
import { AIVTuber } from "./aivtuber";

export { fetcher } from "./fetcher";
export { Auth, Copycat } from "./auths";
export { Problem } from "./problems";
export { Submission } from "./submissions";
export { Assignments, Homework } from "./assignments";
export { Announcement, Course } from "./courses";
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
