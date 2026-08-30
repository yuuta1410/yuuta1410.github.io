import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!/^thumbnails\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(key))
    return new Response('Invalid thumbnail', { status: 400 });

  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Thumbnail not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', object.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}
