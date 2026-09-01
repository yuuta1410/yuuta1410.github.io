/// <reference types="vite/client" />

import type { PortfolioContent } from '@/lib/types';

export const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  'https://yuuta-portfolio-api.yuuta-1410.workers.dev'
).replace(/\/$/, '');

const TOKEN_KEY = 'yuuta-admin-token';

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function normalizeContent(content: PortfolioContent): PortfolioContent {
  return {
    ...content,
    projects: content.projects.map((project) => ({
      ...project,
      thumbnailUrl: project.thumbnailUrl.startsWith('/')
        ? apiUrl(project.thumbnailUrl)
        : project.thumbnailUrl,
    })),
  };
}

export function getAdminToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token: string): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAdminToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (response.status === 401 && token) {
    setAdminToken('');
    window.location.replace('/admin/');
  }
  return response;
}
