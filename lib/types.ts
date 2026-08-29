export type Language = 'en' | 'vi';
export type Category = 'MOTION' | 'MV EDIT' | 'AI VIDEO';
export type VideoPlatform = 'youtube' | 'vimeo' | 'tiktok' | 'instagram';

export type SiteSettings = {
  name: string;
  stageName: string;
  roleEn: string;
  roleVi: string;
  headlineEn: string;
  headlineVi: string;
  bioEn: string;
  bioVi: string;
  email: string;
  discord: string;
  phone: string;
};

export type Project = {
  id: string;
  titleEn: string;
  titleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  tagsEn: string;
  tagsVi: string;
  category: Category;
  videoUrl: string;
  platform: VideoPlatform;
  thumbnailUrl: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
};

export type PortfolioContent = {
  settings: SiteSettings;
  projects: Project[];
  socials: SocialLink[];
};
