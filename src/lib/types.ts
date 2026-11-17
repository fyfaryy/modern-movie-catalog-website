export type MovieStatus = "watched" | "planned";

export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  duration: number;
  genres: string[];
  description: string;
  posterUrl: string;
  status: MovieStatus;
  adeleRating: number | null;
  romaRating: number | null;
  favorite: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type MovieInput = Omit<Movie, "id" | "position" | "createdAt" | "updatedAt">;

export const GENRES = ["Драма", "Комедия", "Триллер", "Ужасы", "Боевик", "Фантастика", "Детектив", "Приключения", "Мелодрама", "Криминал", "Биография", "Фэнтези", "Мюзикл", "История"];

export function averageRating(movie: Pick<Movie, "adeleRating" | "romaRating">): number | null {
  const ratings = [movie.adeleRating, movie.romaRating].filter((rating): rating is number => rating !== null);
  return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
}

export function formatRating(value: number | null): string {
  return value === null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

export function pluralMovies(count: number): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return "фильмов";
  if (n1 === 1) return "фильм";
  if (n1 >= 2 && n1 <= 4) return "фильма";
  return "фильмов";
}
