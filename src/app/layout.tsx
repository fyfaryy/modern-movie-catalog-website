import type { Metadata } from "next";
import { createElement, type ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "кадр",
  description: "Фильмы — в одном месте.",
  applicationName: "кадр.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return createElement(
    "html",
    { lang: "ru", "data-theme": "dark", suppressHydrationWarning: true },
    createElement(
      "head",
      null,
      createElement("style", {
        dangerouslySetInnerHTML: {
          __html:
            "@font-face{font-family:Manrope;src:url('/fonts/Manrope-Variable.ttf') format('truetype');font-weight:200 800;font-display:swap}:root{--font-manrope:Manrope}",
        },
      }),
      createElement("script", {
        dangerouslySetInnerHTML: {
          __html:
            "try{document.documentElement.dataset.theme=localStorage.getItem('kadr-theme')==='light'?'light':'dark'}catch(e){}",
        },
      }),
    ),
    createElement("body", { className: "antialiased" }, children),
  );
}
