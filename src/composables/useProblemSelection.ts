import { computed, ref, onMounted } from "vue";
import api from "@/api";

type ProblemSelections = { value: string; text: string }[];
export type ProblemId2Meta = Record<string, { name: string; quota: number }>;

export function useProblemSelection(courseId: string) {
  const problems = ref<ProblemList>();
  const error = ref<unknown>(null);
  const isLoading = ref(true);

  const fetchProblems = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.Problem.getProblemList({
        page_size: 1000,
        course_id: Number(courseId),
      });
      const rawData = data ?? {};
      const results = Array.isArray((rawData as any).results)
        ? (rawData as any).results
        : Array.isArray((rawData as any).items)
        ? (rawData as any).items
        : Array.isArray((rawData as any).data?.results)
        ? (rawData as any).data.results
        : Array.isArray((rawData as any).data?.items)
        ? (rawData as any).data.items
        : [];

      const count =
        typeof (rawData as any).count === "number"
          ? (rawData as any).count
          : typeof (rawData as any).data?.count === "number"
          ? (rawData as any).data.count
          : results.length;

      problems.value = {
        count,
        next: (rawData as any).next ?? (rawData as any).data?.next ?? null,
        previous: (rawData as any).previous ?? (rawData as any).data?.previous ?? null,
        results,
      };
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchProblems);

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
