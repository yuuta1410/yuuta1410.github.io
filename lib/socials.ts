export const socialPlatformSuggestions = [
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'discord',
  'behance',
  'dribbble',
  'linkedin',
  'facebook',
  'github',
  'vimeo',
  'payhip',
  'threads',
  'douyin',
  'bilibili',
  'zalo',
  'whatsapp',
  'gmail',
] as const;

const platformAliases: Record<string, string> = {
  twitter: 'x',
  'x-twitter': 'x',
  'linked-in': 'linkedin',
  threadcity: 'threads',
  thread: 'threads',
  'youtube-shorts': 'youtube',
  yt: 'youtube',
};

const platformHosts: Record<string, string[]> = {
  artstation: ['artstation.com'],
  behance: ['behance.net'],
  bilibili: ['bilibili.com', 'b23.tv'],
  discord: ['discord.com', 'discord.gg'],
  douyin: ['douyin.com', 'iesdouyin.com'],
  dribbble: ['dribbble.com'],
  facebook: ['facebook.com', 'fb.com'],
  github: ['github.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  linktree: ['linktr.ee'],
  payhip: ['payhip.com'],
  pinterest: ['pinterest.com', 'pin.it'],
  reddit: ['reddit.com'],
  soundcloud: ['soundcloud.com'],
  telegram: ['t.me', 'telegram.me'],
  threads: ['threads.net'],
  tiktok: ['tiktok.com'],
  twitch: ['twitch.tv'],
  vimeo: ['vimeo.com'],
  whatsapp: ['wa.me', 'whatsapp.com'],
  x: ['x.com', 'twitter.com'],
  youtube: ['youtube.com', 'youtu.be'],
  zalo: ['zalo.me'],
};

export function normalizeSocialPlatform(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return platformAliases[normalized] ?? normalized;
}

export function socialLinkError(
  platformValue: string,
  rawUrl: string,
): string | null {
  const platform = normalizeSocialPlatform(platformValue);
  const value = rawUrl.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'Enter a complete link, including https://';
  }

  if (platform === 'gmail') {
    if (
      url.protocol !== 'mailto:' ||
      !/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)
    ) {
      return 'Gmail must use a valid mailto: email link';
    }
    return null;
  }

  if (url.protocol !== 'https:') return 'Social links must use secure HTTPS';

  const allowedHosts = platformHosts[platform];
  if (!allowedHosts) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const matches = allowedHosts.some(
    (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`),
  );
  if (!matches)
    return `This link does not match the ${platformValue.trim() || platform} platform`;
  return null;
}
