"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCheck, ChevronDown, ChevronRight, Clapperboard, Download, Film, Ghost, Heart, LayoutGrid, List, LoaderCircle, Menu, Moon, Orbit, Pencil, Plus, Search, Shuffle, SlidersHorizontal, Sparkles, Star, Sun, Ticket, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { averageRating, formatRating, formatDuration, pluralMovies, type Movie, type MovieInput } from "@/lib/types";
import { MovieDetails, MovieForm, MoviePoster } from "@/components/movie-dialogs";

type Section = "all" | "watched" | "planned" | "favorites" | "horror" | "adventure" | "top";
const SECTION_NAMES: Record<Section, string> = { all: "Все фильмы", watched: "Просмотренные", planned: "В планах", favorites: "Избранное", horror: "Вечер ужасов", adventure: "Навстречу приключениям", top: "Наши фавориты" };
const PAGE_SIZE = 15;

function matchesSection(movie: Movie, section: Section) {
  if (section === "watched" || section === "planned") return movie.status === section;
  if (section === "favorites") return movie.favorite;
  if (section === "horror") return movie.genres.includes("Ужасы");
  if (section === "adventure") return movie.genres.includes("Приключения");
  if (section === "top") return (averageRating(movie) ?? -1) >= 9;
  return true;
}

function Score({ value, person }: { value: number | null; person: "adele" | "roma" }) {
  return <div className="card-person-score" title={`Оценка ${person === "adele" ? "Адели" : "Ромы"}`}><span className={`avatar avatar-${person}`}>{person === "adele" ? "А" : "Р"}</span><span className="person-name">{person === "adele" ? "Аделя" : "Рома"}</span><strong className={value === null ? "score-empty" : value >= 7 ? "score-good" : value >= 5 ? "score-medium" : "score-low"}>{formatRating(value)}</strong></div>;
}

function MovieCard({ movie, index, onOpen, onEdit, onFavorite, busy }: { movie: Movie; index: number; onOpen: () => void; onEdit: () => void; onFavorite: () => void; busy: boolean }) {
  const average = averageRating(movie);
  return <article className="movie-card" style={{ animationDelay: `${Math.min(index, 4) * 35}ms` }}>
    <div className="card-poster-wrap">
      <button className="poster-open" onClick={onOpen} aria-label={`Открыть фильм «${movie.title}»`}><MoviePoster src={movie.posterUrl} alt={`Постер фильма «${movie.title}»`} eager={index < 5} /><span className="poster-shade" /><span className="poster-open-hint">Подробнее<ArrowUpRight size={16} /></span></button>
      <span className={`poster-status ${movie.status}`}>{movie.status === "watched" ? <Check size={11} strokeWidth={2.5} /> : <Bookmark size={11} />}{movie.status === "watched" ? "Просмотрен" : "В планах"}</span>
      <button className={`poster-heart ${movie.favorite ? "is-favorite" : ""}`} onClick={onFavorite} disabled={busy} aria-label={movie.favorite ? `Убрать «${movie.title}» из избранного` : `Добавить «${movie.title}» в избранное`} aria-pressed={movie.favorite}>{busy ? <LoaderCircle size={16} className="spinning" /> : <Heart size={16} fill={movie.favorite ? "currentColor" : "none"} />}</button>
      {average !== null && <span className="poster-average"><Star size={12} fill="currentColor" />{average.toFixed(1)}</span>}
      <button className="poster-edit" onClick={onEdit} aria-label={`Редактировать «${movie.title}»`}><Pencil size={14} /></button>
    </div>
    <button className="card-title" onClick={onOpen} title={movie.title}>{movie.title}</button>
    <div className="card-meta"><span>{movie.year}</span><span className="meta-dot">·</span><span>{movie.genres.slice(0, 2).join(", ")}</span></div>
    <div className="card-ratings"><Score value={movie.adeleRating} person="adele" /><span className="rating-divider" /><Score value={movie.romaRating} person="roma" /></div>
    <p className="card-description">{movie.description || "Новая история в нашей коллекции. Самое интересное — впереди."}</p>
  </article>;
}

