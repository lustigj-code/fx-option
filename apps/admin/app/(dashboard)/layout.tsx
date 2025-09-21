import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { authOptions } from '@/lib/auth-options';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  if ((session as any).requiresMfa) {
    redirect(`/auth/mfa?callbackUrl=${encodeURIComponent('/')}`);
  }

  const displayName = session.user.name ?? session.user.email ?? 'Operator';

  return (
    <div className="main-container">
      <Sidebar />
      <main className="content">
        <TopBar username={displayName} />
        {children}
      </main>
    </div>
  );
}
