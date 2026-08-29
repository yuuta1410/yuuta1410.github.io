CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title_en` text NOT NULL,
	`title_vi` text NOT NULL,
	`description_en` text NOT NULL,
	`description_vi` text NOT NULL,
	`tags_en` text NOT NULL,
	`tags_vi` text NOT NULL,
	`category` text NOT NULL,
	`video_url` text NOT NULL,
	`platform` text NOT NULL,
	`thumbnail_url` text NOT NULL,
	`sort_order` integer NOT NULL,
	`published` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_projects_category_published_sort` ON `projects` (`category`,`published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stage_name` text NOT NULL,
	`role_en` text NOT NULL,
	`role_vi` text NOT NULL,
	`headline_en` text NOT NULL,
	`headline_vi` text NOT NULL,
	`bio_en` text NOT NULL,
	`bio_vi` text NOT NULL,
	`email` text NOT NULL,
	`discord` text NOT NULL,
	`phone` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`enabled` integer NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_social_enabled_sort` ON `social_links` (`enabled`,`sort_order`);