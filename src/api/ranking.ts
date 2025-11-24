import { RankingResponse } from "@/types/ranking";
import { fetcher } from "./fetcher";

export const Ranking = {
  getRankingStats: () => fetcher.get<RankingResponse>("/ranking/").then((r) => r.data ?? r),
};
