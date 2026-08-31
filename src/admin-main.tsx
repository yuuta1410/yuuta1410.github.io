/* oxlint-disable react/react-compiler, next/no-html-link-for-pages -- Auth state is initialized from the callback URL; this static app uses native links. */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminClient } from '@/components/admin-client';
import { apiUrl, getAdminToken, setAdminToken } from '@/src/api';
import '@/app/globals.css';
import '@/app/portfolio.css';

type AuthState = 'checking' | 'signed-out' | 'signed-in' | 'denied';

function AdminApp() {
  const [state, setState] = useState<AuthState>('checking');
  const [message, setMessage] = useState('Checking owner access…');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('logout') === '1') {
      setAdminToken('');
      history.replaceState({}, '', '/admin/');
      setState('signed-out');
      return;
    }

    const code = params.get('code');
    const error = params.get('error');
    if (error) {
      history.replaceState({}, '', '/admin/');
      setMessage(
        error === 'access_denied'
          ? 'This GitHub account is not authorized.'
          : 'Authentication failed. Please try again.',
      );
      setState('denied');
      return;
    }

    if (code) {
      fetch(apiUrl('/auth/exchange'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(async (response) => {
          const body = (await response.json()) as {
            token?: string;
            error?: string;
          };
          if (!response.ok || !body.token)
            throw new Error(body.error || 'Authentication failed');
          setAdminToken(body.token);
          history.replaceState({}, '', '/admin/');
          setState('signed-in');
        })
        .catch((cause: unknown) => {
          setMessage(
            cause instanceof Error ? cause.message : 'Authentication failed.',
          );
          setState('denied');
        });
      return;
    }

    setState(getAdminToken() ? 'signed-in' : 'signed-out');
  }, []);

  if (state === 'signed-in') {
    return (
      <AdminClient userEmail="@yuuta1410" signOutPath="/admin/?logout=1" />
    );
  }

  return (
    <main className="admin-denied">
      <p className="eyebrow">Private settings</p>
      <h1>{state === 'checking' ? 'Owner verification' : 'Yuuta Admin'}</h1>
      <p>
        {state === 'checking'
          ? message
          : state === 'denied'
            ? message
            : 'Sign in with the owner GitHub account to manage this portfolio.'}
      </p>
      {state !== 'checking' && (
        <a className="primary-action" href={apiUrl('/auth/login')}>
          Sign in with GitHub
        </a>
      )}
      <a href="/">Back to portfolio</a>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<AdminApp />);
