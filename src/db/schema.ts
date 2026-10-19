import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

// Tabla de Perfiles (Tú y Tu Pareja)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  spendingLimit: numeric("spending_limit", { precision: 10, scale: 2 }).notNull().default("2000.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabla de Gastos acumulados
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  profileId: serial("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
  concept: text("concept").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});