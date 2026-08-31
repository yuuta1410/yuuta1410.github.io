import type { VideoPlatform } from './types';

export type ParsedVideo = {
  platform: VideoPlatform;
  id: string;
  embedUrl: string;
  thumbnailUrl: string;
  vertical: boolean;
};

export function parseVideoUrl(input: string): ParsedVideo | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    const id = host === 'youtu.be' ? parts[0] : url.searchParams.get('v') ?? (['shorts', 'embed'].includes(parts[0]) ? parts[1] : '');
    if (!id || !/^[\w-]{6,}$/.test(id)) return null;
    return {
      platform: 'youtube', id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      vertical: parts[0] === 'shorts',
    };
  }

  if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
    const id = [...parts].reverse().find((part) => /^\d+$/.test(part));
    if (!id) return null;
    const hash = url.searchParams.get('h');
    return {
      platform: 'vimeo', id,
      embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${encodeURIComponent(hash)}&` : '?'}autoplay=1&dnt=1&title=0&byline=0&portrait=0`,
      thumbnailUrl: '', vertical: false,
    };
  }

  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const videoIndex = parts.indexOf('video');
    const id = videoIndex >= 0 ? parts[videoIndex + 1] : '';
    if (!id || !/^\d+$/.test(id)) return null;
    return {
      platform: 'tiktok', id,
      embedUrl: `https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=0&rel=0&music_info=0&description=0`,
      thumbnailUrl: '', vertical: true,
    };
  }

  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    const kindIndex = parts.findIndex((part) =>
      ['reel', 'p', 'tv'].includes(part),
    );
    const kind = kindIndex >= 0 ? parts[kindIndex] : '';
    const id = kind ? parts[kindIndex + 1] : '';
    if (!id || !/^[\w-]+$/.test(id)) return null;
    return {
      platform: 'instagram', id,
      embedUrl: `https://www.instagram.com/${kind}/${id}/embed/`,
      thumbnailUrl: '', vertical: kind === 'reel',
    };
  }
  return null;
}

export function platformName(platform: VideoPlatform): string {
  return platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : platform === 'tiktok' ? 'TikTok' : 'Instagram';
}
