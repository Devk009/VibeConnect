import {
  pgTable,
  text,
  varchar,
  serial,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  caption: text("caption").notNull(),
  imageUrl: text("image_url").notNull(),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  caption: true,
  imageUrl: true,
  location: true,
});

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect & {
  user: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments?: Comment[];
};

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  postId: true,
  content: true,
});

export type InsertComment = typeof comments.$inferInsert;
export type Comment = typeof comments.$inferSelect & {
  user: User;
};

// Likes table
export const likes = pgTable("likes", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey(t.userId, t.postId),
}));

export type Like = typeof likes.$inferSelect;

// Saves table
export const saves = pgTable("saves", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey(t.userId, t.postId),
}));

export type Save = typeof saves.$inferSelect;

// Follows table
export const follows = pgTable("follows", {
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  pk: primaryKey(t.followerId, t.followingId),
}));

export type Follow = typeof follows.$inferSelect;

// Type definitions for virtual entities (not stored in database)
export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  hasViewed: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'tag' | 'trending';
  message: string;
  actor: User & { isFollowing: boolean };
  postId?: string;
  postImageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HashtagTrending {
  id: string;
  name: string;
  postsCount: number;
  previewImages: string[];
}
