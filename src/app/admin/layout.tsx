import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') ?? '/admin';
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? '';

  if (host && !host.includes('admin.recipekeeper.org') && process.env.NODE_ENV === 'production') {
    redirect('/dashboard');
  }

  return <AdminShell pathname={pathname}>{children}</AdminShell>;
}
