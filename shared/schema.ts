import { sql } from "drizzle-orm";
import { pgTable, text, varchar, bigint, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Engagement metrics structure
export const engagementMetricsSchema = z.object({
  comments: z.number().nullable(),
  likes: z.number().nullable(),
  shares: z.number().nullable(),
});

// Sentiment analysis structure
export const sentimentAnalysisSchema = z.object({
  overall_sentiment: z.number().min(-1).max(1), // -1 (negative) to 1 (positive)
  sentiment_score: z.number().min(0).max(1), // confidence score
  categories: z.object({
    ease_of_booking: z.number().min(-1).max(1).nullable(),
    check_in: z.number().min(-1).max(1).nullable(),
    luggage_handling: z.number().min(-1).max(1).nullable(),
    security: z.number().min(-1).max(1).nullable(),
    lounge: z.number().min(-1).max(1).nullable(),
    amenities: z.number().min(-1).max(1).nullable(),
    communication: z.number().min(-1).max(1).nullable(),
  }),
});

// Social media events table following the specified schema
export const socialEvents = pgTable("social_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  author_id: text("author_id"),
  author_name: text("author_name"),
  clean_event_text: text("clean_event_text"),
  engagement_metrics: json("engagement_metrics").$type<z.infer<typeof engagementMetricsSchema>>(),
  event_content: text("event_content"),
  event_id: text("event_id"),
  event_title: text("event_title"),
  event_url: text("event_url"),
  parent_event_id: text("parent_event_id"),
  platform: text("platform"),
  timestamp_utc: text("timestamp_utc"),
  sentiment_analysis: json("sentiment_analysis").$type<z.infer<typeof sentimentAnalysisSchema>>(),
  location_focus: text("location_focus"), // e.g., "bangalore_airport"
  airline_mentioned: text("airline_mentioned"), // e.g., "indigo", "spicejet"
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSocialEventSchema = createInsertSchema(socialEvents).omit({
  id: true,
  created_at: true,
});

export type InsertSocialEvent = z.infer<typeof insertSocialEventSchema>;
export type SocialEvent = typeof socialEvents.$inferSelect;

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  platform_connections: json("platform_connections").$type<Record<string, boolean>>(),
  data_retention_days: bigint("data_retention_days", { mode: "number" }).default(90),
  real_time_collection: text("real_time_collection").default("true"),
  auto_cleanup: text("auto_cleanup").default("true"),
  email_reports: text("email_reports").default("true"),
  alert_notifications: text("alert_notifications").default("false"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  created_at: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Data source credentials schema
export const dataSourceCredentialsSchema = z.object({
  // Social Media
  twitter_bearer_token: z.string().optional(),
  reddit_client_id: z.string().optional(),
  reddit_client_secret: z.string().optional(),
  facebook_access_token: z.string().optional(),
  youtube_api_key: z.string().optional(),
  instagram_access_token: z.string().optional(),
  vimeo_access_token: z.string().optional(),
  tiktok_access_token: z.string().optional(),
  tumblr_consumer_key: z.string().optional(),
  tumblr_consumer_secret: z.string().optional(),
  
  // News Sources (API keys or RSS feeds)
  cnn_api_key: z.string().optional(),
  aajtak_rss_url: z.string().optional(),
  wion_rss_url: z.string().optional(),
  zee_news_rss_url: z.string().optional(),
  ndtv_rss_url: z.string().optional(),
  inshorts_api_key: z.string().optional(),
});

export type DataSourceCredentials = z.infer<typeof dataSourceCredentialsSchema>;

// Data source configuration
// User management schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("viewer"), // "super_admin", "admin", "editor", "viewer"
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const dataSources = {
  socialMedia: [
    { name: 'Twitter', key: 'twitter', icon: 'twitter', credentialFields: ['twitter_bearer_token'] },
    { name: 'Reddit', key: 'reddit', icon: 'reddit', credentialFields: ['reddit_client_id', 'reddit_client_secret'] },
    { name: 'Facebook', key: 'facebook', icon: 'facebook', credentialFields: ['facebook_access_token'] },
    { name: 'YouTube', key: 'youtube', icon: 'youtube', credentialFields: ['youtube_api_key'] },
    { name: 'Instagram', key: 'instagram', icon: 'instagram', credentialFields: ['instagram_access_token'] },
    { name: 'Vimeo', key: 'vimeo', icon: 'vimeo', credentialFields: ['vimeo_access_token'] },
    { name: 'TikTok', key: 'tiktok', icon: 'tiktok', credentialFields: ['tiktok_access_token'] },
    { name: 'Tumblr', key: 'tumblr', icon: 'tumblr', credentialFields: ['tumblr_consumer_key', 'tumblr_consumer_secret'] },
  ],
  news: [
    { name: 'CNN', key: 'cnn', icon: 'cnn', credentialFields: ['cnn_api_key'] },
    { name: 'AajTak', key: 'aajtak', icon: 'news', credentialFields: ['aajtak_rss_url'] },
    { name: 'WION', key: 'wion', icon: 'news', credentialFields: ['wion_rss_url'] },
    { name: 'Zee News', key: 'zee_news', icon: 'news', credentialFields: ['zee_news_rss_url'] },
    { name: 'NDTV', key: 'ndtv', icon: 'news', credentialFields: ['ndtv_rss_url'] },
    { name: 'Inshorts', key: 'inshorts', icon: 'news', credentialFields: ['inshorts_api_key'] },
  ]
};
