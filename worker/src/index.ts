import type {
  Category,
  PortfolioContent,
  Project,
  SiteSettings,
  SocialLink,
} from '../../lib/types';
import { normalizeSocialPlatform, socialLinkError } from '../../lib/socials';
import { parseVideoUrl } from '../../lib/video';

interface Env {
  DB: D1Database;
  MEDIA: KVNamespace;
  FRONTEND_ORIGIN: string;
  OWNER_GITHUB_ID: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_SECRET: string;
}

type Row = Record<string, string | number>;
type JsonRecord = Record<string, unknown>;

const encoder = new TextEncoder();
const categories: Category[] = [
  'Motion Graphics',
  'AMV / MMV',
  'Music Video',
  'Other',
];
const maxThumbnailSize = 10 * 1024 * 1024;

function securityHeaders(headers = new Headers()): Headers {
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  return headers;
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = securityHeaders();
  if (request.headers.get('origin') === env.FRONTEND_ORIGIN) {
    headers.set('access-control-allow-origin', env.FRONTEND_ORIGIN);
    headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
    headers.set('access-control-allow-headers', 'authorization, content-type');
    headers.set('access-control-max-age', '86400');
    headers.set('vary', 'Origin');
  }
  return headers;
}

function json(
  request: Request,
  env: Env,
  value: unknown,
  status = 200,
  cacheControl = 'no-store',
): Response {
  const headers = corsHeaders(request, env);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', cacheControl);
  return new Response(JSON.stringify(value), { status, headers });
}

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
  } catch {
    // Invalid URL handled below.
  }
  throw new Error('Invalid link');
}

function safeHttpsLink(value: unknown, allowEmpty = true): string {
  const raw = text(value, 1000);
  if (!raw && allowEmpty) return '';
  try {
    if (new URL(raw).protocol === 'https:') return raw;
  } catch {
    // Invalid URL handled below.
  }
  throw new Error('Use a secure HTTPS link');
}

function safeThumbnailLink(value: unknown, fallback: string): string {
  const raw = text(value, 1000);
  if (!raw) return fallback;
  if (/^\/media\/thumbnails\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(raw))
    return raw;
  return safeHttpsLink(raw, false);
}

function mapCategory(value: unknown): Category {
  const stored =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  if (stored === 'MOTION') return 'Motion Graphics';
  if (stored === 'MV EDIT') return 'AMV / MMV';
  if (stored === 'AI VIDEO') return 'Other';
  return categories.includes(stored as Category) ? (stored as Category) : 'Other';
}

