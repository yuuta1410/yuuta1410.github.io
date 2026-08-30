'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Copy, ExternalLink, Link2, Play } from 'lucide-react';
import type { IconType } from 'react-icons';
import {
  SiBilibili,
  SiDiscord,
  SiGmail,
  SiInstagram,
  SiPayhip,
  SiThreads,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiZalo,
} from 'react-icons/si';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  Category,
  Language,
  PortfolioContent,
  Project,
  SocialLink,
} from '@/lib/types';
import { parseVideoUrl, platformName } from '@/lib/video';

const categories: Category[] = ['MOTION', 'MV EDIT', 'AI VIDEO'];

const ui = {
  en: {
    work: 'Works',
    contact: 'Contact',
    share: 'Share',
    shared: 'Website link copied!',
    hello: 'Hi! I’m Yuuta',
    showMore: 'Show more',
    showLess: 'Show less',
    play: 'Play video',
    empty: 'New work is being prepared!',
    emptyNote:
      'Yuuta is adding projects to this category. Please come back soon ✦',
    contactSub:
      'For commissions and collaboration, tap a card to copy the contact.',
    copied: 'Copied to clipboard!',
    watchOn: 'Watch on',
    unavailable: 'This video cannot be embedded.',
    botName: 'YUUTA BOT',
    online: 'Online',
    botHello: 'Hi! I’m Yuuta Bot ✦ What would you like to know?',
    faq: [
      {
        q: 'How do I send a request?',
        a: 'Send your brief, references, video length, deadline and expected budget by Email ({email}), Zalo or WhatsApp ({phone}).',
      },
      {
        q: 'What is the price?',
        a: 'The price depends on video length, visual complexity, style and deadline. Send a short brief and Yuuta will provide a clear quote before starting.',
      },
      {
        q: 'What kinds of videos can you create?',
        a: 'Motion Graphics: Logo Intros, SaaS Explainer Videos, Kinetic Typography... MV Edit: Anime MVs, Manga Animation, Lyric Videos... AI Video: Short Commercials, Short Concept Visuals, fully AI-generated short videos...',
      },
      {
        q: 'I have another question.',
        a: 'You can contact Yuuta directly by Email ({email}), Zalo or WhatsApp ({phone}).',
      },
    ],
  },
  vi: {
    work: 'Tác phẩm',
    contact: 'Liên hệ',
    share: 'Chia sẻ',
    shared: 'Đã sao chép liên kết website!',
    hello: 'Xin chào! Mình là Yuuta',
    showMore: 'Xem thêm',
    showLess: 'Thu gọn',
    play: 'Phát video',
    empty: 'Dự án mới đang được chuẩn bị!',
    emptyNote:
      'Yuuta đang cập nhật tác phẩm cho danh mục này. Hãy quay lại sớm nhé ✦',
    contactSub:
      'Để đặt dự án hoặc hợp tác, hãy bấm vào thẻ để sao chép liên hệ.',
    copied: 'Đã sao chép!',
    watchOn: 'Xem trên',
    unavailable: 'Video này không thể nhúng trực tiếp.',
    botName: 'YUUTA BOT',
    online: 'Trực tuyến',
    botHello: 'Xin chào! Mình là Yuuta Bot ✦ Bạn muốn biết điều gì?',
    faq: [
      {
        q: 'Tôi gửi yêu cầu bằng cách nào?',
        a: 'Hãy gửi brief, video tham khảo, thời lượng, thời hạn và ngân sách dự kiến qua Email ({email}), Zalo hoặc WhatsApp ({phone}).',
      },
      {
        q: 'Giá bao nhiêu?',
        a: 'Chi phí tùy vào thời lượng, độ phức tạp, phong cách và thời hạn. Bạn gửi brief ngắn, Yuuta sẽ báo giá rõ ràng trước khi bắt đầu.',
      },
      {
        q: 'Bạn có thể tạo ra những loại video nào?',
        a: 'Motion Graphics: Logo Intro, SaaS Explainer Video, Kinetic Typography... MV Edit: Anime MV, Manga Animation, Lyric Video... AI Video: Quảng cáo ngắn, Concept Visual ngắn, video ngắn được tạo hoàn toàn bằng AI...',
      },
      {
        q: 'Tôi có một câu hỏi khác.',
        a: 'Bạn có thể liên hệ trực tiếp với Yuuta qua Email ({email}), Zalo hoặc WhatsApp ({phone}).',
      },
    ],
  },
};

