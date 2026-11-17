"use client";

import { Clapperboard, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}><section className="empty-state" style={{ maxWidth: 560, width: "100%" }}><span className="empty-icon"><Clapperboard size={35} /></span><h1 style={{ fontSize: 28 }}>Небольшой перерыв</h1><p style={{ marginTop: 14 }}>Не удалось загрузить фильмотеку. Ваши фильмы и оценки<br />остаются в сохранности — попробуйте ещё раз.</p><button className="button button-primary" onClick={reset}><RotateCcw size={15} />Вернуться к кино</button></section></main>;
}
