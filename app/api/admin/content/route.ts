import { deleteProject, getPortfolioContent, saveSettings, saveSocialLinks, upsertProject } from '@/db/content';
import { isAdminRequest } from '@/lib/admin-auth';
import type { Category, Project, SiteSettings, SocialLink } from '@/lib/types';
import { parseVideoUrl } from '@/lib/video';

const categories: Category[] = ['MOTION', 'MV EDIT', 'AI VIDEO'];

function text(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function number(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function safeLink(value: unknown, allowEmpty = true): string {
  const raw = text(value, 1000);
  if (!raw && allowEmpty) return '';
  try {
    const url = new URL(raw);
    if (['https:', 'mailto:', 'tel:'].includes(url.protocol)) return raw;
  } catch { /* invalid URL */ }
  throw new Error('Invalid link');
}

function safeHttpsLink(value: unknown, allowEmpty = true): string {
  const raw = text(value, 1000);
  if (!raw && allowEmpty) return '';
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') return raw;
  } catch { /* invalid URL */ }
  throw new Error('Use a secure HTTPS link');
}

function settingsFrom(value: unknown): SiteSettings {
  const input = (value ?? {}) as Record<string, unknown>;
  const result: SiteSettings = {
    name: text(input.name, 100), stageName: text(input.stageName, 100),
    roleEn: text(input.roleEn, 160), roleVi: text(input.roleVi, 160),
    headlineEn: text(input.headlineEn, 240), headlineVi: text(input.headlineVi, 240),
    bioEn: text(input.bioEn, 3000), bioVi: text(input.bioVi, 3000),
    email: text(input.email, 200), discord: text(input.discord, 100), phone: text(input.phone, 40),
  };
  if (!result.name || !result.stageName || !result.headlineEn || !result.headlineVi || !result.email) throw new Error('Please complete all required profile fields');
  return result;
}

function projectFrom(value: unknown): Project {
  const input = (value ?? {}) as Record<string, unknown>;
  const videoUrl = safeHttpsLink(input.videoUrl, false);
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) throw new Error('Use a valid YouTube, Vimeo, TikTok or Instagram video link');
  const category = text(input.category, 30) as Category;
  if (!categories.includes(category)) throw new Error('Invalid category');
  const titleEn = text(input.titleEn, 240);
  const titleVi = text(input.titleVi, 240);
  if (!titleEn || !titleVi) throw new Error('English and Vietnamese titles are required');
  const now = new Date().toISOString();
  const customThumbnail = text(input.thumbnailUrl, 1000);
  return {
    id: text(input.id, 100) || crypto.randomUUID(), titleEn, titleVi,
    descriptionEn: text(input.descriptionEn, 3000), descriptionVi: text(input.descriptionVi, 3000),
    tagsEn: text(input.tagsEn, 500), tagsVi: text(input.tagsVi, 500), category, videoUrl,
    platform: parsed.platform, thumbnailUrl: customThumbnail ? safeHttpsLink(customThumbnail, false) : parsed.thumbnailUrl,
    sortOrder: number(input.sortOrder), published: Boolean(input.published),
    createdAt: text(input.createdAt, 100) || now, updatedAt: now,
  };
}

function socialsFrom(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) throw new Error('Invalid social links');
  return value.slice(0, 30).map((item, index) => {
    const input = (item ?? {}) as Record<string, unknown>;
    return {
      id: text(input.id, 80), platform: text(input.platform, 80), label: text(input.label, 100),
      url: safeLink(input.url), enabled: Boolean(input.enabled) && Boolean(text(input.url)), sortOrder: number(input.sortOrder, index + 1),
    };
  }).filter((item) => item.id && item.platform && item.label);
}

export async function GET() {
  if (!(await isAdminRequest())) return Response.json({ error: 'Unauthorized' }, { status: 403 });
  return Response.json(await getPortfolioContent(true));
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return Response.json({ error: 'Unauthorized' }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action, 50);
    if (action === 'save-settings') await saveSettings(settingsFrom(body.settings));
    else if (action === 'save-project') await upsertProject(projectFrom(body.project));
    else if (action === 'delete-project') {
      const id = text(body.id, 100);
      if (!id) throw new Error('Project id is required');
      await deleteProject(id);
    } else if (action === 'save-socials') await saveSocialLinks(socialsFrom(body.socials));
    else throw new Error('Unknown action');
    return Response.json({ ok: true, content: await getPortfolioContent(true) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save changes';
    return Response.json({ error: message }, { status: 400 });
  }
}
