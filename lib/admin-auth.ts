import { getChatGPTUser } from '@/app/chatgpt-auth';

export const ADMIN_EMAIL = 'vogiahuy141003@gmail.com';

export async function isAdminRequest(): Promise<boolean> {
  const user = await getChatGPTUser();
  if (!user) return false;
  const email = user.email.toLowerCase();
  return email === ADMIN_EMAIL || (process.env.NODE_ENV === 'development' && email === 'seedy@sites.test');
}
