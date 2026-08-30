import type {
  PortfolioContent,
  Project,
  SiteSettings,
  SocialLink,
} from '@/lib/types';

let initialized = false;

async function database(): Promise<D1Database> {
  const moduleName = 'cloudflare:' + 'workers';
  const workers = (await import(/* @vite-ignore */ moduleName)) as {
    env: Cloudflare.Env;
  };
  if (!workers.env.DB) throw new Error('Portfolio database is unavailable');
  return workers.env.DB;
}

const defaultSettings: SiteSettings = {
  name: 'Võ Gia Huy',
  stageName: 'Yuuta',
  roleEn: 'Motion Designer',
  roleVi: 'Thiết kế chuyển động',
  headlineEn: 'I turn ideas into motion that sticks.',
  headlineVi: 'Tôi biến ý tưởng thành chuyển động đọng lại trong tâm trí.',
  bioEn:
    'I am Võ Gia Huy, also known as Yuuta — a motion designer based in Vietnam. I create energetic motion systems, anime-inspired music visuals and AI-powered commercial stories.',
  bioVi:
    'Tôi là Võ Gia Huy, nghệ danh Yuuta — Motion Designer tại Việt Nam. Tôi sáng tạo hệ thống motion giàu năng lượng, hình ảnh âm nhạc lấy cảm hứng từ anime và video quảng cáo bằng AI.',
  email: 'vogiahuy141003@gmail.com',
  discord: 'yuuta_1410',
  phone: '0866406341',
};

const defaultSocials: SocialLink[] = [
  {
    id: 'gmail',
    platform: 'gmail',
    label: 'Gmail',
    url: 'mailto:vogiahuy141003@gmail.com',
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'zalo',
    platform: 'zalo',
    label: 'Zalo',
    url: 'https://zalo.me/0866406341',
    enabled: true,
    sortOrder: 2,
  },
  {
    id: 'whatsapp',
    platform: 'whatsapp',
    label: 'WhatsApp',
    url: 'https://wa.me/84866406341',
    enabled: true,
    sortOrder: 3,
  },
  {
    id: 'youtube',
    platform: 'youtube',
    label: 'YouTube',
    url: '',
    enabled: false,
    sortOrder: 4,
  },
  {
    id: 'tiktok',
    platform: 'tiktok',
    label: 'TikTok',
    url: '',
    enabled: false,
    sortOrder: 5,
  },
  {
    id: 'instagram',
    platform: 'instagram',
    label: 'Instagram',
    url: '',
    enabled: false,
    sortOrder: 6,
  },
  {
    id: 'payhip',
    platform: 'payhip',
    label: 'Payhip',
    url: '',
    enabled: false,
    sortOrder: 7,
  },
  {
    id: 'discord',
    platform: 'discord',
    label: 'Discord',
    url: '',
    enabled: false,
    sortOrder: 8,
  },
  {
    id: 'threads',
    platform: 'threads',
    label: 'Threads',
    url: '',
    enabled: false,
    sortOrder: 9,
  },
  {
    id: 'douyin',
    platform: 'douyin',
    label: 'Douyin',
    url: '',
    enabled: false,
    sortOrder: 10,
  },
  {
    id: 'bilibili',
    platform: 'bilibili',
    label: 'Bilibili',
    url: '',
    enabled: false,
    sortOrder: 11,
  },
  {
    id: 'x',
    platform: 'x',
    label: 'X',
    url: '',
    enabled: false,
    sortOrder: 12,
  },
];

