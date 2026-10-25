import "server-only";

const API_BASE = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_000;

export const REVALIDATE_LISTS = 86400;
export const REVALIDATE_CONTENT = 21600;

export class TmdbError extends Error {
  constructor(
    public status: number,
    message = `TMDB respondeu com status ${status}`,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export class TmdbNotFoundError extends TmdbError {
  constructor() {
    super(404, "Não encontrado no TMDB");
    this.name = "TmdbNotFoundError";
  }
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(API_BASE + path);
  url.searchParams.set("language", "pt-BR");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
): Promise<T> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new Error("Defina TMDB_API_TOKEN em .env.local");

  const url = buildUrl(path, params);
  const request = () =>
    fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  let response = await request();
  if (response.status === 429) {
    await wait(RETRY_DELAY_MS);
    response = await request();
  }

  if (response.status === 404) throw new TmdbNotFoundError();
  if (!response.ok) throw new TmdbError(response.status);
  return (await response.json()) as T;
}
