import { fetcher } from "./fetcher";

export const User = {
  modify: (username: string, body: UserEditionForm) => fetcher.patch(`/user/${username}`, body),
};