import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const movies = pgTable("movies", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  originalTitle: text("original_title").notNull().default(""),
  year: integer("year").notNull(),
  duration: integer("duration").notNull().default(120),
  genres: text("genres").array().notNull(),
  description: text("description").notNull().default(""),
  posterUrl: text("poster_url").notNull().default("/images/poster-fallback.svg"),
  status: text("status").$type<"watched" | "planned">().notNull().default("planned"),
  adeleRating: real("adele_rating"),
  romaRating: real("roma_rating"),
  favorite: boolean("favorite").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
