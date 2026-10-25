import fixture from "../../fixtures/movie-details.json";
import { mapDetails, mapMovie, mapProviders, pickTrailer, type RawMovieDetails } from "@/lib/tmdb/mappers";

const details = fixture as unknown as RawMovieDetails;

it("mapMovie converte campos", () => {
  expect(
    mapMovie({
      id: 1,
      title: "Duna",
      original_title: "Dune",
      release_date: "2024-02-27",
      poster_path: "/p.jpg",
      vote_average: 8.137,
      genre_ids: [878],
    }),
  ).toEqual({
    id: 1,
    title: "Duna",
    year: 2024,
    posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
    rating: 8.1,
    genreIds: [878],
    providers: [],
  });
});

it("mapMovie tolera campos ausentes", () => {
  const m = mapMovie({
    id: 2,
    title: "",
    original_title: "Orig",
    release_date: "",
    poster_path: null,
    vote_average: 0,
    genre_ids: [],
  });
  expect(m).toMatchObject({ title: "Orig", year: null, posterUrl: null, rating: 0 });
});

it("mapMovie anexa provedores recebidos", () => {
  const providers = [{ id: 8, name: "Netflix", logoUrl: null }];
  expect(mapMovie({ id: 3, title: "X", genre_ids: [] }, providers).providers).toBe(providers);
});

it("mapProviders ordena por prioridade", () => {
  const result = mapProviders([
    { provider_id: 1, provider_name: "B", logo_path: "/b.jpg", display_priority: 5 },
    { provider_id: 2, provider_name: "A", logo_path: null, display_priority: 1 },
  ]);
  expect(result).toEqual([
    { id: 2, name: "A", logoUrl: null },
    { id: 1, name: "B", logoUrl: "https://image.tmdb.org/t/p/w92/b.jpg" },
  ]);
  expect(mapProviders(undefined)).toEqual([]);
});

it("pickTrailer prefere YouTube Trailer em pt", () => {
  expect(pickTrailer(details.videos!.results)).toBe("trailer-pt");
});

it("pickTrailer cai para en", () => {
  const semPt = details.videos!.results.filter((v) => v.key !== "trailer-pt");
  expect(pickTrailer(semPt)).toBe("trailer-en");
});

it("pickTrailer ignora teasers e outros sites", () => {
  expect(
    pickTrailer([
      { site: "Vimeo", type: "Trailer", iso_639_1: "pt", key: "v" },
      { site: "YouTube", type: "Teaser", iso_639_1: "pt", key: "t" },
    ]),
  ).toBeNull();
});

it("mapDetails usa só flatrate do país", () => {
  const br = mapDetails(details, "BR");
  expect(br).toMatchObject({
    id: 693134,
    title: "Duna: Parte Dois",
    year: 2024,
    runtime: 166,
    rating: 8.1,
    posterUrl: "https://image.tmdb.org/t/p/w342/poster.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
    trailerKey: "trailer-pt",
    watchLink: "https://www.themoviedb.org/movie/693134-dune-part-two/watch?locale=BR",
  });
  expect(br.genres).toEqual([
    { id: 878, name: "Ficção científica" },
    { id: 12, name: "Aventura" },
  ]);
  expect(br.providers.map((p) => p.name)).toEqual(["Amazon Prime Video", "Max"]);

  const us = mapDetails(details, "US");
  expect(us.providers).toEqual([]);
  expect(us.watchLink).toBeNull();
});

it("mapDetails tolera backdrop/runtime/overview ausentes", () => {
  const m = mapDetails(
    { ...details, backdrop_path: null, runtime: 0, overview: undefined, videos: undefined, "watch/providers": undefined },
    "BR",
  );
  expect(m).toMatchObject({ backdropUrl: null, runtime: null, overview: "", trailerKey: null, providers: [], watchLink: null });
});
