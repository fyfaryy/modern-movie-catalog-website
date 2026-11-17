import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeeded, validateMovieInput, ValidationError } from "@/lib/movies";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await ensureSeeded();
    const [existing] = await db.select().from(movies).where(eq(movies.id, id));
    if (!existing) return Response.json({ error: "Фильм не найден" }, { status: 404 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Некорректные данные" }, { status: 400 });
    const input = validateMovieInput({ ...existing, ...body });
    const [movie] = await db.update(movies).set({ ...input, updatedAt: new Date().toISOString() }).where(eq(movies.id, id)).returning();
    return Response.json(movie);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Failed to update movie", error);
    return Response.json({ error: "Не удалось обновить фильм. Попробуйте ещё раз." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const deleted = await db.delete(movies).where(eq(movies.id, id)).returning({ id: movies.id });
    if (!deleted.length) return Response.json({ error: "Фильм не найден" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete movie", error);
    return Response.json({ error: "Не удалось удалить фильм" }, { status: 500 });
  }
}
