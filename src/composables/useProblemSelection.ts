import { computed, ref, onMounted } from "vue";
import api from "@/api";

type ProblemSelections = { value: string; text: string }[];
export type ProblemId2Meta = Record<string, { name: string; quota: number }>;

type ProblemListLike = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: ProblemItem[];
  items?: ProblemItem[];
  data?: {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: ProblemItem[];
    items?: ProblemItem[];
  };
};

function toProblemList(raw: unknown): ProblemList {
  const data = (raw ?? null) as ProblemListLike | null;
  let results: ProblemItem[] = [];
  if (data?.results) {
    results = data.results;
  } else if (data?.items) {
    results = data.items;
  } else if (data?.data?.results) {
    results = data.data.results;
  } else if (data?.data?.items) {
    results = data.data.items;
  }

  let count = results.length;
  if (typeof data?.count === "number") {
    count = data.count;
  } else if (typeof data?.data?.count === "number") {
    count = data.data.count;
  }

  let next: string | null = null;
  if (data?.next !== undefined) {
    next = data.next ?? null;
  } else if (data?.data?.next !== undefined) {
    next = data.data.next ?? null;
  }

  let previous: string | null = null;
  if (data?.previous !== undefined) {
    previous = data.previous ?? null;
  } else if (data?.data?.previous !== undefined) {
    previous = data.data.previous ?? null;
  }

  return {
    count,
    next,
    previous,
    results,
  };
}

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
      problems.value = toProblemList(data);
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
