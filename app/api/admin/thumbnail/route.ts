import { env } from 'cloudflare:workers';
import { isAdminRequest } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function detectedImageType(bytes: Uint8Array): {
  contentType: string;
  extension: string;
} | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return { contentType: 'image/jpeg', extension: 'jpg' };
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return { contentType: 'image/png', extension: 'png' };
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return { contentType: 'image/webp', extension: 'webp' };
  return null;
}

export async function POST(request: Request) {
  if (!(await isAdminRequest()))
    return Response.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) throw new Error('Select an image to upload');
    if (file.size === 0) throw new Error('The selected image is empty');
    if (file.size > MAX_FILE_SIZE)
      throw new Error('The image must be 10 MB or smaller');

    const buffer = await file.arrayBuffer();
    const detected = detectedImageType(new Uint8Array(buffer));
    if (!detected)
      throw new Error('Use a JPG, JPEG, PNG or WebP image');
    if (
      file.type &&
      ![detected.contentType, 'image/jpg'].includes(file.type.toLowerCase())
    )
      throw new Error('The file type does not match the image content');

    const key = `thumbnails/${crypto.randomUUID()}.${detected.extension}`;
    await env.MEDIA.put(key, buffer, {
      httpMetadata: {
        contentType: detected.contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return Response.json({
      ok: true,
      url: `/api/thumbnail?key=${encodeURIComponent(key)}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to upload thumbnail';
    return Response.json({ error: message }, { status: 400 });
  }
}
