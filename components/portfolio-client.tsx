'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUpRight, AtSign, Camera, Check, CirclePlay, Copy, ExternalLink, Mail,
  MessageCircle, Music2, Play, ShoppingBag, Sparkles, Tv,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Category, Language, PortfolioContent, Project, SocialLink } from '@/lib/types';
import { parseVideoUrl, platformName } from '@/lib/video';

const categories: Category[] = ['MOTION', 'MV EDIT', 'AI VIDEO'];

const ui = {
  en: {
    work: 'Work', about: 'About', contact: 'Contact', available: 'Available for freelance', explore: 'Explore selected work',
    portfolio: 'Portfolio', selected: 'Selected works', choose: 'Choose a discipline to explore the reel.',
    empty: 'New work is being prepared.', emptyNote: 'Yuuta is adding projects to this category. Check back soon.', showMore: 'Show more',
    aboutLabel: 'About Yuuta', aboutTitle: 'Motion with intent. Edits with energy.',
    services: 'Creative disciplines', motionDesc: 'SaaS Motion · Kinetic Typography · SaaS Explainer',
    mvDesc: 'Anime MV · Manga Animation · Lyric Video', aiDesc: 'AI Commercial · Generative Video · Full AI Production',
    contactLabel: 'Start a project', contactTitle: 'Have an idea? Let’s move it.',
    contactNote: 'Available for freelance motion design, video editing and AI video production.',
    copy: 'Copy', copied: 'Copied', watchOn: 'Watch on', close: 'Close video',
  },
  vi: {
    work: 'Dự án', about: 'Giới thiệu', contact: 'Liên hệ', available: 'Nhận dự án freelance', explore: 'Xem dự án nổi bật',
    portfolio: 'Portfolio', selected: 'Dự án nổi bật', choose: 'Chọn một lĩnh vực để xem tác phẩm.',
    empty: 'Dự án mới đang được chuẩn bị.', emptyNote: 'Yuuta đang cập nhật tác phẩm cho danh mục này. Hãy quay lại sớm nhé.', showMore: 'Xem thêm',
    aboutLabel: 'Về Yuuta', aboutTitle: 'Chuyển động có mục đích. Nhịp dựng đầy năng lượng.',
    services: 'Lĩnh vực sáng tạo', motionDesc: 'SaaS Motion · Kinetic Typography · SaaS Explainer',
    mvDesc: 'Anime MV · Manga Animation · Lyric Video', aiDesc: 'Quảng cáo AI · Video tạo sinh · Sản xuất hoàn toàn bằng AI',
    contactLabel: 'Bắt đầu dự án', contactTitle: 'Có ý tưởng? Hãy cùng chuyển động.',
    contactNote: 'Nhận dự án motion design, video editing và sản xuất video bằng AI.',
    copy: 'Sao chép', copied: 'Đã chép', watchOn: 'Xem trên', close: 'Đóng video',
  },
};

function SocialGlyph({ platform }: { platform: string }) {
  if (platform === 'youtube') return <CirclePlay />;
  if (platform === 'instagram') return <Camera />;
  if (platform === 'gmail') return <Mail />;
  if (['zalo', 'whatsapp', 'discord'].includes(platform)) return <MessageCircle />;
  if (['tiktok', 'douyin'].includes(platform)) return <Music2 />;
  if (platform === 'payhip') return <ShoppingBag />;
  if (platform === 'bilibili') return <Tv />;
  if (platform === 'threads') return <AtSign />;
  if (platform === 'x') return <span className="brand-letter">X</span>;
  return <ArrowUpRight />;
}