function mapSettings(row: Row): SiteSettings {
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

function mapProject(row: Row): Project {
  return {
    id: String(row.id),
    titleEn: String(row.title_en),
    titleVi: String(row.title_vi),
    descriptionEn: String(row.description_en),
    descriptionVi: String(row.description_vi),
    tagsEn: String(row.tags_en),
    tagsVi: String(row.tags_vi),
    category: mapCategory(row.category),
    videoUrl: String(row.video_url),
    platform: String(row.platform) as Project['platform'],
    thumbnailUrl: String(row.thumbnail_url),
    sortOrder: Number(row.sort_order),
    published: Boolean(row.published),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSocial(row: Row): SocialLink {
  return {
    id: String(row.id),
    platform: String(row.platform),
    label: String(row.label),
    url: String(row.url),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
  };
}

async function getContent(env: Env, includePrivate = false): Promise<PortfolioContent> {
  const [settings, projects, socials] = await Promise.all([
    env.DB.prepare('SELECT * FROM site_settings WHERE id = 1').first<Row>(),
    env.DB.prepare(
      `SELECT * FROM projects ${includePrivate ? '' : 'WHERE published = 1'} ORDER BY sort_order ASC, created_at DESC`,
    ).all<Row>(),
    env.DB.prepare(
      `SELECT * FROM social_links ${includePrivate ? '' : "WHERE enabled = 1 AND url != ''"} ORDER BY sort_order ASC`,
    ).all<Row>(),
  ]);
  if (!settings) throw new Error('Portfolio settings are unavailable');
  return {
    settings: mapSettings(settings),
    projects: projects.results.map(mapProject),
    socials: socials.results.map(mapSocial),
  };
}

function settingsFrom(value: unknown): SiteSettings {
  const input = (value ?? {}) as JsonRecord;
  const result: SiteSettings = {
    name: text(input.name, 100),
    stageName: text(input.stageName, 100),
    roleEn: text(input.roleEn, 160),
    roleVi: text(input.roleVi, 160),
    headlineEn: text(input.headlineEn, 240),
    headlineVi: text(input.headlineVi, 240),
    bioEn: text(input.bioEn, 3000),
    bioVi: text(input.bioVi, 3000),
    email: text(input.email, 200),
    discord: text(input.discord, 100),
    phone: text(input.phone, 40),
  };
  if (!result.name || !result.stageName || !result.headlineEn || !result.headlineVi || !result.email)
    throw new Error('Please complete all required profile fields');
  return result;
}

function projectFrom(value: unknown): Project {
  const input = (value ?? {}) as JsonRecord;
  const videoUrl = safeHttpsLink(input.videoUrl, false);
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) throw new Error('Use a valid YouTube, Vimeo, TikTok or Instagram video link');
  const category = text(input.category, 30) as Category;
  if (!categories.includes(category)) throw new Error('Invalid category');
  const titleEn = text(input.titleEn, 240);
  const titleVi = text(input.titleVi, 240);
  if (!titleEn || !titleVi) throw new Error('English and Vietnamese titles are required');
  const now = new Date().toISOString();
  return {
    id: text(input.id, 100) || crypto.randomUUID(),
    titleEn,
    titleVi,
    descriptionEn: text(input.descriptionEn, 3000),
    descriptionVi: text(input.descriptionVi, 3000),
    tagsEn: text(input.tagsEn, 500),
    tagsVi: text(input.tagsVi, 500),
    category,
    videoUrl,
    platform: parsed.platform,
    thumbnailUrl: safeThumbnailLink(input.thumbnailUrl, parsed.thumbnailUrl),
    sortOrder: number(input.sortOrder),
    published: Boolean(input.published),
    createdAt: text(input.createdAt, 100) || now,
    updatedAt: now,
  };
}

function socialsFrom(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) throw new Error('Invalid social links');
  const socials = value.slice(0, 30).map((item, index) => {
    const input = (item ?? {}) as JsonRecord;
    const id = text(input.id, 80).toLowerCase();
    const platform = normalizeSocialPlatform(text(input.platform, 80));
    const label = text(input.label, 100);
    const url = safeLink(input.url);
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)) throw new Error('Invalid social link id');
    if (!platform || !label) throw new Error('Every social link needs a platform and label');
    const error = socialLinkError(platform, url);
    if (error) throw new Error(`${label}: ${error}`);
    return {
      id,
      platform,
      label,
      url,
      enabled: Boolean(input.enabled) && Boolean(url),
      sortOrder: number(input.sortOrder, index + 1),
    };
  });
  if (new Set(socials.map((item) => item.id)).size !== socials.length)
    throw new Error('Duplicate social link id');
  return socials;
}

async function saveSettings(env: Env, settings: SiteSettings): Promise<void> {
  await env.DB.prepare(
    'UPDATE site_settings SET name=?, stage_name=?, role_en=?, role_vi=?, headline_en=?, headline_vi=?, bio_en=?, bio_vi=?, email=?, discord=?, phone=?, updated_at=? WHERE id=1',
  ).bind(
    settings.name, settings.stageName, settings.roleEn, settings.roleVi,
    settings.headlineEn, settings.headlineVi, settings.bioEn, settings.bioVi,
    settings.email, settings.discord, settings.phone, new Date().toISOString(),
  ).run();
}

async function upsertProject(env: Env, project: Project): Promise<void> {
  await env.DB.prepare(`INSERT INTO projects (
    id, title_en, title_vi, description_en, description_vi, tags_en, tags_vi,
    category, video_url, platform, thumbnail_url, sort_order, published, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET title_en=excluded.title_en, title_vi=excluded.title_vi,
    description_en=excluded.description_en, description_vi=excluded.description_vi,
    tags_en=excluded.tags_en, tags_vi=excluded.tags_vi, category=excluded.category,
    video_url=excluded.video_url, platform=excluded.platform,
    thumbnail_url=excluded.thumbnail_url, sort_order=excluded.sort_order,
    published=excluded.published, updated_at=excluded.updated_at`).bind(
      project.id, project.titleEn, project.titleVi, project.descriptionEn,
      project.descriptionVi, project.tagsEn, project.tagsVi, project.category,
      project.videoUrl, project.platform, project.thumbnailUrl, project.sortOrder,
      project.published ? 1 : 0, project.createdAt, project.updatedAt,
    ).run();
}

