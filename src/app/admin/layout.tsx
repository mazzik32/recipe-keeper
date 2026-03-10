import { headers } from 'next/headers';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') ?? '/admin';

  return <AdminShell pathname={pathname}>{children}</AdminShell>;
}
