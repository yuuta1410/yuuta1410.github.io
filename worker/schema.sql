CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  role_en TEXT NOT NULL,
  role_vi TEXT NOT NULL,
  headline_en TEXT NOT NULL,
  headline_vi TEXT NOT NULL,
  bio_en TEXT NOT NULL,
  bio_vi TEXT NOT NULL,
  email TEXT NOT NULL,
  discord TEXT NOT NULL,
  phone TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  tags_en TEXT NOT NULL,
  tags_vi TEXT NOT NULL,
  category TEXT NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  published INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_codes (
  code_hash TEXT PRIMARY KEY,
  github_user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_projects_category_published_sort
  ON projects(category, published, sort_order);
CREATE INDEX IF NOT EXISTS idx_social_enabled_sort
  ON social_links(enabled, sort_order);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expiry
  ON oauth_codes(expires_at);
