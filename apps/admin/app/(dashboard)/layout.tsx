import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { authOptions } from '@/lib/auth-options';

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="main-container">
      <Sidebar />
      <main className="content">
        <TopBar username={session.user?.name ?? 'Admin'} />
        {children}
      </main>
    </div>
  );
}
