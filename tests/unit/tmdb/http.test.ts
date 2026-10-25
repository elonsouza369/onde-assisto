import { tmdbFetch, TmdbError, TmdbNotFoundError } from "@/lib/tmdb/http";

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_API_TOKEN", "test-token");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("monta URL com language=pt-BR, parâmetros codificados e cabeçalho Bearer", async () => {
  fetchMock.mockResolvedValue(json({ ok: 1 }));
  const data = await tmdbFetch("/search/movie", { query: "ação & cia", page: 2, skip: undefined }, 21600);
  expect(data).toEqual({ ok: 1 });
  const [url, init] = fetchMock.mock.calls[0];
  const u = new URL(url);
  expect(u.origin + u.pathname).toBe("https://api.themoviedb.org/3/search/movie");
  expect(u.searchParams.get("language")).toBe("pt-BR");
  expect(u.searchParams.get("query")).toBe("ação & cia");
  expect(u.searchParams.get("page")).toBe("2");
  expect(u.searchParams.has("skip")).toBe(false);
  expect(init.headers.Authorization).toBe("Bearer test-token");
  expect(init.next).toEqual({ revalidate: 21600 });
  expect(init.signal).toBeDefined();
});

it("tenta de novo uma vez após 429", async () => {
  vi.useFakeTimers();
  fetchMock.mockResolvedValueOnce(json({}, 429)).mockResolvedValueOnce(json({ ok: 2 }));
  const promise = tmdbFetch("/x", {}, 1);
  await vi.advanceTimersByTimeAsync(999);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await expect(promise).resolves.toEqual({ ok: 2 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("lança TmdbError se o 429 se repetir", async () => {
  vi.useFakeTimers();
  fetchMock.mockResolvedValue(json({}, 429));
  const promise = tmdbFetch("/x", {}, 1);
  const assertion = expect(promise).rejects.toMatchObject({ status: 429 });
  await vi.advanceTimersByTimeAsync(1000);
  await assertion;
  await expect(promise).rejects.toBeInstanceOf(TmdbError);
});

it("lança TmdbNotFoundError em 404", async () => {
  fetchMock.mockResolvedValue(json({}, 404));
  await expect(tmdbFetch("/movie/1", {}, 1)).rejects.toBeInstanceOf(TmdbNotFoundError);
});

it("lança TmdbError com status em 500", async () => {
  fetchMock.mockResolvedValue(json({}, 500));
  const error = (await tmdbFetch("/x", {}, 1).catch((e) => e)) as TmdbError;
  expect(error).toBeInstanceOf(TmdbError);
  expect(error).not.toBeInstanceOf(TmdbNotFoundError);
  expect(error.status).toBe(500);
});

it("exige o token", async () => {
  vi.stubEnv("TMDB_API_TOKEN", "");
  await expect(tmdbFetch("/x", {}, 1)).rejects.toThrow("Defina TMDB_API_TOKEN em .env.local");
  expect(fetchMock).not.toHaveBeenCalled();
});
