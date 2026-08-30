'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
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
import { parseVideoUrl, platformName } from '@/lib/video';

type AdminSection = 'projects' | 'profile' | 'socials';

const blankProject = (sortOrder = 0): Project => ({
  id: '',
  titleEn: '',
  titleVi: '',
  descriptionEn: '',
  descriptionVi: '',
  tagsEn: '',
  tagsVi: '',
  category: 'MOTION',
  videoUrl: '',
  platform: 'youtube',
  thumbnailUrl: '',
  sortOrder,
  published: true,
  createdAt: '',
  updatedAt: '',
});

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

  const load = async () => {
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load settings');
      const data = (await response.json()) as PortfolioContent;
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
    void load();
  }, []);

  const send = async (payload: Record<string, unknown>, success: string) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/content', {
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
      setContent(data.content);
      setSettings(data.content.settings);
      setSocials(data.content.socials);
      setMessage(success);
      return data.content;
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

  const updateProjectUrl = (videoUrl: string) => {
    const parsed = parseVideoUrl(videoUrl);
    setProject((current) => ({
      ...current,
      videoUrl,
      platform: parsed?.platform ?? current.platform,
      thumbnailUrl: current.thumbnailUrl || parsed?.thumbnailUrl || '',
    }));
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

  if (!content || !settings) {
    return (
      <main className="admin-loading">
        <Loader2 className="spin" />
        <p>{error || 'Loading Yuuta settings…'}</p>
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
            render={<a href="/" />}
          >
            <ArrowLeft /> View website
          </Button>
        </header>

        {(message || error) && (
          <div role="status" className={`admin-notice ${error ? 'error' : ''}`}>
            {error || message}
          </div>
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
                      {(['MOTION', 'MV EDIT', 'AI VIDEO'] as Category[]).map(
                        (item) => (
                          <SelectItem value={item} key={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
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
                <Field label="Title — Vietnamese">
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
                <Field label="Description — Vietnamese">
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
                <Field label="Tags — Vietnamese">
                  <Input
                    value={project.tagsVi}
                    onChange={(event) =>
                      setProject({ ...project, tagsVi: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Custom thumbnail URL"
                  hint="Optional. YouTube covers are detected automatically."
                >
                  <Input
                    value={project.thumbnailUrl}
                    onChange={(event) =>
                      setProject({
                        ...project,
                        thumbnailUrl: event.target.value,
                      })
                    }
                    placeholder="https://…/cover.jpg"
                  />
                </Field>
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
              <label className="publish-row">
                <span>
                  <strong>Published</strong>
                  <small>Show this project on the public website.</small>
                </span>
                <Switch
                  checked={project.published}
                  onCheckedChange={(checked) =>
                    setProject({ ...project, published: checked })
                  }
                />
              </label>
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
                <h2>Identity & biography</h2>
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
              <Field label="Role — English">
                <Input
                  value={settings.roleEn}
                  onChange={(e) =>
                    setSettings({ ...settings, roleEn: e.target.value })
                  }
                />
              </Field>
              <Field label="Role — Vietnamese">
                <Input
                  value={settings.roleVi}
                  onChange={(e) =>
                    setSettings({ ...settings, roleVi: e.target.value })
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
              <Field label="Headline — Vietnamese">
                <Textarea
                  value={settings.headlineVi}
                  onChange={(e) =>
                    setSettings({ ...settings, headlineVi: e.target.value })
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
              <Field label="Biography — Vietnamese">
                <Textarea
                  className="min-h-32"
                  value={settings.bioVi}
                  onChange={(e) =>
                    setSettings({ ...settings, bioVi: e.target.value })
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone used by Zalo & WhatsApp">
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
                  Only enabled links with a valid URL appear above the MOTION,
                  MV EDIT and AI VIDEO tabs.
                </p>
              </div>
            </div>
            <div className="social-settings-list">
              {socials.map((social, index) => (
                <div className="social-setting" key={social.id}>
                  <span className="social-setting-icon">
                    {social.label.slice(0, 2).toUpperCase()}
                  </span>
                  <Input
                    value={social.label}
                    aria-label={`${social.platform} label`}
                    onChange={(e) =>
                      updateSocial(social.id, { label: e.target.value })
                    }
                  />
                  <Input
                    value={social.url}
                    aria-label={`${social.platform} link`}
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
