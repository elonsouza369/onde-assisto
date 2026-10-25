import fixture from "../../fixtures/movie-details.json";
import { tmdbFetch, TmdbNotFoundError } from "@/lib/tmdb/http";
import { getMovieDetails } from "@/lib/tmdb/details";
import { mapDetails, type RawMovieDetails } from "@/lib/tmdb/mappers";

vi.mock("@/lib/tmdb/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tmdb/http")>()),
  tmdbFetch: vi.fn(),
}));
const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => {
  fetchMock.mockReset();
});

it("busca detalhes com provedores e vídeos", async () => {
  fetchMock.mockResolvedValue(fixture);
  const result = await getMovieDetails(693134, "BR");
  expect(fetchMock).toHaveBeenCalledWith(
    "/movie/693134",
    { append_to_response: "watch/providers,videos", include_video_language: "pt,en" },
    21600,
  );
  expect(result).toEqual(mapDetails(fixture as unknown as RawMovieDetails, "BR"));
});

it("propaga 404 como TmdbNotFoundError", async () => {
  fetchMock.mockImplementation(async () => {
    throw new TmdbNotFoundError();
  });
  await expect(getMovieDetails(1, "BR")).rejects.toBeInstanceOf(TmdbNotFoundError);
});
