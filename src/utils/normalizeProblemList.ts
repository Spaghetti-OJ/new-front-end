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

export function toProblemList(raw: unknown): ProblemList {
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
