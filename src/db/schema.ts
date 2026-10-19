import { pgTable, serial, text, decimal, timestamp, integer } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  spendingLimit: decimal("spending_limit", { precision: 10, scale: 2 }).notNull().default("2000.00"),
  pin: text("pin").notNull().default("1234"), // Nuevo campo para el PIN (por defecto 1234 para empezar)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  concept: text("concept").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});