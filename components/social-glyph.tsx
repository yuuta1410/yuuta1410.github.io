import { ExternalLink } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaLinkedinIn } from 'react-icons/fa6';
import {
  SiArtstation,
  SiBehance,
  SiBilibili,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiGmail,
  SiInstagram,
  SiLinktree,
  SiPayhip,
  SiPinterest,
  SiReddit,
  SiSoundcloud,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiVimeo,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiZalo,
} from 'react-icons/si';
import { normalizeSocialPlatform } from '@/lib/socials';

const socialIcons: Record<string, IconType> = {
  artstation: SiArtstation,
  behance: SiBehance,
  bilibili: SiBilibili,
  discord: SiDiscord,
  douyin: SiTiktok,
  dribbble: SiDribbble,
  facebook: SiFacebook,
  github: SiGithub,
  gmail: SiGmail,
  instagram: SiInstagram,
  linkedin: FaLinkedinIn,
  linktree: SiLinktree,
  payhip: SiPayhip,
  pinterest: SiPinterest,
  reddit: SiReddit,
  soundcloud: SiSoundcloud,
  telegram: SiTelegram,
  threads: SiThreads,
  tiktok: SiTiktok,
  twitch: SiTwitch,
  vimeo: SiVimeo,
  whatsapp: SiWhatsapp,
  x: SiX,
  youtube: SiYoutube,
  zalo: SiZalo,
};

export function SocialGlyph({ platform }: { platform: string }) {
  const BrandIcon = socialIcons[normalizeSocialPlatform(platform)];
  return BrandIcon ? (
    <BrandIcon aria-hidden="true" />
  ) : (
    <ExternalLink aria-hidden="true" />
  );
}