function SocialDock({ socials }: { socials: SocialLink[] }) {
  if (!socials.length) return null;
  return (
    <TooltipProvider delay={250}>
      <div className="social-dock" aria-label="Social links">
        {socials.map((social) => {
          const external = !social.url.startsWith('mailto:') && !social.url.startsWith('tel:');
          return (
            <Tooltip key={social.id}>
              <TooltipTrigger render={<a href={social.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} aria-label={social.label} />}>
                <SocialGlyph platform={social.platform} />
              </TooltipTrigger>
              <TooltipContent>{social.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function ProjectCard({ project, language, index, onOpen }: { project: Project; language: Language; index: number; onOpen: () => void }) {
  const title = language === 'en' ? project.titleEn : project.titleVi;
  const tags = (language === 'en' ? project.tagsEn : project.tagsVi).split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 3);
  return (
    <article className="project-card-wrap">
      <button className={`project-card project-card-${(index % 3) + 1}`} onClick={onOpen} aria-label={`Play ${title}`}>
        <span className={`project-visual platform-${project.platform}`} style={project.thumbnailUrl ? { backgroundImage: `url(${project.thumbnailUrl})` } : undefined}>
          <span className="project-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="platform-badge">{platformName(project.platform)}</span>
          <span className="play-button"><Play fill="currentColor" /></span>
        </span>
        <span className="project-meta">
          <span><small>{project.category}</small><strong>{title}</strong></span>
          <ArrowUpRight />
        </span>
        {tags.length > 0 && <span className="project-tags">{tags.map((tag) => <i key={tag}>{tag}</i>)}</span>}
      </button>
    </article>
  );
}

function VideoDialog({ project, open, onOpenChange, language }: { project: Project | null; open: boolean; onOpenChange: (open: boolean) => void; language: Language }) {
  const parsed = project ? parseVideoUrl(project.videoUrl) : null;
  const title = project ? (language === 'en' ? project.titleEn : project.titleVi) : '';
  const description = project ? (language === 'en' ? project.descriptionEn : project.descriptionVi) : '';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="video-dialog" aria-label={title}>
        <DialogHeader className="video-dialog-header">
          <div><DialogTitle>{title}</DialogTitle>{project && <DialogDescription>{project.category} · {platformName(project.platform)}</DialogDescription>}</div>
        </DialogHeader>
        {project && parsed ? (
          <div className={`player-shell ${parsed.vertical ? 'vertical' : ''}`}>
            <iframe key={parsed.embedUrl} src={parsed.embedUrl} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        ) : project ? <div className="player-fallback"><p>This video cannot be embedded.</p></div> : null}
        {description && <p className="video-description">{description}</p>}
        {project && <a className="watch-external" href={project.videoUrl} target="_blank" rel="noreferrer">{ui[language].watchOn} {platformName(project.platform)} <ExternalLink /></a>}
      </DialogContent>
    </Dialog>
  );
}

function CopyContact({ label, value, href, copyLabel, copiedLabel }: { label: string; value: string; href: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copyValue = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { window.location.href = href; }
  };
  return (
    <div className="contact-row"><a href={href}><small>{label}</small><strong>{value}</strong></a><button onClick={() => void copyValue()}>{copied ? <Check /> : <Copy />}{copied ? copiedLabel : copyLabel}</button></div>
  );
}

export function PortfolioClient({ initialContent }: { initialContent: PortfolioContent }) {
  const [language, setLanguage] = useState<Language>('en');
  const [category, setCategory] = useState<Category>('MOTION');
  const [visible, setVisible] = useState(6);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = ui[language];
  const { settings, projects, socials } = initialContent;

  const filtered = useMemo(() => projects.filter((project) => project.category === category), [projects, category]);
  const shown = filtered.slice(0, visible);
  const role = language === 'en' ? settings.roleEn : settings.roleVi;
  const headline = language === 'en' ? settings.headlineEn : settings.headlineVi;
  const bio = language === 'en' ? settings.bioEn : settings.bioVi;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const changeCategory = (next: Category) => { setCategory(next); setVisible(6); };
  const openProject = (project: Project) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSelectedProject(project);
    setVideoOpen(true);
  };
  const handleVideoOpen = (open: boolean) => {
    setVideoOpen(open);
    if (open) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setSelectedProject(null), 280);
  };

  return (
    <main>
      <header className="site-header">
        <a className="mini-brand" href="#top" aria-label="Yuuta home">YUUTA<span>®</span></a>
        <nav aria-label="Main navigation"><a href="#work">{t.work}</a><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a></nav>
        <div className="language-switch" aria-label="Language">
          <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button><span>/</span>
          <button className={language === 'vi' ? 'active' : ''} onClick={() => setLanguage('vi')} aria-pressed={language === 'vi'}>VI</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> {role}</p>
          <h1>{headline}</h1><p className="hero-intro">{bio}</p>
          <div className="hero-actions"><a className="primary-action" href="#work">{t.explore} <ArrowDown /></a><span className="availability"><i /> {t.available}</span></div>
          <SocialDock socials={socials} />
        </div>
        <div className="logo-stage" aria-label="Yuuta logo">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <Image src="/yuuta-logo-final.png" alt="Yuuta logo" width={1400} height={1120} priority />
          <span className="stage-tag stage-tag-top">{settings.name}</span><span className="stage-tag stage-tag-bottom">Saigon · VN</span>
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading"><div><p className="eyebrow">01 · {t.portfolio}</p><h2>{t.selected}</h2></div><p>{t.choose}</p></div>
        <div className="category-tabs" role="tablist" aria-label="Project categories">
          {categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} onClick={() => changeCategory(item)}>{item}</button>)}
        </div>
        {shown.length ? (
          <><div className="project-grid">{shown.map((project, index) => <ProjectCard key={project.id} project={project} language={language} index={index} onOpen={() => openProject(project)} />)}</div>
          {visible < filtered.length && <button className="show-more" onClick={() => setVisible((count) => count + 6)}>{t.showMore} <ArrowDown /></button>}</>
        ) : <div className="work-empty"><span><Play /></span><h3>{t.empty}</h3><p>{t.emptyNote}</p></div>}
      </section>

      <section className="about-section" id="about">
        <div className="about-intro"><p className="eyebrow">02 · {t.aboutLabel}</p><h2>{t.aboutTitle}</h2><p>{bio}</p></div>
        <div className="service-stack" aria-label={t.services}>
          <article><span>01</span><div><h3>MOTION</h3><p>{t.motionDesc}</p></div></article>
          <article><span>02</span><div><h3>MV EDIT</h3><p>{t.mvDesc}</p></div></article>
          <article><span>03</span><div><h3>AI VIDEO</h3><p>{t.aiDesc}</p></div></article>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-heading"><p className="eyebrow">03 · {t.contactLabel}</p><h2>{t.contactTitle}</h2><p>{t.contactNote}</p></div>
        <div className="contact-list">
          <CopyContact label="Email" value={settings.email} href={`mailto:${settings.email}`} copyLabel={t.copy} copiedLabel={t.copied} />
          <CopyContact label="Discord" value={settings.discord} href="https://discord.com/app" copyLabel={t.copy} copiedLabel={t.copied} />
          <CopyContact label="Zalo / WhatsApp" value={settings.phone} href={`https://zalo.me/${settings.phone}`} copyLabel={t.copy} copiedLabel={t.copied} />
        </div>
      </section>

      <footer><a className="mini-brand" href="#top">YUUTA<span>®</span></a><p>© {new Date().getFullYear()} {settings.name}. All motion, all heart.</p><a href="/admin">Settings</a></footer>
      <VideoDialog project={selectedProject} open={videoOpen} onOpenChange={handleVideoOpen} language={language} />
    </main>
  );
}
