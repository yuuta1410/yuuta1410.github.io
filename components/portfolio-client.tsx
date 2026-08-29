'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, AtSign, Camera, CirclePlay, Copy, ExternalLink, Flame, Link2, Mail,
  MessageCircle, Music2, Phone, Play, ShoppingBag, Tv,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Category, Language, PortfolioContent, Project, SocialLink } from '@/lib/types';
import { parseVideoUrl, platformName } from '@/lib/video';

const categories: Category[] = ['MOTION', 'MV EDIT', 'AI VIDEO'];

const ui = {
  en: {
    work: 'Works', about: 'About', contact: 'Contact', share: 'Share', shared: 'Website link copied!',
    hello: 'Hi! I’m Yuuta', showMore: 'Show more', showLess: 'Show less', play: 'Play video',
    worksSub: 'Choose a category above and click a thumbnail to watch it here.',
    empty: 'New work is being prepared!', emptyNote: 'Yuuta is adding projects to this category. Please come back soon ✦',
    aboutSub: 'A little introduction from Yuuta.',
    contactSub: 'For commissions and collaboration, tap a card to copy the contact.',
    copied: 'Copied to clipboard!', watchOn: 'Watch on', unavailable: 'This video cannot be embedded.',
    motionDesc: 'SaaS Motion · Kinetic Typography · SaaS Explainer',
    mvDesc: 'Anime MV · Manga Animation · Lyric Video',
    aiDesc: 'AI Commercial · Generative Video · Full AI Production',
    botName: 'YUUTA BOT', online: 'Online', botHello: 'Hi! I’m Yuuta Bot ✦ What would you like to know?',
    faq: [
      { q: 'What does Yuuta create?', a: 'Yuuta creates motion graphics, anime and manga MV edits, lyric videos, and AI-powered commercial videos.' },
      { q: 'How can I commission Yuuta?', a: 'Send the brief, references, expected deadline and budget through Gmail, Discord, Zalo or WhatsApp. Yuuta will reply to discuss the direction.' },
      { q: 'Which video links work here?', a: 'The portfolio can play public YouTube, Vimeo, TikTok and Instagram video links directly on the website.' },
    ],
  },
  vi: {
    work: 'Tác phẩm', about: 'Giới thiệu', contact: 'Liên hệ', share: 'Chia sẻ', shared: 'Đã sao chép liên kết website!',
    hello: 'Xin chào! Mình là Yuuta', showMore: 'Xem thêm', showLess: 'Thu gọn', play: 'Phát video',
    worksSub: 'Chọn danh mục phía trên và bấm vào ảnh để xem video ngay tại đây.',
    empty: 'Dự án mới đang được chuẩn bị!', emptyNote: 'Yuuta đang cập nhật tác phẩm cho danh mục này. Hãy quay lại sớm nhé ✦',
    aboutSub: 'Một chút giới thiệu về Yuuta.',
    contactSub: 'Để đặt dự án hoặc hợp tác, hãy bấm vào thẻ để sao chép liên hệ.',
    copied: 'Đã sao chép!', watchOn: 'Xem trên', unavailable: 'Video này không thể nhúng trực tiếp.',
    motionDesc: 'SaaS Motion · Kinetic Typography · SaaS Explainer',
    mvDesc: 'Anime MV · Manga Animation · Lyric Video',
    aiDesc: 'Quảng cáo AI · Video tạo sinh · Sản xuất hoàn toàn bằng AI',
    botName: 'YUUTA BOT', online: 'Trực tuyến', botHello: 'Xin chào! Mình là Yuuta Bot ✦ Bạn muốn biết điều gì?',
    faq: [
      { q: 'Yuuta làm những thể loại nào?', a: 'Yuuta thực hiện motion graphics, MV anime và manga, lyric video, cùng video quảng cáo được sản xuất bằng AI.' },
      { q: 'Làm sao để đặt dự án?', a: 'Bạn gửi brief, hình ảnh tham khảo, thời hạn và ngân sách qua Gmail, Discord, Zalo hoặc WhatsApp. Yuuta sẽ phản hồi để trao đổi hướng thực hiện.' },
      { q: 'Website hỗ trợ link video nào?', a: 'Portfolio có thể phát trực tiếp các link công khai từ YouTube, Vimeo, TikTok và Instagram.' },
    ],
  },
};

