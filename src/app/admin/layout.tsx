import { headers } from 'next/headers';
import { AdminShell } from '@/components/admin/AdminShell';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') ?? '/admin';
  const forwardedFor = headerList.get('x-forwarded-for') ?? headerList.get('cf-connecting-ip') ?? 'unknown';
  const email = headerList.get('cf-access-authenticated-user-email');
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? '';

  await trackAnalyticsEvent({
    eventName: 'admin_page_view',
    channel: 'admin-web',
    eventKey: `${host}:${pathname}:${email ?? forwardedFor}`,
    metadata: {
      pathname,
      host,
      email,
      forwardedFor,
    },
  }).catch((error) => {
    console.warn('Failed to record admin page view audit event:', error);
  });

  return <AdminShell pathname={pathname}>{children}</AdminShell>;
}
