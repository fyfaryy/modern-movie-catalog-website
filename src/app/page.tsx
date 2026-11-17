import MovieLibrary from "@/components/movie-library";
import { getMovies } from "@/lib/movies";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const movies = await getMovies();
  return <MovieLibrary initialMovies={movies} />;
}
