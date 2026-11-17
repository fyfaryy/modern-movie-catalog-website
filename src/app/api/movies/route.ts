import { db } from "@/db";
import { movies } from "@/db/schema";
import { ensureSeeded, getMovies, validateMovieInput, ValidationError } from "@/lib/movies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getMovies());
  } catch (error) {
    console.error("Failed to load movies", error);
    return Response.json({ error: "Не удалось загрузить коллекцию" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = validateMovieInput(await request.json());
    await ensureSeeded();
    const [movie] = await db.insert(movies).values({ ...input, id: crypto.randomUUID() }).returning();
    return Response.json(movie, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Failed to create movie", error);
    return Response.json({ error: "Не удалось сохранить фильм. Попробуйте ещё раз." }, { status: 500 });
  }
}
