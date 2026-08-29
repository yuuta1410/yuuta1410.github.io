import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey(), name: text('name').notNull(), stageName: text('stage_name').notNull(),
  roleEn: text('role_en').notNull(), roleVi: text('role_vi').notNull(), headlineEn: text('headline_en').notNull(),
  headlineVi: text('headline_vi').notNull(), bioEn: text('bio_en').notNull(), bioVi: text('bio_vi').notNull(),
  email: text('email').notNull(), discord: text('discord').notNull(), phone: text('phone').notNull(), updatedAt: text('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), titleEn: text('title_en').notNull(), titleVi: text('title_vi').notNull(),
  descriptionEn: text('description_en').notNull(), descriptionVi: text('description_vi').notNull(),
  tagsEn: text('tags_en').notNull(), tagsVi: text('tags_vi').notNull(), category: text('category').notNull(),
  videoUrl: text('video_url').notNull(), platform: text('platform').notNull(), thumbnailUrl: text('thumbnail_url').notNull(),
  sortOrder: integer('sort_order').notNull(), published: integer('published', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [index('idx_projects_category_published_sort').on(table.category, table.published, table.sortOrder)]);

export const socialLinks = sqliteTable('social_links', {
  id: text('id').primaryKey(), platform: text('platform').notNull(), label: text('label').notNull(),
  url: text('url').notNull(), enabled: integer('enabled', { mode: 'boolean' }).notNull(), sortOrder: integer('sort_order').notNull(),
}, (table) => [index('idx_social_enabled_sort').on(table.enabled, table.sortOrder)]);
