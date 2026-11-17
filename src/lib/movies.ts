import { db } from "@/db";
import { appSettings, movies } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import films from "@/data/films.json";
import type { MovieInput } from "@/lib/types";

let seedPromise: Promise<void> | undefined;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      const [seeded] = await tx.select().from(appSettings).where(eq(appSettings.key, "films-seed-v1"));
      if (seeded) return;
      const favorites = new Set(["film-01", "film-03", "film-12", "film-18", "film-53", "film-71", "film-75"]);
      await tx.insert(movies).values(films.map(({ wiki: _wiki, ...film }, index) => ({
        ...film,
        posterUrl: `/posters/${film.id}.jpg`,
        status: (film.adeleRating !== null || film.romaRating !== null ? "watched" : "planned") as "watched" | "planned",
        favorite: favorites.has(film.id),
        position: index + 1,
      }))).onConflictDoNothing();
      await tx.insert(appSettings).values({ key: "films-seed-v1", value: "77" }).onConflictDoNothing();
    }).catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }
  await seedPromise;
}

export async function getMovies() {
  await ensureSeeded();
  return db.select().from(movies).orderBy(asc(movies.position), desc(movies.createdAt));
}

export class ValidationError extends Error {}

export function validateMovieInput(value: unknown): MovieInput {
  if (!value || typeof value !== "object") throw new ValidationError("Некорректные данные фильма");
  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title || title.length > 200) throw new ValidationError("Введите название фильма (до 200 символов)");
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1888 || year > 2100) throw new ValidationError("Укажите год от 1888 до 2100");
  const duration = Number(input.duration);
  if (!Number.isInteger(duration) || duration < 1 || duration > 1000) throw new ValidationError("Продолжительность должна быть от 1 до 1000 минут");
  const genres = Array.isArray(input.genres) ? [...new Set(input.genres.filter((g): g is string => typeof g === "string" && g.trim().length > 0).map(g => g.trim().slice(0, 40)))].slice(0, 8) : [];
  if (!genres.length) throw new ValidationError("Выберите хотя бы один жанр");
  if (input.status !== "watched" && input.status !== "planned") throw new ValidationError("Выберите статус фильма");
  function rating(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "number" && typeof value !== "string") throw new ValidationError("Оценка должна быть числом от 0 до 10");
    const result = Number(value);
    if (!Number.isFinite(result) || result < 0 || result > 10 || (result * 2) % 1 !== 0) throw new ValidationError("Оценка должна быть от 0 до 10 с шагом 0,5");
    return result;
  }
  const adeleRating = rating(input.adeleRating);
  const romaRating = rating(input.romaRating);
  if (input.status === "planned" && (adeleRating !== null || romaRating !== null)) throw new ValidationError("Чтобы поставить оценку, выберите статус «Просмотрен»");
  const posterUrl = typeof input.posterUrl === "string" ? input.posterUrl.trim() : "";
  if (posterUrl && !/^https?:\/\/[^\s]+$/i.test(posterUrl) && !/^\/(?!\/)[^\s]*$/.test(posterUrl)) throw new ValidationError("Укажите корректную ссылку на постер");
  if (posterUrl.length > 2000) throw new ValidationError("Слишком длинная ссылка на постер");
  return {
    title,
    originalTitle: typeof input.originalTitle === "string" ? input.originalTitle.trim().slice(0, 200) : "",
    year,
    duration,
    genres,
    description: typeof input.description === "string" ? input.description.trim().slice(0, 3000) : "",
    posterUrl: posterUrl || "/images/poster-fallback.svg",
    status: input.status,
    adeleRating,
    romaRating,
    favorite: input.favorite === true,
  };
}
