import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id'),
    type: text('type').notNull(), // 'SYSTEM' | 'DEVICE' | 'DISCOVERY' | 'SECURITY' | 'DEPLOYMENT'
    category: text('category').notNull().default('SYSTEM'), // 'ALL' | 'ALERTS' | 'SYSTEM'
    title: text('title').notNull(),
    description: text('description').notNull(),
    severity: text('severity').notNull().default('INFO'), // 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
    href: text('href'),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    dismissed: integer('dismissed', { mode: 'boolean' }).notNull().default(false),
    dismissedAt: integer('dismissed_at', { mode: 'timestamp_ms' }),
    sourceEventId: text('source_event_id'),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId),
    index('notifications_created_idx').on(t.createdAt),
    index('notifications_read_idx').on(t.read),
    index('notifications_dismissed_idx').on(t.dismissed),
    index('notifications_category_idx').on(t.category),
    index('notifications_source_idx').on(t.sourceEventId),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationCategory = 'ALL' | 'ALERTS' | 'SYSTEM';
