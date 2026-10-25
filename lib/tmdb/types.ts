export type Provider = { id: number; name: string; logoUrl: string | null };

export type Genre = { id: number; name: string };

export type Region = { code: string; name: string };

export type Movie = {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  rating: number;
  genreIds: number[];
  providers: Provider[];
};

export type MoviePage = { movies: Movie[]; page: number; totalPages: number };

export type MovieDetails = {
  id: number;
  title: string;
  year: number | null;
  runtime: number | null;
  overview: string;
  rating: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: Genre[];
  trailerKey: string | null;
  providers: Provider[];
  watchLink: string | null;
};
