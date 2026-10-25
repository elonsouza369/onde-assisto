const IMAGE_BASE = "https://image.tmdb.org/t/p/";

export function imageUrl(
  path: string | null | undefined,
  size: "w92" | "w342" | "w780" | "w1280",
): string | null {
  return path ? `${IMAGE_BASE}${size}${path}` : null;
}
