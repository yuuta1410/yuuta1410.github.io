'use client';

/* oxlint-disable next/no-html-link-for-pages -- Native anchors avoid a Vinext RSC prefetch runtime error. */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  Category,
  PortfolioContent,
  Project,
  SiteSettings,
  SocialLink,
} from '@/lib/types';
import { SocialGlyph } from '@/components/social-glyph';
import {
  normalizeSocialPlatform,
  socialPlatformSuggestions,
} from '@/lib/socials';
import { parseVideoUrl, platformName } from '@/lib/video';
import { adminFetch, normalizeContent } from '@/src/api';

type AdminSection = 'projects' | 'profile' | 'socials';

const blankProject = (sortOrder = 0): Project => ({
  id: '',
  titleEn: '',
  titleVi: '',
  descriptionEn: '',
  descriptionVi: '',
  tagsEn: '',
  tagsVi: '',
  category: 'Motion Graphics',
  videoUrl: '',
  platform: 'youtube',
  thumbnailUrl: '',
  sortOrder,
  published: true,
  createdAt: '',
  updatedAt: '',
});

function thumbnailUrlError(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('/api/thumbnail?')) {
    const url = new URL(raw, 'https://portfolio.local');
    const key = url.searchParams.get('key') ?? '';
    return url.pathname === '/api/thumbnail' &&
      /^thumbnails\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(key)
      ? ''
      : 'Invalid uploaded thumbnail.';
  }
  try {
    if (new URL(raw).protocol === 'https:') return '';
  } catch {
    /* invalid URL */
  }
  return 'Use a valid HTTPS image URL.';
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function AdminClient({
  userEmail,
  signOutPath,
}: {
  userEmail: string;
  signOutPath: string;
}) {
  const [section, setSection] = useState<AdminSection>('projects');
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [project, setProject] = useState<Project>(blankProject());
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailResolving, setThumbnailResolving] = useState(false);
  const [resolvedThumbnail, setResolvedThumbnail] = useState({
    videoUrl: '',
    url: '',
  });
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setError('');
    try {
      const response = await adminFetch('/api/admin/content');
      if (!response.ok) throw new Error('Unable to load settings');
      const data = normalizeContent((await response.json()) as PortfolioContent);
      setContent(data);
      setSettings(data.settings);
      setSocials(data.socials);
      setProject((current) =>
        current.id ? current : blankProject(data.projects.length + 1),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load settings',
      );
    }
  };

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, []);

  const send = async (payload: Record<string, unknown>, success: string) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await adminFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        content?: PortfolioContent;
      };
      if (!response.ok || !data.content)
        throw new Error(data.error || 'Unable to save changes');
      const normalized = normalizeContent(data.content);
      setContent(normalized);
      setSettings(normalized.settings);
      setSocials(normalized.socials);
      setMessage(success);
      return normalized;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save changes',
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const parsedVideo = useMemo(
    () => parseVideoUrl(project.videoUrl),
    [project.videoUrl],
  );
  const automaticThumbnail =
    parsedVideo?.thumbnailUrl ||
    (resolvedThumbnail.videoUrl === project.videoUrl
      ? resolvedThumbnail.url
      : '');
  const hasCustomThumbnail = Boolean(
    project.thumbnailUrl && project.thumbnailUrl !== automaticThumbnail,
  );
  const currentThumbnailUrlError = thumbnailUrlError(project.thumbnailUrl);
  const automaticThumbnailPending = Boolean(
    parsedVideo &&
      !parsedVideo.thumbnailUrl &&
      !project.thumbnailUrl &&
      resolvedThumbnail.videoUrl !== project.videoUrl,
  );

  const updateProjectUrl = (videoUrl: string) => {
    const parsed = parseVideoUrl(videoUrl);
    setProject((current) => {
      const previousAutoThumbnail =
        parseVideoUrl(current.videoUrl)?.thumbnailUrl ||
        (resolvedThumbnail.videoUrl === current.videoUrl
          ? resolvedThumbnail.url
          : '');
      const hasCustomThumbnail = Boolean(
        current.thumbnailUrl && current.thumbnailUrl !== previousAutoThumbnail,
      );
      return {
        ...current,
        videoUrl,
        platform: parsed?.platform ?? current.platform,
        thumbnailUrl: hasCustomThumbnail
          ? current.thumbnailUrl
          : parsed?.thumbnailUrl || '',
      };
    });
    if (videoUrl !== resolvedThumbnail.videoUrl)
      setResolvedThumbnail({ videoUrl: '', url: '' });
  };

  useEffect(() => {
    if (
      !parsedVideo ||
      parsedVideo.thumbnailUrl ||
      project.thumbnailUrl ||
      resolvedThumbnail.videoUrl === project.videoUrl
    )
      return;

    const controller = new AbortController();
    const videoUrl = project.videoUrl;
    const task = window.setTimeout(async () => {
      setThumbnailResolving(true);
      try {
        const response = await adminFetch('/api/admin/thumbnail/resolve', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ videoUrl }),
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          error?: string;
          url?: string;
        };
        if (!response.ok)
          throw new Error(data.error || 'Unable to detect thumbnail');
        const url = data.url || '';
        setResolvedThumbnail({ videoUrl, url });
        if (url) {
          setProject((current) =>
            current.videoUrl === videoUrl && !current.thumbnailUrl
              ? { ...current, thumbnailUrl: url }
              : current,
          );
        }
      } catch {
        if (!controller.signal.aborted)
          setResolvedThumbnail({ videoUrl, url: '' });
      } finally {
        setThumbnailResolving(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [
    parsedVideo,
    project.thumbnailUrl,
    project.videoUrl,
    resolvedThumbnail.videoUrl,
  ]);

  const uploadThumbnail = async (file?: File) => {
    if (!file) return;
    const hasSupportedExtension = /\.(?:jpe?g|png|webp)$/i.test(file.name);
    if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        file.type,
      ) &&
      !hasSupportedExtension
    ) {
      setError('Use a JPG, JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The image must be 10 MB or smaller.');
      return;
    }

    setThumbnailUploading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await adminFetch('/api/admin/thumbnail', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !data.url)
        throw new Error(data.error || 'Unable to upload thumbnail');
      setProject((current) => ({ ...current, thumbnailUrl: data.url! }));
      setMessage('Thumbnail uploaded. Save the project to publish it.');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to upload thumbnail',
      );
    } finally {
      setThumbnailUploading(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const saveProject = async () => {
    const updated = await send(
      { action: 'save-project', project },
      project.id ? 'Project updated.' : 'Project published.',
    );
    if (updated) setProject(blankProject(updated.projects.length + 1));
  };

  const removeProject = async (id: string) => {
    if (deleteTarget !== id) {
      setDeleteTarget(id);
      return;
    }
    const updated = await send(
      { action: 'delete-project', id },
      'Project deleted.',
    );
    if (updated) {
      setDeleteTarget('');
      setProject(blankProject(updated.projects.length + 1));
    }
  };

  const updateSocial = (id: string, patch: Partial<SocialLink>) =>
    setSocials((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const moveSocial = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= socials.length) return;
    setSocials((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, position) => ({
        ...item,
        sortOrder: position + 1,
      }));
    });
  };
  const addSocial = () => {
    const id = `custom-${crypto.randomUUID()}`;
    setSocials((current) => [
      ...current,
      {
        id,
        platform: '',
        label: '',
        url: '',
        enabled: false,
        sortOrder: current.length + 1,
      },
    ]);
  };
  const removeSocial = (id: string) => {
    setSocials((current) =>
      current
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 })),
    );
  };

  if (!content || !settings) {
    return (
      <main className="admin-loading">
        {!error && <Loader2 className="spin" />}
        <p>{error || 'Loading Yuuta settings…'}</p>
        {error && <Button onClick={() => void load()}>Retry</Button>}
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <a className="mini-brand" href="/">
            YUUTA<span>®</span>
          </a>
          <p>Portfolio settings</p>
        </div>
        <nav aria-label="Settings sections">
          {(['projects', 'profile', 'socials'] as const).map((item) => (
            <Button
              key={item}
              variant={section === item ? 'default' : 'ghost'}
              onClick={() => setSection(item)}
            >
              {item === 'projects'
                ? 'Projects'
                : item === 'profile'
                  ? 'Profile'
                  : 'Social links'}
            </Button>
          ))}
        </nav>
        <div className="admin-account">
          <small>Signed in as</small>
          <strong>{userEmail}</strong>
          <a href={signOutPath}>Sign out</a>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Private studio</p>
            <h1>
              {section === 'projects'
                ? 'Project library'
                : section === 'profile'
                  ? 'Profile & contact'
                  : 'Social dock'}
            </h1>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/" aria-label="View website" />}
          >
            <ArrowLeft /> View website
          </Button>
        </header>

        {(message || error) && (
          <output className={`admin-notice ${error ? 'error' : ''}`}>
            {error || message}
          </output>
        )}

        {section === 'projects' && (
          <div className="admin-project-layout">
            <div className="admin-panel project-list-panel">
              <div className="panel-title">
                <div>
                  <h2>Projects</h2>
                  <p>{content.projects.length} saved</p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setProject(blankProject(content.projects.length + 1))
                  }
                >
                  <Plus /> New
                </Button>
              </div>
              <div className="admin-project-list">
                {content.projects.length === 0 && (
                  <div className="admin-empty">
                    <Video />
                    <p>No projects yet. Add your first video link.</p>
                  </div>
                )}
                {content.projects.map((item) => (
                  <button
                    className={project.id === item.id ? 'selected' : ''}
                    key={item.id}
                    onClick={() => {
                      setProject(item);
                      setDeleteTarget('');
                    }}
                  >
                    <span
                      className={`project-thumb platform-${item.platform}`}
                      style={
                        item.thumbnailUrl
                          ? { backgroundImage: `url(${item.thumbnailUrl})` }
                          : undefined
                      }
                    />
                    <span>
                      <strong>{item.titleEn}</strong>
                      <small>
                        {item.category} · {platformName(item.platform)}
                      </small>
                    </span>
                    <i className={item.published ? 'live' : ''}>
                      {item.published ? 'Live' : 'Draft'}
                    </i>
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-panel project-editor">
              <div className="panel-title">
                <div>
                  <h2>{project.id ? 'Edit project' : 'Add project'}</h2>
                  <p>Paste a public video link and publish.</p>
                </div>
                {parsedVideo && (
                  <span className="platform-pill">
                    {platformName(parsedVideo.platform)}
                  </span>
                )}
              </div>
              <div className="admin-form-grid">
                <Field
                  label="Video URL"
                  hint="YouTube, Vimeo, TikTok direct video or Instagram Reel/post."
                >
                  <Input
                    value={project.videoUrl}
                    onChange={(event) => updateProjectUrl(event.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                  />
                </Field>
                <Field label="Category">
                  <Select
                    value={project.category}
                    onValueChange={(value) =>
                      setProject({ ...project, category: value as Category })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {([
                        'Motion Graphics',
                        'AMV / MMV',
                        'Music Video',
                        'Other',
                      ] as Category[]).map((item) => (
                        <SelectItem value={item} key={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Title — English">
                  <Input
                    value={project.titleEn}
                    onChange={(event) =>
                      setProject({ ...project, titleEn: event.target.value })
                    }
                  />
                </Field>
                <Field label="Tiêu đề — Tiếng Việt">
                  <Input
                    value={project.titleVi}
                    onChange={(event) =>
                      setProject({ ...project, titleVi: event.target.value })
                    }
                  />
                </Field>
                <Field label="Description — English">
                  <Textarea
                    value={project.descriptionEn}
                    onChange={(event) =>
                      setProject({
                        ...project,
                        descriptionEn: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Mô tả — Tiếng Việt">
                  <Textarea
                    value={project.descriptionVi}
                    onChange={(event) =>
                      setProject({
                        ...project,
                        descriptionVi: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Tags — English" hint="Separate with commas.">
                  <Input
                    value={project.tagsEn}
                    onChange={(event) =>
                      setProject({ ...project, tagsEn: event.target.value })
                    }
                    placeholder="SaaS Motion, Typography"
                  />
                </Field>
                <Field label="Thẻ — Tiếng Việt">
                  <Input
                    value={project.tagsVi}
                    onChange={(event) =>
                      setProject({ ...project, tagsVi: event.target.value })
                    }
                  />
                </Field>
                <div className="admin-field admin-thumbnail-field">
                  <span>Thumbnail</span>
                  <div className="thumbnail-manager">
                    <div
                      className="thumbnail-preview"
                      style={
                        project.thumbnailUrl
                          ? {
                              backgroundImage: `url(${project.thumbnailUrl})`,
                            }
                          : undefined
                      }
                    >
                      {!project.thumbnailUrl && thumbnailResolving && (
                        <span>
                          <Loader2 className="spin" /> Finding original
                          thumbnail…
                        </span>
                      )}
                      {!project.thumbnailUrl && !thumbnailResolving && (
                        <span>
                          <ImageIcon /> No thumbnail selected
                        </span>
                      )}
                    </div>
                    <div className="thumbnail-actions">
                      <Input
                        ref={thumbnailInputRef}
                        className="thumbnail-file-input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        aria-label="Upload thumbnail image"
                        onChange={(event) =>
                          void uploadThumbnail(event.target.files?.[0])
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={thumbnailUploading}
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        {thumbnailUploading ? (
                          <Loader2 className="spin" />
                        ) : (
                          <Upload />
                        )}
                        {project.thumbnailUrl ? 'Replace image' : 'Upload image'}
                      </Button>
                      {hasCustomThumbnail && (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={thumbnailUploading}
                          onClick={() =>
                            setProject({
                              ...project,
                              thumbnailUrl: automaticThumbnail,
                            })
                          }
                        >
                          <Trash2 /> Remove image
                        </Button>
                      )}
                      <small>JPG, JPEG, PNG or WebP · maximum 10 MB.</small>
                    </div>
                  </div>
                  <label className="thumbnail-url-option">
                    <span>Image URL (optional)</span>
                    <Input
                      value={project.thumbnailUrl}
                      aria-invalid={Boolean(currentThumbnailUrlError)}
                      onChange={(event) =>
                        setProject({
                          ...project,
                          thumbnailUrl: event.target.value,
                        })
                      }
                      placeholder="https://…/cover.jpg"
                    />
                    <small>
                      Optional fallback. Original provider covers are detected
                      automatically when available.
                    </small>
                    {currentThumbnailUrlError && (
                      <small className="admin-field-error">
                        {currentThumbnailUrlError}
                      </small>
                    )}
                  </label>
                </div>
                <Field label="Display order">
                  <Input
                    type="number"
                    min="0"
                    value={project.sortOrder}
                    onChange={(event) =>
                      setProject({
                        ...project,
                        sortOrder: Number(event.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <div className="publish-row">
                <span>
                  <strong>Published</strong>
                  <small>Show this project on the public website.</small>
                </span>
                <Switch
                  aria-label="Publish this project"
                  checked={project.published}
                  onCheckedChange={(checked) =>
                    setProject({ ...project, published: checked })
                  }
                />
              </div>
              <div className="editor-actions">
                {project.id && (
                  <Button
                    variant="destructive"
                    onClick={() => void removeProject(project.id)}
                  >
                    <Trash2 />{' '}
                    {deleteTarget === project.id ? 'Confirm delete' : 'Delete'}
                  </Button>
                )}
                <Button
                  disabled={
                    saving ||
                    thumbnailUploading ||
                    thumbnailResolving ||
                    automaticThumbnailPending ||
                    Boolean(currentThumbnailUrlError) ||
                    !parsedVideo ||
                    !project.titleEn ||
                    !project.titleVi
                  }
                  onClick={() => void saveProject()}
                >
                  {saving ? <Loader2 className="spin" /> : <Save />} Save
                  project
                </Button>
              </div>
            </div>
          </div>
        )}

        {section === 'profile' && (
          <div className="admin-panel profile-editor">
            <div className="panel-title">
              <div>
                <h2>Identity, biography & contact</h2>
                <p>English is the default public language.</p>
              </div>
            </div>
            <div className="admin-form-grid">
              <Field label="Real name">
                <Input
                  value={settings.name}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Stage name">
                <Input
                  value={settings.stageName}
                  onChange={(e) =>
                    setSettings({ ...settings, stageName: e.target.value })
                  }
                />
              </Field>
              <section
                className="profile-language-column"
                aria-labelledby="profile-language-en"
              >
                <h3 id="profile-language-en">English</h3>
                <Field label="Role — English">
                  <Input
                    value={settings.roleEn}
                    onChange={(e) =>
                      setSettings({ ...settings, roleEn: e.target.value })
                    }
                  />
                </Field>
                <Field label="Headline — English">
                  <Textarea
                    value={settings.headlineEn}
                    onChange={(e) =>
                      setSettings({ ...settings, headlineEn: e.target.value })
                    }
                  />
                </Field>
                <Field label="Biography — English">
                  <Textarea
                    className="min-h-32"
                    value={settings.bioEn}
                    onChange={(e) =>
                      setSettings({ ...settings, bioEn: e.target.value })
                    }
                  />
                </Field>
              </section>
              <section
                className="profile-language-column"
                aria-labelledby="profile-language-vi"
                lang="vi"
              >
                <h3 id="profile-language-vi">Tiếng Việt</h3>
                <Field label="Vai trò — Tiếng Việt">
                  <Input
                    value={settings.roleVi}
                    onChange={(e) =>
                      setSettings({ ...settings, roleVi: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tiêu đề — Tiếng Việt">
                  <Textarea
                    value={settings.headlineVi}
                    onChange={(e) =>
                      setSettings({ ...settings, headlineVi: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tiểu sử — Tiếng Việt">
                  <Textarea
                    className="min-h-32"
                    value={settings.bioVi}
                    onChange={(e) =>
                      setSettings({ ...settings, bioVi: e.target.value })
                    }
                  />
                </Field>
              </section>
              <Field label="Contact email">
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Contact phone — used by Zalo & WhatsApp">
                <Input
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="editor-actions">
              <Button
                disabled={saving}
                onClick={() =>
                  void send(
                    { action: 'save-settings', settings },
                    'Profile updated.',
                  )
                }
              >
                <Save /> Save profile
              </Button>
            </div>
          </div>
        )}

        {section === 'socials' && (
          <div className="admin-panel socials-editor">
            <div className="panel-title">
              <div>
                <h2>Social links</h2>
                <p>
                  Only enabled links with a valid URL appear above the project
                  category tabs.
                </p>
              </div>
              <Button size="sm" onClick={addSocial}>
                <Plus /> New
              </Button>
            </div>
            <datalist id="social-platform-suggestions">
              {socialPlatformSuggestions.map((platform) => (
                <option value={platform} key={platform}>
                  {platform}
                </option>
              ))}
            </datalist>
            <div className="social-settings-list">
              {socials.map((social, index) => (
                <div className="social-setting" key={social.id}>
                  <span className="social-setting-icon">
                    <SocialGlyph platform={social.platform} />
                  </span>
                  <Input
                    value={social.platform}
                    list="social-platform-suggestions"
                    aria-label={`${social.label || 'New social'} platform`}
                    onChange={(e) =>
                      updateSocial(social.id, {
                        platform: normalizeSocialPlatform(e.target.value),
                      })
                    }
                    placeholder="Platform"
                  />
                  <Input
                    value={social.label}
                    aria-label={`${social.platform || 'New social'} label`}
                    onChange={(e) =>
                      updateSocial(social.id, { label: e.target.value })
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={social.url}
                    aria-label={`${social.platform || 'New social'} link`}
                    onChange={(e) =>
                      updateSocial(social.id, { url: e.target.value })
                    }
                    placeholder="https://…"
                  />
                  <div className="social-order">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveSocial(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={index === socials.length - 1}
                      onClick={() => moveSocial(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Switch
                    checked={social.enabled}
                    onCheckedChange={(checked) =>
                      updateSocial(social.id, { enabled: checked })
                    }
                    aria-label={`Show ${social.label}`}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${social.label || 'social link'}`}
                    onClick={() => removeSocial(social.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <div className="editor-actions">
              <Button
                disabled={saving}
                onClick={() =>
                  void send(
                    { action: 'save-socials', socials },
                    'Social dock updated.',
                  )
                }
              >
                <Save /> Save social links
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