const backgroundDecorations = [
  ['✦', '7%', '15%', '16px', '0s', '6s'], ['✧', '20%', '42%', '22px', '1.2s', '8s'],
  ['◆', '34%', '12%', '13px', '2.8s', '7s'], ['✦', '47%', '68%', '18px', '.6s', '9s'],
  ['✧', '61%', '27%', '25px', '3.5s', '8s'], ['✦', '74%', '54%', '15px', '2s', '6s'],
  ['◆', '88%', '18%', '12px', '4s', '9s'], ['✧', '94%', '73%', '21px', '1.8s', '7s'],
  ['✦', '12%', '82%', '18px', '3s', '8s'], ['◆', '28%', '91%', '11px', '.3s', '6s'],
  ['✧', '55%', '88%', '17px', '4.6s', '9s'], ['✦', '82%', '92%', '24px', '2.4s', '7s'],
] as const;

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
  return <ExternalLink />;
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="cute-section-title"><span>✦</span><h2>{children}</h2><span>✦</span></div>;
}

function ProjectCard({ project, language, index, onOpen }: { project: Project; language: Language; index: number; onOpen: () => void }) {
  const title = language === 'en' ? project.titleEn : project.titleVi;
  return (
    <article className="portfolio-card reveal-item" style={{ transitionDelay: `${Math.min(index, 5) * 55}ms` }}>
      <button className={`project-thumb platform-${project.platform}`} onClick={onOpen} aria-label={`${ui[language].play}: ${title}`} style={project.thumbnailUrl ? { backgroundImage: `url(${project.thumbnailUrl})` } : undefined}>
        {!project.thumbnailUrl && <Image src="/yuuta-logo-final.png" alt="" width={1400} height={1120} />}
        <span className="platform-corner">{platformName(project.platform)}</span>
        <span className="play-bubble"><i><Play fill="currentColor" /></i></span>
      </button>
      <div className="portfolio-card-body">
        <p>{title}</p>
        <div className="portfolio-card-actions">
          <button onClick={onOpen}>{ui[language].play}</button>
          <a href={project.videoUrl} target="_blank" rel="noreferrer">{platformName(project.platform)} ↗</a>
        </div>
      </div>
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
          <span className="window-dot dark" /><span className="window-dot cyan" />
          <div><DialogTitle>{title}</DialogTitle>{project && <DialogDescription>{project.category} · {platformName(project.platform)}</DialogDescription>}</div>
        </DialogHeader>
        {project && parsed ? (
          <div className={`player-shell ${parsed.vertical ? 'vertical' : ''}`}>
            <iframe key={parsed.embedUrl} src={parsed.embedUrl} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        ) : project ? <div className="player-fallback"><p>{ui[language].unavailable}</p></div> : null}
        {(description || project) && <div className="video-dialog-footer">{description && <p>{description}</p>}{project && <a href={project.videoUrl} target="_blank" rel="noreferrer">{ui[language].watchOn} {platformName(project.platform)} <ExternalLink /></a>}</div>}
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ icon, label, value, onCopy }: { icon: React.ReactNode; label: string; value: string; onCopy: () => void }) {
  return (
    <button className="cute-contact-card reveal-item" onClick={onCopy}>
      <span className="cute-contact-icon">{icon}</span>
      <span className="cute-contact-info"><b>{label}</b><strong>{value}</strong></span>
      <Copy className="contact-copy-icon" />
    </button>
  );
}

