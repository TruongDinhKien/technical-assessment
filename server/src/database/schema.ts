import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const feedback = pgTable("feedback", {
  postId: integer('post_id').notNull(),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  body: text('body').notNull(),
});
