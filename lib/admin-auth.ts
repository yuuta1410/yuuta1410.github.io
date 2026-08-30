import { getChatGPTUser } from '@/app/chatgpt-auth';

const ADMIN_EMAILS = new Set([
  'yuuta141003@gmail.com',
  'vogiahuy141003@gmail.com',
]);

export function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    ADMIN_EMAILS.has(normalizedEmail) ||
    (process.env.NODE_ENV === 'development' &&
      normalizedEmail === 'seedy@sites.test')
  );
}

export async function isAdminRequest(): Promise<boolean> {
  const user = await getChatGPTUser();
  if (!user) return false;
  return isAdminEmail(user.email);
}