async function saveSocials(env: Env, socials: SocialLink[]): Promise<void> {
  const upserts = socials.map((social) => env.DB.prepare(`INSERT INTO social_links
    (id, platform, label, url, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET platform=excluded.platform, label=excluded.label,
    url=excluded.url, enabled=excluded.enabled, sort_order=excluded.sort_order`).bind(
      social.id, social.platform, social.label, social.url,
      social.enabled ? 1 : 0, social.sortOrder,
    ));
  const removeMissing = socials.length
    ? env.DB.prepare(`DELETE FROM social_links WHERE id NOT IN (${socials.map(() => '?').join(',')})`).bind(...socials.map((social) => social.id))
    : env.DB.prepare('DELETE FROM social_links');
  await env.DB.batch([...upserts, removeMissing]);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomToken(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(value: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verify(value: string, signature: string, secret: string): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      base64UrlToBytes(signature).buffer as ArrayBuffer,
      encoder.encode(value),
    );
  } catch {
    return false;
  }
}

async function sha256(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({
    sub: env.OWNER_GITHUB_ID,
    aud: 'yuuta-admin',
    iat: now,
    exp: now + 3600,
  })));
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${await sign(unsigned, env.AUTH_SECRET)}`;
}

async function authorized(request: Request, env: Env): Promise<boolean> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !(await verify(`${parts[0]}.${parts[1]}`, parts[2], env.AUTH_SECRET))) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as {
      sub?: string; aud?: string; exp?: number;
    };
    return payload.sub === env.OWNER_GITHUB_ID && payload.aud === 'yuuta-admin' &&
      typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function cookieValue(request: Request, name: string): string {
  const cookies = request.headers.get('cookie') || '';
  for (const item of cookies.split(';')) {
    const [key, ...rest] = item.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

async function authLogin(request: Request, env: Env): Promise<Response> {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.AUTH_SECRET)
    return new Response('Authentication is not configured', { status: 503 });
  const state = randomToken(24);
  const signedState = `${state}.${await sign(state, env.AUTH_SECRET)}`;
  const callback = `${new URL(request.url).origin}/auth/callback`;
  const github = new URL('https://github.com/login/oauth/authorize');
  github.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  github.searchParams.set('redirect_uri', callback);
  github.searchParams.set('scope', 'read:user');
  github.searchParams.set('state', state);
  const headers = securityHeaders(new Headers({ location: github.toString() }));
  headers.append('set-cookie', `yuuta_oauth_state=${signedState}; Path=/auth; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
  return new Response(null, { status: 302, headers });
}

