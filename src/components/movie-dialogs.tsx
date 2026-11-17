"use client";

import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { X, Star, Clock3, CalendarDays, Pencil, Heart, Check, Bookmark, Trash2, LoaderCircle, ImagePlus, ArrowUpRight, Film } from "lucide-react";
import { GENRES, averageRating, formatRating, formatDuration, type Movie, type MovieInput } from "@/lib/types";

export function MoviePoster({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return <img key={src} src={src || "/images/poster-fallback.svg"} alt={alt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" onError={(event) => { const image = event.currentTarget; if (!image.src.endsWith("poster-fallback.svg")) image.src = "/images/poster-fallback.svg"; }} />;
}

function Modal({ children, onClose, className = "", labelledBy }: { children: ReactNode; onClose: () => void; className?: string; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={labelledBy} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><button type="button" className="icon-button modal-close" aria-label="Закрыть окно" onClick={onClose}><X size={20} /></button>{children}</div>
  </dialog>;
}

export function MovieDetails({ movie, onClose, onEdit, onFavorite, onStatus, busy }: { movie: Movie; onClose: () => void; onEdit: () => void; onFavorite: () => void; onStatus: () => void; busy: boolean }) {
  const average = averageRating(movie);
  return <Modal onClose={onClose} className="details-modal" labelledBy="details-title">
    <div className="detail-topline"><span className="eyebrow"><Film size={14} /> ИЗ НАШЕЙ КОЛЛЕКЦИИ</span></div>
    <div className="detail-layout">
      <div className="detail-poster"><MoviePoster src={movie.posterUrl} alt={`Постер фильма «${movie.title}»`} eager /><span className={`poster-status ${movie.status}`} >{movie.status === "watched" ? <Check size={12} /> : <Bookmark size={12} />}{movie.status === "watched" ? "Просмотрен" : "В планах"}</span></div>
      <div className="detail-copy">
        <div className="detail-genres">{movie.genres.map(genre => <span key={genre}>{genre}</span>)}</div>
        <h2 id="details-title">{movie.title}</h2>
        <p className="original-title">{movie.originalTitle || "Новая история в нашей коллекции"}</p>
        <div className="detail-metadata"><span><CalendarDays size={15} />{movie.year}</span><span><Clock3 size={15} />{formatDuration(movie.duration)}</span><span>16+</span></div>
        <p className="detail-description">{movie.description || "У этого фильма пока нет описания. Добавьте его через редактирование — и сохраните то, что важно именно вам."}</p>
        <div className="detail-ratings">
          <div><span className="rating-person"><span className="avatar avatar-adele">А</span>Аделя</span><strong>{formatRating(movie.adeleRating)}<small> / 10</small></strong></div>
          <div><span className="rating-person"><span className="avatar avatar-roma">Р</span>Рома</span><strong>{formatRating(movie.romaRating)}<small> / 10</small></strong></div>
          <div className="our-rating"><span><Star size={14} /> Наша оценка</span><strong>{average === null ? "—" : average.toFixed(1)}<small> / 10</small></strong></div>
        </div>
        <div className="detail-actions"><button className="button button-primary" onClick={onEdit}><Pencil size={16} />Редактировать</button><button className={`button button-secondary favorite-detail ${movie.favorite ? "is-favorite" : ""}`} onClick={onFavorite} disabled={busy}><Heart size={17} fill={movie.favorite ? "currentColor" : "none"} />{movie.favorite ? "В избранном" : "В избранное"}</button></div>
        {movie.status === "planned" && <button className="text-button mark-watched" onClick={onStatus} disabled={busy}><Check size={16} />Уже посмотрели? Отметить просмотренным<ArrowUpRight size={14} /></button>}
      </div>
    </div>
  </Modal>;
}

export function MovieForm({ movie, onClose, onSave, onDelete }: { movie: Movie | null; onClose: () => void; onSave: (input: MovieInput, id?: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [title, setTitle] = useState(movie?.title ?? "");
  const [originalTitle, setOriginalTitle] = useState(movie?.originalTitle ?? "");
  const [year, setYear] = useState(String(movie?.year ?? new Date().getFullYear()));
  const [duration, setDuration] = useState(String(movie?.duration ?? 120));
  const [description, setDescription] = useState(movie?.description ?? "");
  const [posterUrl, setPosterUrl] = useState(movie?.posterUrl ?? "");
  const [genres, setGenres] = useState<string[]>(movie?.genres ?? []);
  const [status, setStatus] = useState<"watched" | "planned">(movie?.status ?? "planned");
  const [adeleRating, setAdeleRating] = useState(movie?.adeleRating === null || movie?.adeleRating === undefined ? "" : String(movie.adeleRating));
  const [romaRating, setRomaRating] = useState(movie?.romaRating === null || movie?.romaRating === undefined ? "" : String(movie.romaRating));
  const [favorite, setFavorite] = useState(movie?.favorite ?? false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!genres.length) { setError("Выберите хотя бы один жанр"); return; }
    setSubmitting(true);
    try {
      await onSave({ title, originalTitle, year: Number(year), duration: Number(duration), description, posterUrl, genres, status, adeleRating: status === "planned" || adeleRating === "" ? null : Number(adeleRating), romaRating: status === "planned" || romaRating === "" ? null : Number(romaRating), favorite }, movie?.id);
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось сохранить фильм"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!movie) return;
    setSubmitting(true);
    setError("");
    try { await onDelete(movie.id); }
    catch (error) { setError(error instanceof Error ? error.message : "Не удалось удалить фильм"); setSubmitting(false); }
  }

  return <Modal onClose={() => { if (!submitting) onClose(); }} className="edit-modal" labelledBy="form-title">
    <div className="form-heading"><span className="eyebrow">ЕЩЁ ОДНА ИСТОРИЯ</span><h2 id="form-title">{movie ? "Редактировать фильм" : "Добавить фильм"}</h2><p>{movie ? "Детали меняются. Впечатления остаются." : "Что будем смотреть в следующий раз?"}</p></div>
    <form onSubmit={handleSubmit}>
      <fieldset disabled={submitting}>
        <div className="form-intro-grid">
          <div className="poster-preview"><MoviePoster src={posterUrl} alt="Предпросмотр постера" /><span><ImagePlus size={17} />Постер фильма</span></div>
          <div className="form-basics">
            <label className="field">Название <span className="required">*</span><input value={title} onChange={event => setTitle(event.target.value)} required maxLength={200} placeholder="Например, Интерстеллар" autoFocus /></label>
            <label className="field">Оригинальное название<input value={originalTitle} onChange={event => setOriginalTitle(event.target.value)} maxLength={200} placeholder="Interstellar" /></label>
            <div className="form-two-columns"><label className="field">Год <span className="required">*</span><input type="number" min="1888" max="2100" required value={year} onChange={event => setYear(event.target.value)} /></label><label className="field">Длительность, мин<input type="number" min="1" max="1000" required value={duration} onChange={event => setDuration(event.target.value)} /></label></div>
          </div>
        </div>
        <label className="field poster-link">Ссылка на постер<input value={posterUrl} onChange={event => setPosterUrl(event.target.value)} maxLength={2000} placeholder="https://example.com/poster.jpg" /><small>Необязательно — без ссылки появится наш фирменный постер.</small></label>
        <div className="field">Жанры <span className="required">*</span><div className="genre-picker">{[...new Set([...GENRES, ...genres])].map(genre => <button type="button" key={genre} className={genres.includes(genre) ? "selected" : ""} onClick={() => setGenres(previous => previous.includes(genre) ? previous.filter(item => item !== genre) : previous.length < 8 ? [...previous, genre] : previous)}>{genres.includes(genre) && <Check size={12} />}{genre}</button>)}</div></div>
        <label className="field">Краткое описание<textarea rows={3} maxLength={3000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Пара слов о сюжете — без спойлеров" /></label>
        <div className="form-two-columns form-status-row"><div className="field">Статус<div className="segmented status-segmented"><button type="button" className={status === "planned" ? "selected" : ""} onClick={() => setStatus("planned")}><Bookmark size={14} />В планах</button><button type="button" className={status === "watched" ? "selected" : ""} onClick={() => setStatus("watched")}><Check size={14} />Просмотрен</button></div></div><label className="favorite-checkbox"><input type="checkbox" checked={favorite} onChange={event => setFavorite(event.target.checked)} /><Heart size={17} />В избранное</label></div>
        {status === "watched" && <div className="form-two-columns form-rating-row"><label className="field"><span className="rating-person"><span className="avatar avatar-adele">А</span>Оценка Адели</span><div className="rating-input"><Star size={16} /><input type="number" min="0" max="10" step="0.5" value={adeleRating} onChange={event => setAdeleRating(event.target.value)} placeholder="—" /><span>/ 10</span></div></label><label className="field"><span className="rating-person"><span className="avatar avatar-roma">Р</span>Оценка Ромы</span><div className="rating-input"><Star size={16} /><input type="number" min="0" max="10" step="0.5" value={romaRating} onChange={event => setRomaRating(event.target.value)} placeholder="—" /><span>/ 10</span></div></label></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {confirmDelete && <div className="delete-confirm" role="alert"><p>Удалить «{movie?.title}» из коллекции? Оценки тоже будут удалены.</p><button type="button" className="button button-danger" onClick={handleDelete}>Да, удалить</button><button type="button" className="text-button" onClick={() => setConfirmDelete(false)}>Оставить фильм</button></div>}
        <div className="form-footer">{movie && <button type="button" className="delete-button" onClick={() => setConfirmDelete(true)} aria-label="Удалить фильм"><Trash2 size={17} /><span>Удалить</span></button>}<div className="form-footer-actions"><button type="button" className="button button-secondary" onClick={onClose}>Отмена</button><button type="submit" className="button button-primary">{submitting ? <LoaderCircle size={17} className="spinning" /> : <Check size={17} />}{movie ? "Сохранить изменения" : "Добавить фильм"}</button></div></div>
      </fieldset>
    </form>
  </Modal>;
}
