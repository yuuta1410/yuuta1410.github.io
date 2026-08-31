INSERT OR REPLACE INTO site_settings (
  id, name, stage_name, role_en, role_vi, headline_en, headline_vi,
  bio_en, bio_vi, email, discord, phone, updated_at
) VALUES (
  1, 'Võ Gia Huy', 'Yuuta', 'Motion Designer', 'Thiết kế chuyển động',
  'I turn ideas into motion that sticks.',
  'Tôi biến ý tưởng thành chuyển động đọng lại trong tâm trí.',
  'I am Võ Gia Huy, also known as Yuuta — a motion designer based in Vietnam. I create energetic motion systems, anime-inspired music visuals and AI-powered commercial stories.',
  'Tôi là Võ Gia Huy, nghệ danh Yuuta — Motion Designer tại Việt Nam. Tôi sáng tạo hệ thống motion giàu năng lượng, hình ảnh âm nhạc lấy cảm hứng từ anime và video quảng cáo bằng AI.',
  'vogiahuy141003@gmail.com', 'yuuta_1410', '0866406341',
  '2026-08-30T12:43:30.453Z'
);

INSERT OR REPLACE INTO projects (
  id, title_en, title_vi, description_en, description_vi, tags_en, tags_vi,
  category, video_url, platform, thumbnail_url, sort_order, published,
  created_at, updated_at
) VALUES
  ('3ffcfcaf-b757-43d6-9b29-0b0cf31119ab', 'B2b', 'B2b', '', '',
   'Typography', 'Typography', 'Motion Graphics',
   'https://www.tiktok.com/@yuuta_edit/video/7632553105850223893', 'tiktok',
   '/media/thumbnails/3bf51748-4a3f-4b18-b28b-2891f7d39517.jpg', 1, 1,
   '2026-08-30T16:26:48.661Z', '2026-08-31T02:48:43.617Z'),
  ('8201f9b8-f52a-4604-ae13-7edf79306897', 'Google Drive', 'Google Drive', '', '',
   'Saas Motion', 'Saas Motion', 'Motion Graphics',
   'https://youtu.be/iXJIo3f2mVM?si=8j0XTUxsPPAE0Uee', 'youtube',
   'https://i.ytimg.com/vi/iXJIo3f2mVM/hqdefault.jpg', 2, 1,
   '2026-08-31T04:12:27.282Z', '2026-08-31T04:12:27.282Z');

INSERT OR REPLACE INTO social_links (id, platform, label, url, enabled, sort_order) VALUES
  ('bilibili', 'bilibili', 'Bilibili', '', 0, 8),
  ('discord', 'discord', 'Discord', 'https://discord.com/invite/XGP58hHhHc', 1, 3),
  ('douyin', 'douyin', 'Douyin', '', 0, 7),
  ('gmail', 'gmail', 'Gmail', 'mailto:vogiahuy141003@gmail.com', 0, 12),
  ('instagram', 'instagram', 'Instagram', 'https://www.instagram.com/yuuta_1410/', 1, 4),
  ('payhip', 'payhip', 'Payhip', 'https://payhip.com/yuuta141003', 1, 2),
  ('threads', 'threads', 'Threads', '', 0, 6),
  ('tiktok', 'tiktok', 'TikTok', 'https://www.tiktok.com/@yuuta_edit', 1, 1),
  ('whatsapp', 'whatsapp', 'WhatsApp', 'https://wa.me/84866406341', 0, 10),
  ('x', 'x', 'X', '', 0, 9),
  ('youtube', 'youtube', 'YouTube', 'https://www.youtube.com/@huyvo6277', 1, 5),
  ('zalo', 'zalo', 'Zalo', 'https://zalo.me/0866406341', 0, 11);