const backgroundDecorations = [
  ['✦', '7%', '15%', '16px', '0s', '6s'],
  ['✧', '20%', '42%', '22px', '1.2s', '8s'],
  ['◆', '34%', '12%', '13px', '2.8s', '7s'],
  ['✦', '47%', '68%', '18px', '.6s', '9s'],
  ['✧', '61%', '27%', '25px', '3.5s', '8s'],
  ['✦', '74%', '54%', '15px', '2s', '6s'],
  ['◆', '88%', '18%', '12px', '4s', '9s'],
  ['✧', '94%', '73%', '21px', '1.8s', '7s'],
  ['✦', '12%', '82%', '18px', '3s', '8s'],
  ['◆', '28%', '91%', '11px', '.3s', '6s'],
  ['✧', '55%', '88%', '17px', '4.6s', '9s'],
  ['✦', '82%', '92%', '24px', '2.4s', '7s'],
] as const;

const socialIcons: Record<string, IconType> = {
  bilibili: SiBilibili,
  discord: SiDiscord,
  douyin: SiTiktok,
  gmail: SiGmail,
  instagram: SiInstagram,
  payhip: SiPayhip,
  threads: SiThreads,
  tiktok: SiTiktok,
  whatsapp: SiWhatsapp,
  x: SiX,
  youtube: SiYoutube,
  zalo: SiZalo,
};

function SocialGlyph({ platform }: { platform: string }) {
  const BrandIcon = socialIcons[platform.toLowerCase()];
  return BrandIcon ? (
    <BrandIcon aria-hidden="true" />
  ) : (
    <ExternalLink aria-hidden="true" />
  );
}