function YuutaBot({ language }: { language: Language }) {
  const t = ui[language];
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [typing, setTyping] = useState(false);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuestion(''); setAnswer(''); setTyping(false);
    if (answerTimer.current) clearTimeout(answerTimer.current);
    return () => { if (answerTimer.current) clearTimeout(answerTimer.current); };
  }, [language]);

  const ask = (nextQuestion: string, nextAnswer: string) => {
    if (answerTimer.current) clearTimeout(answerTimer.current);
    setQuestion(nextQuestion); setAnswer(''); setTyping(true);
    answerTimer.current = setTimeout(() => { setTyping(false); setAnswer(nextAnswer); }, 520);
  };

  return (
    <>
      <aside className={`chat-panel ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
        <div className="chat-head"><Flame /><b>{t.botName}</b><span>{t.online}</span><button onClick={() => setOpen(false)} aria-label="Close chat">×</button></div>
        <div className="chat-body">
          <p className="chat-message bot">{t.botHello}</p>
          {question && <p className="chat-message user">{question}</p>}
          {typing && <p className="chat-message bot typing"><i /><i /><i /></p>}
          {answer && <p className="chat-message bot">{answer}</p>}
          <div className="chat-chips">{t.faq.map((item) => <button key={item.q} onClick={() => ask(item.q, item.a)}>{item.q}</button>)}</div>
        </div>
      </aside>
      <button className="chat-fab" onClick={() => setOpen((value) => !value)} aria-label="FAQ chat" aria-expanded={open}><Flame /><span /></button>
    </>
  );
}

export function PortfolioClient({ initialContent }: { initialContent: PortfolioContent }) {
  const [language, setLanguage] = useState<Language>('en');
  const [category, setCategory] = useState<Category>('MOTION');
  const [visible, setVisible] = useState(6);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = ui[language];
  const { settings, projects, socials } = initialContent;

  const filtered = useMemo(() => projects.filter((project) => project.category === category), [projects, category]);
  const shown = filtered.slice(0, visible);
  const role = language === 'en' ? settings.roleEn : settings.roleVi;
  const headline = language === 'en' ? settings.headlineEn : settings.headlineVi;
  const bio = language === 'en' ? settings.bioEn : settings.bioVi;
  const categoryDescription = category === 'MOTION' ? t.motionDesc : category === 'MV EDIT' ? t.mvDesc : t.aiDesc;

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  useEffect(() => {
    const sparkle = (event: PointerEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const symbols = ['✦', '✧', '◆', '✦', '◇'];
      for (let index = 0; index < symbols.length; index += 1) {
        const particle = document.createElement('span');
        const angle = (Math.PI * 2 * index) / symbols.length + Math.random() * .7;
        particle.className = 'click-spark'; particle.textContent = symbols[index];
        particle.style.left = `${event.clientX - 7}px`; particle.style.top = `${event.clientY - 7}px`;
        particle.style.setProperty('--spark-x', `${Math.cos(angle) * (30 + Math.random() * 26)}px`);
        particle.style.setProperty('--spark-y', `${Math.sin(angle) * (30 + Math.random() * 26)}px`);
        document.body.appendChild(particle);
        window.setTimeout(() => particle.remove(), 750);
      }
    };
    document.addEventListener('pointerdown', sparkle);
    return () => document.removeEventListener('pointerdown', sparkle);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('shown'); observer.unobserve(entry.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal-item').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [category, shown.length]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(''), 2800);
  };

  const copyText = async (value: string) => {
    try { await navigator.clipboard.writeText(value); }
    catch {
      const textarea = document.createElement('textarea');
      textarea.value = value; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
    }
    showToast(t.copied);
  };

  const shareWebsite = async () => {
    await copyText(window.location.origin);
    showToast(t.shared);
  };

  const changeCategory = (next: Category, scroll = false) => {
    setCategory(next); setVisible(6);
    if (scroll) window.setTimeout(() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const openProject = (project: Project) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSelectedProject(project); setVideoOpen(true);
  };

  const handleVideoOpen = (open: boolean) => {
    setVideoOpen(open);
    if (open) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setSelectedProject(null), 280);
  };

  return (
    <main className="yuuta-site">
      <div className="background-decorations" aria-hidden="true">
        {backgroundDecorations.map(([symbol, left, top, size, delay, duration], index) => (
          <span key={`${symbol}-${index}`} style={{ left, top, fontSize: size, animationDelay: delay, animationDuration: duration }}>{symbol}</span>
        ))}
      </div>

      <header className="site-header">
        <div className="header-inner">
          <a className="header-brand" href="#top" aria-label="Yuuta home"><Image src="/yuuta-logo-final.png" alt="Yuuta" width={1400} height={1120} priority /></a>
          <nav aria-label="Main navigation">
            <a href="#work">{t.work}</a><a href="#contact">{t.contact}</a>
            <button className="share-button" onClick={() => void shareWebsite()} aria-label={t.share}><Link2 /></button>
            <div className="language-switch" data-language={language} aria-label="Language">
              <span className="language-pill" />
              <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
              <button className={language === 'vi' ? 'active' : ''} onClick={() => setLanguage('vi')} aria-pressed={language === 'vi'}>VI</button>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <Image className="hero-logo" src="/yuuta-logo-final.png" alt="Yuuta logo" width={1400} height={1120} priority />
        <p className="hero-hello">{t.hello} — {role} ✦</p>
        <p className="hero-tagline">{headline} ✦</p>
        <div className="hero-badges" role="tablist" aria-label="Project categories">
          {categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={`hero-badge ${category === item ? 'active' : ''}`} onClick={() => changeCategory(item, true)}>{item}</button>)}
        </div>
        <SocialDock socials={socials} />
      </section>

      <section className="cute-section works-section" id="work">
        <SectionTitle>WORKS</SectionTitle>
        <p className="cute-section-sub">{category} · {categoryDescription}<br />{t.worksSub}</p>
        {shown.length ? (
          <>
            <div className="portfolio-grid">{shown.map((project, index) => <ProjectCard key={project.id} project={project} language={language} index={index} onOpen={() => openProject(project)} />)}</div>
            {filtered.length > 6 && <div className="more-row"><button className={`more-button ${visible >= filtered.length ? 'less' : ''}`} onClick={() => setVisible((count) => count >= filtered.length ? 6 : filtered.length)}>{visible >= filtered.length ? t.showLess : `${t.showMore} (+${filtered.length - visible})`} <ArrowDown /></button></div>}
          </>
        ) : (
          <div className="cute-empty reveal-item"><Image src="/yuuta-logo-final.png" alt="" width={1400} height={1120} /><h3>{t.empty}</h3><p>{t.emptyNote}</p></div>
        )}
      </section>

      <section className="cute-section about-cute-section" id="about">
        <SectionTitle>ABOUT</SectionTitle>
        <p className="cute-section-sub">{t.aboutSub}</p>
        <div className="about-card reveal-item">
          <Image src="/yuuta-logo-final.png" alt="Yuuta" width={1400} height={1120} />
          <div><p className="about-kicker">VÕ GIA HUY · YUUTA</p><h3>{headline}</h3><p>{bio}</p><div className="about-tags"><span>MOTION</span><span>MV EDIT</span><span>AI VIDEO</span></div></div>
        </div>
      </section>

      <section className="cute-section contact-cute-section" id="contact">
        <SectionTitle>CONTACT</SectionTitle>
        <p className="cute-section-sub">{t.contactSub}</p>
        <div className="cute-contact-cards">
          <ContactCard icon={<Mail />} label="E-MAIL" value={settings.email} onCopy={() => void copyText(settings.email)} />
          <ContactCard icon={<MessageCircle />} label="DISCORD" value={`@${settings.discord}`} onCopy={() => void copyText(settings.discord)} />
          <ContactCard icon={<Phone />} label="ZALO · WHATSAPP" value={settings.phone} onCopy={() => void copyText(settings.phone)} />
        </div>
      </section>

      <footer className="cute-footer">
        <a href="#top" aria-label="Back to top"><Image src="/yuuta-logo-final.png" alt="Yuuta" width={1400} height={1120} /></a>
        <p>© {new Date().getFullYear()} {settings.stageName}</p><a href="/admin">Settings</a>
      </footer>

      <VideoDialog project={selectedProject} open={videoOpen} onOpenChange={handleVideoOpen} language={language} />
      <YuutaBot language={language} />
      {toastMessage && <div className="site-toast" role="status">✦ {toastMessage}</div>}
    </main>
  );
}
