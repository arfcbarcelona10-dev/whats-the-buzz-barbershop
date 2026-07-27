import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  manageToken: text("manage_token").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  notes: text("notes").notNull().default(""),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull().default("confirmed"),
  source: text("source").notNull().default("online"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const scheduleBlocks = sqliteTable("schedule_blocks", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  label: text("label").notNull(),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const ownerSessions = sqliteTable("owner_sessions", {
  token: text("token").primaryKey(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});