function SocialDock({ socials }: { socials: SocialLink[] }) {
  if (!socials.length) return null;
  return (
    <TooltipProvider delay={250}>
      <div className="social-dock" aria-label="Social links">
        {socials.map((social) => {
          const external =
            !social.url.startsWith('mailto:') && !social.url.startsWith('tel:');
          return (
            <Tooltip key={social.id}>
              <TooltipTrigger
                render={
                  <a
                    href={social.url}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                    aria-label={social.label}
                  />
                }
              >
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
  return (
    <div className="cute-section-title">
      <span>✦</span>
      <h2>{children}</h2>
      <span>✦</span>
    </div>
  );
}

function ProjectCard({
  project,
  language,
  index,
  onOpen,
}: {
  project: Project;
  language: Language;
  index: number;
  onOpen: () => void;
}) {
  const title = language === 'en' ? project.titleEn : project.titleVi;
  return (
    <article
      className="portfolio-card reveal-item"
      style={{ transitionDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <button
        className={`project-thumb platform-${project.platform}`}
        onClick={onOpen}
        aria-label={`${ui[language].play}: ${title}`}
        style={
          project.thumbnailUrl
            ? { backgroundImage: `url(${project.thumbnailUrl})` }
            : undefined
        }
      >
        {!project.thumbnailUrl && (
          <Image
            src="/yuuta-logo-sapphire-v5.png"
            alt=""
            width={1399}
            height={1124}
          />
        )}
        <span className="platform-corner">
          {platformName(project.platform)}
        </span>
        <span className="play-bubble">
          <i>
            <Play fill="currentColor" />
          </i>
        </span>
      </button>
      <div className="portfolio-card-body">
        <p>{title}</p>
        <div className="portfolio-card-actions">
          <button onClick={onOpen}>{ui[language].play}</button>
          <a href={project.videoUrl} target="_blank" rel="noreferrer">
            {platformName(project.platform)} ↗
          </a>
        </div>
      </div>
    </article>
  );
}

function VideoDialog({
  project,
  open,
  onOpenChange,
  language,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
}) {
  const parsed = project ? parseVideoUrl(project.videoUrl) : null;
  const title = project
    ? language === 'en'
      ? project.titleEn
      : project.titleVi
    : '';
  const description = project
    ? language === 'en'
      ? project.descriptionEn
      : project.descriptionVi
    : '';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="video-dialog" aria-label={title}>
        <DialogHeader className="video-dialog-header">
          <span className="window-dot dark" />
          <span className="window-dot cyan" />
          <div>
            <DialogTitle>{title}</DialogTitle>
            {project && (
              <DialogDescription>
                {project.category} · {platformName(project.platform)}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        {project && parsed ? (
          <div className={`player-shell ${parsed.vertical ? 'vertical' : ''}`}>
            <iframe
              key={parsed.embedUrl}
              src={parsed.embedUrl}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : project ? (
          <div className="player-fallback">
            <p>{ui[language].unavailable}</p>
          </div>
        ) : null}
        {(description || project) && (
          <div className="video-dialog-footer">
            {description && <p>{description}</p>}
            {project && (
              <a href={project.videoUrl} target="_blank" rel="noreferrer">
                {ui[language].watchOn} {platformName(project.platform)}{' '}
                <ExternalLink />
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <button className="cute-contact-card reveal-item" onClick={onCopy}>
      <span className="cute-contact-icon">{icon}</span>
      <span className="cute-contact-info">
        <b>{label}</b>
        <strong>{value}</strong>
      </span>
      <Copy className="contact-copy-icon" />
    </button>
  );
}

function YuutaBot({
  language,
  email,
  phone,
}: {
  language: Language;
  email: string;
  phone: string;
}) {
  const t = ui[language];
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [typing, setTyping] = useState(false);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuestion('');
    setAnswer('');
    setTyping(false);
    if (answerTimer.current) clearTimeout(answerTimer.current);
    return () => {
      if (answerTimer.current) clearTimeout(answerTimer.current);
    };
  }, [language]);

  const ask = (nextQuestion: string, nextAnswer: string) => {
    if (answerTimer.current) clearTimeout(answerTimer.current);
    setQuestion(nextQuestion);
    setAnswer('');
    setTyping(true);
    answerTimer.current = setTimeout(() => {
      setTyping(false);
      setAnswer(nextAnswer);
    }, 520);
  };

  const faq = t.faq.map((item) => ({
    q: item.q,
    a: item.a.replace('{email}', email).replace('{phone}', phone),
  }));

  return (
    <>
      <aside
        className={`chat-panel ${open ? 'open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="chat-head">
          <Image
            src="/yuuta-flame-sapphire-v3.png"
            alt=""
            width={1254}
            height={1254}
          />
          <b>{t.botName}</b>
          <span>{t.online}</span>
          <button onClick={() => setOpen(false)} aria-label="Close chat">
            ×
          </button>
        </div>
        <div className="chat-body">
          <p className="chat-message bot">{t.botHello}</p>
          {question && <p className="chat-message user">{question}</p>}
          {typing && (
            <p className="chat-message bot typing">
              <i />
              <i />
              <i />
            </p>
          )}
          {answer && <p className="chat-message bot">{answer}</p>}
          <div className="chat-chips">
            {faq.map((item) => (
              <button key={item.q} onClick={() => ask(item.q, item.a)}>
                {item.q}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <button
        className="chat-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label="FAQ chat"
        aria-expanded={open}
      >
        <Image
          src="/yuuta-flame-sapphire-v3.png"
          alt=""
          width={1254}
          height={1254}
        />
        <span />
      </button>
    </>
  );
}

export function PortfolioClient({
  initialContent,
}: {
  initialContent: PortfolioContent;
}) {
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

  const filtered = useMemo(
    () => projects.filter((project) => project.category === category),
    [projects, category],
  );
  const shown = filtered.slice(0, visible);
  const role = language === 'en' ? settings.roleEn : settings.roleVi;
  const headline =
    language === 'en' ? settings.headlineEn : settings.headlineVi;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const sparkle = (event: PointerEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const symbols = ['✦', '✧', '◆', '✦', '◇'];
      for (let index = 0; index < symbols.length; index += 1) {
        const particle = document.createElement('span');
        const angle =
          (Math.PI * 2 * index) / symbols.length + Math.random() * 0.7;
        particle.className = 'click-spark';
        particle.textContent = symbols[index];
        particle.style.left = `${event.clientX - 7}px`;
        particle.style.top = `${event.clientY - 7}px`;
        particle.style.setProperty(
          '--spark-x',
          `${Math.cos(angle) * (30 + Math.random() * 26)}px`,
        );
        particle.style.setProperty(
          '--spark-y',
          `${Math.sin(angle) * (30 + Math.random() * 26)}px`,
        );
        document.body.appendChild(particle);
        window.setTimeout(() => particle.remove(), 750);
      }
    };
    document.addEventListener('pointerdown', sparkle);
    return () => document.removeEventListener('pointerdown', sparkle);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('shown');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll('.reveal-item')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [category, shown.length]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(''), 2800);
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showToast(t.copied);
  };

  const shareWebsite = async () => {
    await copyText(window.location.origin);
    showToast(t.shared);
  };

  const changeCategory = (next: Category, scroll = false) => {
    setCategory(next);
    setVisible(6);
    if (scroll)
      window.setTimeout(
        () =>
          document
            .getElementById('work')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        30,
      );
  };

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
    <main className="yuuta-site">
      <div className="background-decorations" aria-hidden="true">
        {backgroundDecorations.map(
          ([symbol, left, top, size, delay, duration], index) => (
            <span
              key={`${symbol}-${index}`}
              style={{
                left,
                top,
                fontSize: size,
                animationDelay: delay,
                animationDuration: duration,
              }}
            >
              {symbol}
            </span>
          ),
        )}
      </div>

      <header className="site-header">
        <div className="header-inner">
          <a className="header-brand" href="#top" aria-label="Yuuta home">
            <Image
              src="/yuuta-logo-sapphire-v5.png"
              alt="Yuuta"
              width={1399}
              height={1124}
              priority
            />
          </a>
          <nav aria-label="Main navigation">
            <a href="#work">{t.work}</a>
            <a href="#contact">{t.contact}</a>
            <button
              className="share-button"
              onClick={() => void shareWebsite()}
              aria-label={t.share}
            >
              <Link2 />
            </button>
            <div
              className="language-switch"
              data-language={language}
              aria-label="Language"
            >
              <span className="language-pill" />
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <button
                className={language === 'vi' ? 'active' : ''}
                onClick={() => setLanguage('vi')}
                aria-pressed={language === 'vi'}
              >
                VI
              </button>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <Image
          className="hero-logo"
          src="/yuuta-logo-sapphire-v5.png"
          alt="Yuuta logo"
          width={1399}
          height={1124}
          priority
        />
        <p className="hero-hello">
          {t.hello} — {role} ✦
        </p>
        <p className="hero-tagline">{headline} ✦</p>
        <SocialDock socials={socials} />
        <div
          className="hero-badges"
          role="tablist"
          aria-label="Project categories"
        >
          {categories.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={category === item}
              className={`hero-badge ${category === item ? 'active' : ''}`}
              onClick={() => changeCategory(item, true)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="cute-section works-section" id="work">
        <SectionTitle>WORKS</SectionTitle>
        {shown.length ? (
          <>
            <div className="portfolio-grid">
              {shown.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  language={language}
                  index={index}
                  onOpen={() => openProject(project)}
                />
              ))}
            </div>
            {filtered.length > 6 && (
              <div className="more-row">
                <button
                  className={`more-button ${visible >= filtered.length ? 'less' : ''}`}
                  onClick={() =>
                    setVisible((count) =>
                      count >= filtered.length ? 6 : filtered.length,
                    )
                  }
                >
                  {visible >= filtered.length
                    ? t.showLess
                    : `${t.showMore} (+${filtered.length - visible})`}{' '}
                  <ArrowDown />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="cute-empty reveal-item">
            <Image
              src="/yuuta-logo-sapphire-v5.png"
              alt=""
              width={1399}
              height={1124}
            />
            <h3>{t.empty}</h3>
            <p>{t.emptyNote}</p>
          </div>
        )}
      </section>

      <section className="cute-section contact-cute-section" id="contact">
        <SectionTitle>CONTACT</SectionTitle>
        <p className="cute-section-sub">{t.contactSub}</p>
        <div className="cute-contact-cards">
          <ContactCard
            icon={<SiGmail />}
            label="E-MAIL"
            value={settings.email}
            onCopy={() => void copyText(settings.email)}
          />
          <ContactCard
            icon={<SiZalo />}
            label="ZALO"
            value={settings.phone}
            onCopy={() => void copyText(settings.phone)}
          />
          <ContactCard
            icon={<SiWhatsapp />}
            label="WHATSAPP"
            value={settings.phone}
            onCopy={() => void copyText(settings.phone)}
          />
        </div>
      </section>

      <footer className="cute-footer">
        <button
          className="footer-flame"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <Image
            src="/yuuta-flame-sapphire-v3.png"
            alt=""
            width={1254}
            height={1254}
          />
        </button>
      </footer>

      <VideoDialog
        project={selectedProject}
        open={videoOpen}
        onOpenChange={handleVideoOpen}
        language={language}
      />
      <YuutaBot
        language={language}
        email={settings.email}
        phone={settings.phone}
      />
      {toastMessage && (
        <div className="site-toast" role="status">
          ✦ {toastMessage}
        </div>
      )}
    </main>
  );
}
