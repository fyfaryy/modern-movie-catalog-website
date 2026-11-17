import { getMovies } from "@/lib/movies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const movies = await getMovies();
    const header = ["Название", "Оригинальное название", "Год", "Жанры", "Статус", "Оценка Адели", "Оценка Ромы", "Описание"];
    const rows = movies.map(movie => [movie.title, movie.originalTitle, movie.year, movie.genres.join(", "), movie.status === "watched" ? "Просмотрен" : "В планах", movie.adeleRating ?? "", movie.romaRating ?? "", movie.description]);
    const escape = (cell: string | number) => {
      const text = String(cell);
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const csv = "\uFEFF" + [header, ...rows].map(row => row.map(escape).join(";")).join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kadr-films.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Collection export failed", error);
    return Response.json({ error: "Не удалось выгрузить коллекцию" }, { status: 500 });
  }
}