export async function ensureDatabase() {
  if (initialized) return;
  const db = await database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, stage_name TEXT NOT NULL,
      role_en TEXT NOT NULL, role_vi TEXT NOT NULL, headline_en TEXT NOT NULL,
      headline_vi TEXT NOT NULL, bio_en TEXT NOT NULL, bio_vi TEXT NOT NULL,
      email TEXT NOT NULL, discord TEXT NOT NULL, phone TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, title_en TEXT NOT NULL, title_vi TEXT NOT NULL,
      description_en TEXT NOT NULL, description_vi TEXT NOT NULL, tags_en TEXT NOT NULL,
      tags_vi TEXT NOT NULL, category TEXT NOT NULL, video_url TEXT NOT NULL,
      platform TEXT NOT NULL, thumbnail_url TEXT NOT NULL, sort_order INTEGER NOT NULL,
      published INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS social_links (
      id TEXT PRIMARY KEY, platform TEXT NOT NULL, label TEXT NOT NULL,
      url TEXT NOT NULL, enabled INTEGER NOT NULL, sort_order INTEGER NOT NULL
    )`),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_projects_category_published_sort ON projects(category, published, sort_order)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_social_enabled_sort ON social_links(enabled, sort_order)',
    ),
  ]);

  const now = new Date().toISOString();
  await db
    .prepare(`INSERT OR IGNORE INTO site_settings (
    id, name, stage_name, role_en, role_vi, headline_en, headline_vi, bio_en, bio_vi,
    email, discord, phone, updated_at
  ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      defaultSettings.name,
      defaultSettings.stageName,
      defaultSettings.roleEn,
      defaultSettings.roleVi,
      defaultSettings.headlineEn,
      defaultSettings.headlineVi,
      defaultSettings.bioEn,
      defaultSettings.bioVi,
      defaultSettings.email,
      defaultSettings.discord,
      defaultSettings.phone,
      now,
    )
    .run();

  await db
    .prepare(`UPDATE site_settings SET
    role_en = ?, role_vi = ?, bio_en = ?, bio_vi = ?, updated_at = ?
    WHERE id = 1
      AND role_en = 'Motion Designer · Video Editor'
      AND role_vi = 'Thiết kế chuyển động · Dựng phim'
  `)
    .bind(
      defaultSettings.roleEn,
      defaultSettings.roleVi,
      defaultSettings.bioEn,
      defaultSettings.bioVi,
      now,
    )
    .run();

  await db
    .prepare(`UPDATE site_settings SET
    headline_en = ?, updated_at = ?
    WHERE id = 1
      AND headline_en = 'I turn ideas into motion people remember.'
  `)
    .bind(defaultSettings.headlineEn, now)
    .run();

  await db
    .prepare(`UPDATE site_settings SET
    headline_vi = ?, updated_at = ?
    WHERE id = 1
      AND headline_vi = 'Tôi biến ý tưởng thành chuyển động đáng nhớ.'
  `)
    .bind(defaultSettings.headlineVi, now)
    .run();

  const socialCount = await db
    .prepare('SELECT COUNT(*) AS count FROM social_links')
    .first<{ count: number }>();
  if (!socialCount?.count) {
    await db.batch(
      defaultSocials.map((social) =>
        db
          .prepare(
            'INSERT INTO social_links (id, platform, label, url, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(
            social.id,
            social.platform,
            social.label,
            social.url,
            social.enabled ? 1 : 0,
            social.sortOrder,
          ),
      ),
    );
  }
  await db.prepare('PRAGMA optimize').run();
  initialized = true;
}

type SettingsRow = Record<string, string | number>;
type ProjectRow = Record<string, string | number>;
type SocialRow = Record<string, string | number>;

