import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// ──────────────────────────────────────────────────────────
// events 테이블
// data JSON 예시: { status, date, session, subtitle, venue, district, coords, capacity, sound, ... }
// 필드 추가/삭제 시 마이그레이션 불필요
// ──────────────────────────────────────────────────────────
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),  // 예) "TRM-02"
  data: text("data").notNull(), // JSON string
});

// ──────────────────────────────────────────────────────────
// artists 테이블
// data JSON 예시: { name, origin, dock, time, status, ... }
// ──────────────────────────────────────────────────────────
export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(), // 예) "02-A"
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  data: text("data").notNull(), // JSON string
});

// ──────────────────────────────────────────────────────────
// transmit_logs 테이블 (구조 고정 — 변경 없음)
// ──────────────────────────────────────────────────────────
export const transmitLogs = sqliteTable("transmit_logs", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull(),
  message: text("message").notNull(),
  ts: text("ts").notNull(),
  createdAt: text("created_at").notNull(),
});

// 타입 추론
export type EventRow = typeof events.$inferSelect;
export type ArtistRow = typeof artists.$inferSelect;
export type TransmitLog = typeof transmitLogs.$inferSelect;
export type NewTransmitLog = typeof transmitLogs.$inferInsert;