async function authCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const stored = cookieValue(request, 'yuuta_oauth_state');
  const dot = stored.lastIndexOf('.');
  const storedState = dot > 0 ? stored.slice(0, dot) : '';
  const storedSignature = dot > 0 ? stored.slice(dot + 1) : '';
  const clearCookie = 'yuuta_oauth_state=; Path=/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
  const redirect = (error: string) => {
    const target = new URL('/admin/', env.FRONTEND_ORIGIN);
    target.searchParams.set('error', error);
    const headers = securityHeaders(new Headers({ location: target.toString() }));
    headers.append('set-cookie', clearCookie);
    return new Response(null, { status: 302, headers });
  };
  if (!code || !state || state !== storedState || !(await verify(storedState, storedSignature, env.AUTH_SECRET)))
    return redirect('invalid_state');

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'yuuta-portfolio' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/auth/callback`,
    }),
  });
  const tokenBody = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !tokenBody.access_token) return redirect('oauth_failed');
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${tokenBody.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'yuuta-portfolio' },
  });
  const user = await userResponse.json() as { id?: number };
  if (!userResponse.ok || String(user.id || '') !== env.OWNER_GITHUB_ID) return redirect('access_denied');

  const oneTimeCode = randomToken(32);
  const expires = Math.floor(Date.now() / 1000) + 120;
  await env.DB.prepare('DELETE FROM oauth_codes WHERE expires_at < ? OR used = 1').bind(Math.floor(Date.now() / 1000)).run();
  await env.DB.prepare('INSERT INTO oauth_codes (code_hash, github_user_id, expires_at, used) VALUES (?, ?, ?, 0)')
    .bind(await sha256(oneTimeCode), env.OWNER_GITHUB_ID, expires).run();
  const target = new URL('/admin/', env.FRONTEND_ORIGIN);
  target.searchParams.set('code', oneTimeCode);
  const headers = securityHeaders(new Headers({ location: target.toString() }));
  headers.append('set-cookie', clearCookie);
  return new Response(null, { status: 302, headers });
}

async function authExchange(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as JsonRecord;
    const code = text(body.code, 200);
    if (!code) throw new Error('Missing authorization code');
    const result = await env.DB.prepare(
      'UPDATE oauth_codes SET used = 1 WHERE code_hash = ? AND github_user_id = ? AND used = 0 AND expires_at >= ?',
    ).bind(await sha256(code), env.OWNER_GITHUB_ID, Math.floor(Date.now() / 1000)).run();
    if (!result.meta.changes) throw new Error('Authorization code is invalid or expired');
    return json(request, env, { token: await createJwt(env), expiresIn: 3600 });
  } catch (error) {
    return json(request, env, { error: error instanceof Error ? error.message : 'Authentication failed' }, 401);
  }
}

function detectedImageType(bytes: Uint8Array): { contentType: string; extension: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { contentType: 'image/jpeg', extension: 'jpg' };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a)
    return { contentType: 'image/png', extension: 'png' };
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP')
    return { contentType: 'image/webp', extension: 'webp' };
  return null;
}

async function uploadThumbnail(request: Request, env: Env): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Select an image to upload');
    if (!file.size) throw new Error('The selected image is empty');
    if (file.size > maxThumbnailSize) throw new Error('The image must be 10 MB or smaller');
    const buffer = await file.arrayBuffer();
    const detected = detectedImageType(new Uint8Array(buffer));
    if (!detected) throw new Error('Use a JPG, JPEG, PNG or WebP image');
    if (file.type && ![detected.contentType, 'image/jpg'].includes(file.type.toLowerCase()))
      throw new Error('The file type does not match the image content');
    const key = `thumbnails/${crypto.randomUUID()}.${detected.extension}`;
    await env.MEDIA.put(key, buffer, { metadata: { contentType: detected.contentType } });
    return json(request, env, { ok: true, url: `${new URL(request.url).origin}/media/${key}` });
  } catch (error) {
    return json(request, env, { error: error instanceof Error ? error.message : 'Unable to upload thumbnail' }, 400);
  }
}

async function media(request: Request, env: Env, key: string): Promise<Response> {
  if (!/^thumbnails\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(key))
    return new Response('Invalid thumbnail', { status: 400, headers: securityHeaders() });
  const object = await env.MEDIA.getWithMetadata<{ contentType?: string }>(key, 'arrayBuffer');
  if (!object.value) return new Response('Thumbnail not found', { status: 404, headers: securityHeaders() });
  const headers = corsHeaders(request, env);
  const inferredType = key.endsWith('.jpg')
    ? 'image/jpeg'
    : key.endsWith('.png')
      ? 'image/png'
      : key.endsWith('.webp')
        ? 'image/webp'
        : 'application/octet-stream';
  headers.set('content-type', object.metadata?.contentType || inferredType);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.value, { headers });
}

async function adminContent(request: Request, env: Env): Promise<Response> {
  if (!(await authorized(request, env))) return json(request, env, { error: 'Unauthorized' }, 401);
  if (request.method === 'GET') return json(request, env, await getContent(env, true));
  try {
    const body = await request.json() as JsonRecord;
    const action = text(body.action, 50);
    if (action === 'save-settings') await saveSettings(env, settingsFrom(body.settings));
    else if (action === 'save-project') await upsertProject(env, projectFrom(body.project));
    else if (action === 'delete-project') {
      const id = text(body.id, 100);
      if (!id) throw new Error('Project id is required');
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    } else if (action === 'save-socials') await saveSocials(env, socialsFrom(body.socials));
    else throw new Error('Unknown action');
    return json(request, env, { ok: true, content: await getContent(env, true) });
  } catch (error) {
    return json(request, env, { error: error instanceof Error ? error.message : 'Unable to save changes' }, 400);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      if (request.method === 'GET' && url.pathname === '/health')
        return json(request, env, { ok: true });
      if (request.method === 'GET' && url.pathname === '/api/content')
        return json(request, env, await getContent(env), 200, 'public, max-age=0, must-revalidate');
      if (request.method === 'GET' && url.pathname === '/auth/login') return authLogin(request, env);
      if (request.method === 'GET' && url.pathname === '/auth/callback') return authCallback(request, env);
      if (request.method === 'POST' && url.pathname === '/auth/exchange') return authExchange(request, env);
      if (url.pathname === '/api/admin/content' && ['GET', 'POST'].includes(request.method))
        return adminContent(request, env);
      if (request.method === 'POST' && url.pathname === '/api/admin/thumbnail') {
        if (!(await authorized(request, env))) return json(request, env, { error: 'Unauthorized' }, 401);
        return uploadThumbnail(request, env);
      }
      if (request.method === 'GET' && url.pathname.startsWith('/media/'))
        return media(request, env, decodeURIComponent(url.pathname.slice('/media/'.length)));
      return new Response('Not found', { status: 404, headers: securityHeaders() });
    } catch (error) {
      console.error(error);
      return json(request, env, { error: 'Internal server error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