function mapSettings(row?: SettingsRow): SiteSettings {
  if (!row) return defaultSettings;
  return {
    name: String(row.name),
    stageName: String(row.stage_name),
    roleEn: String(row.role_en),
    roleVi: String(row.role_vi),
    headlineEn: String(row.headline_en),
    headlineVi: String(row.headline_vi),
    bioEn: String(row.bio_en),
    bioVi: String(row.bio_vi),
    email: String(row.email),
    discord: String(row.discord),
    phone: String(row.phone),
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: String(row.id),
    titleEn: String(row.title_en),
    titleVi: String(row.title_vi),
    descriptionEn: String(row.description_en),
    descriptionVi: String(row.description_vi),
    tagsEn: String(row.tags_en),
    tagsVi: String(row.tags_vi),
    category: String(row.category) as Project['category'],
    videoUrl: String(row.video_url),
    platform: String(row.platform) as Project['platform'],
    thumbnailUrl: String(row.thumbnail_url),
    sortOrder: Number(row.sort_order),
    published: Boolean(row.published),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSocial(row: SocialRow): SocialLink {
  return {
    id: String(row.id),
    platform: String(row.platform),
    label: String(row.label),
    url: String(row.url),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
  };
}

export async function getPortfolioContent(
  includeUnpublished = false,
): Promise<PortfolioContent> {
  await ensureDatabase();
  const db = await database();
  const [settingsResult, projectResult, socialResult] = await Promise.all([
    db.prepare('SELECT * FROM site_settings WHERE id = 1').all<SettingsRow>(),
    db
      .prepare(
        `SELECT * FROM projects ${includeUnpublished ? '' : 'WHERE published = 1'} ORDER BY sort_order ASC, created_at DESC`,
      )
      .all<ProjectRow>(),
    db
      .prepare(
        `SELECT * FROM social_links ${includeUnpublished ? '' : "WHERE enabled = 1 AND url != ''"} ORDER BY sort_order ASC`,
      )
      .all<SocialRow>(),
  ]);
  return {
    settings: mapSettings(settingsResult.results[0]),
    projects: projectResult.results.map(mapProject),
    socials: socialResult.results.map(mapSocial),
  };
}

export async function saveSettings(settings: SiteSettings) {
  await ensureDatabase();
  const db = await database();
  await db
    .prepare(
      `UPDATE site_settings SET name=?, stage_name=?, role_en=?, role_vi=?, headline_en=?, headline_vi=?, bio_en=?, bio_vi=?, email=?, discord=?, phone=?, updated_at=? WHERE id=1`,
    )
    .bind(
      settings.name,
      settings.stageName,
      settings.roleEn,
      settings.roleVi,
      settings.headlineEn,
      settings.headlineVi,
      settings.bioEn,
      settings.bioVi,
      settings.email,
      settings.discord,
      settings.phone,
      new Date().toISOString(),
    )
    .run();
}

export async function upsertProject(project: Project) {
  await ensureDatabase();
  const db = await database();
  await db
    .prepare(`INSERT INTO projects (
    id, title_en, title_vi, description_en, description_vi, tags_en, tags_vi, category,
    video_url, platform, thumbnail_url, sort_order, published, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET title_en=excluded.title_en, title_vi=excluded.title_vi,
    description_en=excluded.description_en, description_vi=excluded.description_vi,
    tags_en=excluded.tags_en, tags_vi=excluded.tags_vi, category=excluded.category,
    video_url=excluded.video_url, platform=excluded.platform, thumbnail_url=excluded.thumbnail_url,
    sort_order=excluded.sort_order, published=excluded.published, updated_at=excluded.updated_at`)
    .bind(
      project.id,
      project.titleEn,
      project.titleVi,
      project.descriptionEn,
      project.descriptionVi,
      project.tagsEn,
      project.tagsVi,
      project.category,
      project.videoUrl,
      project.platform,
      project.thumbnailUrl,
      project.sortOrder,
      project.published ? 1 : 0,
      project.createdAt,
      project.updatedAt,
    )
    .run();
}

export async function deleteProject(id: string) {
  await ensureDatabase();
  const db = await database();
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
}

export async function saveSocialLinks(socials: SocialLink[]) {
  await ensureDatabase();
  const db = await database();
  const upserts = socials.map((social) =>
    db
      .prepare(`
    INSERT INTO social_links (id, platform, label, url, enabled, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      platform=excluded.platform, label=excluded.label, url=excluded.url,
      enabled=excluded.enabled, sort_order=excluded.sort_order
  `)
      .bind(
        social.id,
        social.platform,
        social.label,
        social.url,
        social.enabled ? 1 : 0,
        social.sortOrder,
      ),
  );
  const removeMissing = socials.length
    ? db
        .prepare(
          `DELETE FROM social_links WHERE id NOT IN (${socials.map(() => '?').join(', ')})`,
        )
        .bind(...socials.map((social) => social.id))
    : db.prepare('DELETE FROM social_links');
  await db.batch([...upserts, removeMissing]);
}