export default function MovieLibrary({ initialMovies }: { initialMovies: Movie[] }) {
  const [movies, setMovies] = useState(initialMovies);
  const [section, setSection] = useState<Section>("all");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState("added");
  const [minRating, setMinRating] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [detail, setDetail] = useState<Movie | null>(null);
  const [editing, setEditing] = useState<Movie | "new" | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const collectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    try { const saved = localStorage.getItem("kadr-view"); if (saved === "list") setView("list"); } catch { /* Storage may be unavailable in private mode. */ }
    function keyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); searchRef.current?.focus(); collectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  useEffect(() => { setLimit(PAGE_SIZE); }, [section, query, genre, sort, minRating]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4200); return () => clearTimeout(timer); }, [toast]);

  function changeTheme(next: "dark" | "light") { setTheme(next); document.documentElement.dataset.theme = next; try { localStorage.setItem("kadr-theme", next); } catch { /* Theme still works without storage. */ } }
  function changeView(next: "grid" | "list") { setView(next); try { localStorage.setItem("kadr-view", next); } catch { /* View still works without storage. */ } }
  function navigate(next: Section) { setSection(next); setQuery(""); setGenre("all"); setMinRating("all"); setMobileOpen(false); }

  const stats = useMemo(() => {
    const watched = movies.filter(movie => movie.status === "watched").length;
    const rated = movies.map(averageRating).filter((rating): rating is number => rating !== null);
    return { watched, planned: movies.length - watched, favorites: movies.filter(movie => movie.favorite).length, average: rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : "—" };
  }, [movies]);
  const genres = useMemo(() => [...new Set(movies.flatMap(movie => movie.genres))].sort((a, b) => a.localeCompare(b, "ru")), [movies]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
    const result = movies.filter(movie => matchesSection(movie, section) && (genre === "all" || movie.genres.includes(genre)) && (minRating === "all" || (averageRating(movie) ?? -1) >= Number(minRating)) && (!normalizedQuery || `${movie.title} ${movie.originalTitle} ${movie.year} ${movie.genres.join(" ")}`.toLocaleLowerCase("ru").replace(/ё/g, "е").includes(normalizedQuery)));
    if (sort === "rating") result.sort((a, b) => (averageRating(b) ?? -1) - (averageRating(a) ?? -1));
    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    if (sort === "newest") result.sort((a, b) => b.year - a.year);
    if (sort === "oldest") result.sort((a, b) => a.year - b.year);
    return result;
  }, [movies, section, genre, query, sort, minRating]);
  const visible = filtered.slice(0, limit);
  const featured = movies.find(movie => movie.id === "film-09") ?? movies.find(movie => movie.genres.includes("Фантастика")) ?? movies[0];

  function replaceMovie(movie: Movie) { setMovies(previous => previous.map(item => item.id === movie.id ? movie : item)); setDetail(previous => previous?.id === movie.id ? movie : previous); }

  async function patchMovie(movie: Movie, change: Partial<MovieInput>, message?: string) {
    if (busyIds.has(movie.id)) return;
    setBusyIds(previous => new Set(previous).add(movie.id));
    try {
      const response = await fetch(`/api/movies/${encodeURIComponent(movie.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить изменения");
      replaceMovie(result);
      if (message) setToast({ text: message });
    } catch (error) { setToast({ text: error instanceof Error ? error.message : "Ошибка соединения. Попробуйте ещё раз.", error: true }); }
    finally { setBusyIds(previous => { const next = new Set(previous); next.delete(movie.id); return next; }); }
  }

  async function saveMovie(input: MovieInput, id?: string) {
    const response = await fetch(id ? `/api/movies/${encodeURIComponent(id)}` : "/api/movies", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить фильм");
    if (id) replaceMovie(result); else { setMovies(previous => [result, ...previous]); navigate("all"); setSort("added"); }
    setEditing(null);
    setToast({ text: id ? "Изменения сохранены. Продолжаем киновечер!" : "Новая история добавлена в коллекцию" });
  }

  async function deleteMovie(id: string) {
    const response = await fetch(`/api/movies/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { const result = await response.json(); throw new Error(result.error ?? "Не удалось удалить фильм"); }
    setMovies(previous => previous.filter(movie => movie.id !== id));
    setEditing(null); setDetail(null); setToast({ text: "Фильм удалён из коллекции" });
  }

  function randomMovie() {
    const planned = movies.filter(movie => movie.status === "planned");
    const pool = planned.length ? planned : movies;
    if (pool.length) setDetail(pool[Math.floor(Math.random() * pool.length)]);
    else setToast({ text: "Сначала добавьте фильм в коллекцию" });
  }

  function exportCollection() {
    const link = document.createElement("a");
    link.href = "/api/movies/export";
    link.download = "kadr-films.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const navItems: { id: Section; label: string; icon: LucideIcon; count: number }[] = [
    { id: "all", label: "Все фильмы", icon: LayoutGrid, count: movies.length },
    { id: "watched", label: "Просмотренные", icon: CheckCheck, count: stats.watched },
    { id: "planned", label: "В планах", icon: Bookmark, count: stats.planned },
    { id: "favorites", label: "Избранное", icon: Heart, count: stats.favorites },
  ];

  return <div className="app-shell">
    {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Закрыть меню" />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <button className="brand" onClick={() => navigate("all")} aria-label="кадр. — все фильмы"><span className="brand-mark"><Clapperboard size={24} strokeWidth={1.9} /></span><span>кадр<span className="brand-dot">.</span></span></button>
      <p className="brand-tagline">Маленькая жизнь в большом кино</p>
      <div className="sidebar-main"><span className="nav-caption">ВАША БИБЛИОТЕКА</span><nav className="main-nav" aria-label="Библиотека">{navItems.map(({ id, label, icon: Icon, count }) => <button key={id} className={`nav-item ${section === id ? "active" : ""}`} onClick={() => navigate(id)} aria-current={section === id ? "page" : undefined}><Icon size={18} /><span>{label}</span><span className="nav-count">{count}</span></button>)}</nav>
      <div className="collection-nav"><span className="nav-caption">ПОДБОРКИ ДЛЯ НАС <Sparkles size={12} /></span><button className={`nav-item collection-link ${section === "top" ? "active" : ""}`} onClick={() => navigate("top")}><span className="collection-dot dot-yellow"><Star size={13} /></span><span>Наши фавориты</span><ChevronRight size={14} /></button><button className={`nav-item collection-link ${section === "horror" ? "active" : ""}`} onClick={() => navigate("horror")}><span className="collection-dot dot-purple"><Ghost size={13} /></span><span>Вечер ужасов</span><ChevronRight size={14} /></button><button className={`nav-item collection-link ${section === "adventure" ? "active" : ""}`} onClick={() => navigate("adventure")}><span className="collection-dot dot-blue"><Orbit size={13} /></span><span>Приключения</span><ChevronRight size={14} /></button></div></div>
      <div className="sidebar-bottom"><div className="cinema-note"><span className="note-illustration"><Ticket size={32} strokeWidth={1.1} /><Sparkles size={16} /></span><strong>У каждого фильма —<br />наша история.</strong><p>Сохраняйте впечатления.<br />Собирайте воспоминания.</p><span className="note-tiny-dot" /></div><div className="theme-switch" role="group" aria-label="Цветовая тема"><button className={theme === "light" ? "selected" : ""} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}><Sun size={15} />Светлая</button><button className={theme === "dark" ? "selected" : ""} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}><Moon size={15} />Тёмная</button></div><div className="sidebar-footer"><span className="online-dot" />Наше место для кино<span>© 2026</span></div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu-button" aria-label="Открыть меню" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="breadcrumb-home">Библиотека</span><ChevronRight size={13} /><span>{SECTION_NAMES[section]}</span></div><div className="topbar-right"><button className="topbar-search icon-button" aria-label="Перейти к поиску" onClick={() => { searchRef.current?.focus(); collectionRef.current?.scrollIntoView({ behavior: "smooth" }); }}><Search size={18} /></button><button className="icon-button export-button" onClick={exportCollection} aria-label="Скачать коллекцию в CSV" title="Скачать коллекцию"><Download size={18} /></button><span className="topbar-divider" /><div className="couple-profile"><div className="avatar-stack"><span className="avatar avatar-adele">А</span><span className="avatar avatar-roma">Р</span></div><div><strong>Аделя и Рома</strong><span><span className="online-dot" />Кино на двоих</span></div></div></div></header>
      <main className="main-content">
        <div className="page-heading"><div><h1>Наша фильмотека<span className="heading-dot">.</span></h1><p>Хорошее кино становится лучше, когда мы вместе.</p></div><button className="button button-primary add-movie-button" onClick={() => setEditing("new")}><Plus size={18} strokeWidth={2} />Добавить фильм</button></div>

        <section className="featured-film" aria-label="Фильм для вдохновения">
          <img className="hero-backdrop" src="/images/interstellar.jpg" alt="Горные пейзажи далёкой планеты из фильма «Интерстеллар»" fetchPriority="high" />
          <div className="hero-gradient" /><div className="hero-grain" />
          <div className="featured-copy"><span className="featured-eyebrow"><span />ВЫБОР НА ВЕЧЕР</span><h2>За пределами<br />обычного кино.</h2><p>Истории, которые остаются с нами.<br />И люди, с которыми хочется их разделить.</p><button className="button hero-button" onClick={() => featured ? setDetail(featured) : setEditing("new")}>{featured ? "Открыть фильм" : "Добавить первый фильм"}<ArrowUpRight size={17} /></button></div>
          <div className="hero-movie-info"><span className="hero-movie-kicker">СЕГОДНЯ В КАДРЕ</span><strong>{featured?.title ?? "Ваша следующая история"}</strong>{featured && <span>{featured.year}<span>·</span>{featured.genres[0]}<span>·</span>{formatDuration(featured.duration)}</span>}</div>
          <button className="hero-random" onClick={randomMovie} title="Выбрать случайный фильм"><Shuffle size={16} /><span>Не можем выбрать</span><ArrowUpRight size={13} /></button>

        </section>

        <section className="stats-grid" aria-label="Наша коллекция в цифрах">
          <div className="stat-item"><span className="stat-icon stat-green"><Film size={19} /></span><div><span className="stat-value">{movies.length}<span className="stat-note">{pluralMovies(movies.length)}</span></span><span className="stat-label">В нашей коллекции</span></div></div>
          <div className="stat-item"><span className="stat-icon stat-purple"><CheckCheck size={20} /></span><div><span className="stat-value">{stats.watched}<span className="stat-note">{movies.length ? Math.round(stats.watched / movies.length * 100) : 0}% коллекции</span></span><span className="stat-label">Уже посмотрели</span></div></div>
          <div className="stat-item"><span className="stat-icon stat-blue"><Bookmark size={19} /></span><div><span className="stat-value">{stats.planned}<span className="stat-note">впереди</span></span><span className="stat-label">Ждут своего вечера</span></div></div>
          <div className="stat-item"><span className="stat-icon stat-yellow"><Star size={19} /></span><div><span className="stat-value">{stats.average}<span className="stat-note">из 10</span></span><span className="stat-label">Наша средняя оценка</span></div></div>
        </section>

        <section className="collection-section" ref={collectionRef} aria-label="Каталог фильмов">
          <div className="collection-heading">
            <div className="collection-title"><h2>{section === "all" || section === "watched" || section === "planned" ? "Коллекция" : SECTION_NAMES[section]}</h2><span className="collection-count">{filtered.length}</span></div>
            {(section === "all" || section === "watched" || section === "planned") && <div className="collection-tabs" role="group" aria-label="Статус просмотра">{([{ id: "all", label: "Все фильмы", count: movies.length }, { id: "watched", label: "Просмотренные", count: stats.watched }, { id: "planned", label: "В планах", count: stats.planned }] as const).map(tab => <button key={tab.id} className={section === tab.id ? "active" : ""} onClick={() => navigate(tab.id)}>{tab.label}<span>{tab.count}</span></button>)}</div>}
            <div className="collection-heading-right"><span className="view-label">Вид каталога</span><div className="view-switch" role="group" aria-label="Вид каталога"><button className={view === "grid" ? "selected" : ""} onClick={() => changeView("grid")} aria-label="Карточки" aria-pressed={view === "grid"}><LayoutGrid size={17} /></button><button className={view === "list" ? "selected" : ""} onClick={() => changeView("list")} aria-label="Таблица" aria-pressed={view === "list"}><List size={19} /></button></div></div>
          </div>
          <div className="catalog-toolbar"><div className="search-field"><Search size={17} /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти тот самый фильм..." aria-label="Поиск фильмов" />{query ? <button aria-label="Очистить поиск" onClick={() => setQuery("")}><X size={15} /></button> : <kbd>⌘ K</kbd>}</div><div className="select-wrap genre-select"><SlidersHorizontal size={15} /><select value={genre} onChange={event => setGenre(event.target.value)} aria-label="Фильтр по жанру"><option value="all">Все жанры</option>{genres.map(item => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={13} /></div><div className="select-wrap sort-select"><ArrowDownWideNarrow size={16} /><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Сортировка фильмов"><option value="added">По добавлению</option><option value="rating">По рейтингу</option><option value="title">По названию</option><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select><ChevronDown size={13} /></div><button className={`icon-button filter-toggle ${showFilters || minRating !== "all" ? "selected" : ""}`} onClick={() => setShowFilters(value => !value)} aria-label="Дополнительные фильтры" aria-expanded={showFilters}><SlidersHorizontal size={17} />{minRating !== "all" && <span />}</button></div>
          {showFilters && <div className="extra-filters"><Star size={16} /><label htmlFor="minimum-rating">Наша оценка</label><select id="minimum-rating" value={minRating} onChange={event => setMinRating(event.target.value)}><option value="all">Любая</option><option value="9">От 9 — обязательно к просмотру</option><option value="8">От 8 — очень понравилось</option><option value="7">От 7 — хорошее кино</option><option value="5">От 5 — можно посмотреть</option></select><button className="text-button" onClick={() => { setGenre("all"); setMinRating("all"); setQuery(""); setSort("added"); }}>Сбросить фильтры<X size={13} /></button></div>}
          {(query || genre !== "all" || minRating !== "all") && <p className="search-results-count" role="status">Найдено: {filtered.length} {pluralMovies(filtered.length)}{query && <> по запросу «{query}»</>}<button onClick={() => { setQuery(""); setGenre("all"); setMinRating("all"); }}>Сбросить<X size={12} /></button></p>}

          {filtered.length === 0 ? <div className="empty-state"><span className="empty-icon"><Clapperboard size={35} strokeWidth={1.3} /></span><h3>В этой сцене пока пусто</h3><p>{movies.length === 0 ? "Добавьте первый фильм — с него начнётся ваша история." : "Попробуйте другой запрос или откройте для себя новую историю."}</p><button className="button button-primary" onClick={() => { if (movies.length === 0 || section === "favorites") setEditing("new"); else { navigate("all"); setSort("added"); } }}>{movies.length === 0 || section === "favorites" ? <><Plus size={16} />Добавить фильм</> : "Показать все фильмы"}</button></div> : view === "grid" ? <div className="movie-grid">{visible.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} onOpen={() => setDetail(movie)} onEdit={() => setEditing(movie)} busy={busyIds.has(movie.id)} onFavorite={() => patchMovie(movie, { favorite: !movie.favorite }, movie.favorite ? "Фильм убран из избранного" : "Фильм добавлен в избранное")} />)}</div> : <div className="movie-table-wrap"><table className="movie-table"><thead><tr><th>Фильм</th><th>Год</th><th>Статус</th><th><span className="avatar avatar-adele">А</span>Аделя</th><th><span className="avatar avatar-roma">Р</span>Рома</th><th><Star size={13} />Наша</th><th><span className="sr-only">Действия</span></th></tr></thead><tbody>{visible.map(movie => <tr key={movie.id}><td><button className="table-film" onClick={() => setDetail(movie)}><MoviePoster src={movie.posterUrl} alt={movie.title} /><span><strong>{movie.title}</strong><span>{movie.genres.slice(0, 3).join(" · ")}</span></span></button></td><td className="muted">{movie.year}</td><td><span className={`table-status ${movie.status}`}>{movie.status === "watched" ? <Check size={12} /> : <Bookmark size={12} />}{movie.status === "watched" ? "Просмотрен" : "В планах"}</span></td><td className="table-score">{formatRating(movie.adeleRating)}</td><td className="table-score">{formatRating(movie.romaRating)}</td><td className="table-score table-average">{averageRating(movie)?.toFixed(1) ?? "—"}</td><td><button className="icon-button" onClick={() => setEditing(movie)} aria-label={`Редактировать «${movie.title}»`}><Pencil size={16} /></button></td></tr>)}</tbody></table></div>}

          {filtered.length > 0 && <div className="catalog-bottom"><span>Показано {Math.min(limit, filtered.length)} из {filtered.length} {pluralMovies(filtered.length)}</span>{limit < filtered.length ? <button className="button button-load-more" onClick={() => setLimit(previous => previous + PAGE_SIZE)}>Показать ещё<ChevronDown size={16} /></button> : <span className="all-shown"><CheckCheck size={15} />Всё в кадре</span>}<button className="text-button back-to-top" onClick={() => collectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>К началу<ArrowUpRight size={14} /></button></div>}
        </section>
        <footer className="main-footer"><span className="footer-brand">кадр<span>.</span></span><span>Не просто список фильмов. Наша общая история.</span><Heart size={13} /></footer>
      </main>
    </div>
    {detail && <MovieDetails movie={detail} onClose={() => setDetail(null)} onEdit={() => { setEditing(detail); setDetail(null); }} onFavorite={() => patchMovie(detail, { favorite: !detail.favorite })} onStatus={() => patchMovie(detail, { status: "watched" }, "Ещё один совместный киновечер в коллекции")} busy={busyIds.has(detail.id)} />}
    {editing && <MovieForm key={editing === "new" ? "new" : editing.id} movie={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={saveMovie} onDelete={deleteMovie} />}
    {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status"><span>{toast.error ? <X size={17} /> : <Check size={17} />}</span>{toast.text}<button onClick={() => setToast(null)} aria-label="Закрыть уведомление"><X size={15} /></button></div>}
  </div>;
}
