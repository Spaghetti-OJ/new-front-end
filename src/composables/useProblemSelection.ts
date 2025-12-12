import { computed } from "vue";
import { useAxios } from "@vueuse/integrations/useAxios";
import { fetcher } from "@/api";
import { ProblemList } from "@/types/problem";

type ProblemSelections = { value: string; text: string }[];
export type ProblemId2Meta = Record<string, { name: string; quota: number }>;

export function useProblemSelection(courseName: string) {
  const {
    data: problems,
    error,
    isLoading,
  } = useAxios<ProblemList>(`/problem?offset=0&count=-1&course=${courseName}`, fetcher);

  const problemSelections = computed<ProblemSelections>(() => {
    if (!problems.value) return [];
    return problems.value.results.map(({ id, title }) => ({
      value: id.toString(),
      text: `${id} - ${title}`,
    }));
  });

  const problemId2Meta = computed<ProblemId2Meta>(() => {
    if (!problems.value) return {};
    return Object.fromEntries(
      problems.value.results.map(({ id, title, total_quota }) => [
        id.toString(),
        { name: title, quota: total_quota },
      ]),
    );
  });

  return {
    problemSelections,
    problemId2Meta,
    error,
    isLoading,
  };
}
