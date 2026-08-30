import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { isAdminEmail } from '@/lib/admin-auth';
import { AdminClient } from '@/components/admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  if (!isAdminEmail(user.email)) {
    return (
      <main className="admin-denied">
        <p className="eyebrow">Private settings</p>
        <h1>Access denied</h1>
        <p>This settings area belongs to Yuuta.</p>
        <a className="primary-action" href={chatGPTSignOutPath('/')}>Sign out</a>
      </main>
    );
  }
  return <AdminClient userEmail={user.email} signOutPath={chatGPTSignOutPath('/')} />;
}
