import type { PortfolioContent } from '@/lib/types';

export const defaultContent: PortfolioContent = {
  settings: {
    name: 'Võ Gia Huy',
    stageName: 'Yuuta',
    roleEn: 'Motion Designer',
    roleVi: 'Thiết kế chuyển động',
    headlineEn: 'I turn ideas into motion that sticks.',
    headlineVi: 'Tôi biến ý tưởng thành chuyển động đọng lại trong tâm trí.',
    bioEn: 'I am Võ Gia Huy, also known as Yuuta — a motion designer based in Vietnam. I create energetic motion systems, anime-inspired music visuals and AI-powered commercial stories.',
    bioVi: 'Tôi là Võ Gia Huy, nghệ danh Yuuta — Motion Designer tại Việt Nam. Tôi sáng tạo hệ thống motion giàu năng lượng, hình ảnh âm nhạc lấy cảm hứng từ anime và video quảng cáo bằng AI.',
    email: 'vogiahuy141003@gmail.com',
    discord: 'yuuta_1410',
    phone: '0866406341',
  },
  projects: [
    {
      id: '3ffcfcaf-b757-43d6-9b29-0b0cf31119ab',
      titleEn: 'B2b', titleVi: 'B2b', descriptionEn: '', descriptionVi: '',
      tagsEn: 'Typography', tagsVi: 'Typography', category: 'Motion Graphics',
      videoUrl: 'https://www.tiktok.com/@yuuta_edit/video/7632553105850223893',
      platform: 'tiktok',
      thumbnailUrl: '/media/thumbnails/3bf51748-4a3f-4b18-b28b-2891f7d39517.jpg',
      sortOrder: 1, published: true,
      createdAt: '2026-08-30T16:26:48.661Z', updatedAt: '2026-08-31T02:48:43.617Z',
    },
    {
      id: '8201f9b8-f52a-4604-ae13-7edf79306897',
      titleEn: 'Google Drive', titleVi: 'Google Drive', descriptionEn: '', descriptionVi: '',
      tagsEn: 'Saas Motion', tagsVi: 'Saas Motion', category: 'Motion Graphics',
      videoUrl: 'https://youtu.be/iXJIo3f2mVM?si=8j0XTUxsPPAE0Uee',
      platform: 'youtube', thumbnailUrl: 'https://i.ytimg.com/vi/iXJIo3f2mVM/hqdefault.jpg',
      sortOrder: 2, published: true,
      createdAt: '2026-08-31T04:12:27.282Z', updatedAt: '2026-08-31T04:12:27.282Z',
    },
  ],
  socials: [
    { id: 'tiktok', platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@yuuta_edit', enabled: true, sortOrder: 1 },
    { id: 'payhip', platform: 'payhip', label: 'Payhip', url: 'https://payhip.com/yuuta141003', enabled: true, sortOrder: 2 },
    { id: 'discord', platform: 'discord', label: 'Discord', url: 'https://discord.com/invite/XGP58hHhHc', enabled: true, sortOrder: 3 },
    { id: 'instagram', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/yuuta_1410/', enabled: true, sortOrder: 4 },
    { id: 'youtube', platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@huyvo6277', enabled: true, sortOrder: 5 },
  ],
};
