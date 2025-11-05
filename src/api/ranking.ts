import { RankingResponse } from "@/types/ranking";
import { fetcher } from "./fetcher";

export const Ranking={
ranking:()=>fetcher.get<RankingResponse>("/ranking").then((r:any)=>r.data??r),


}