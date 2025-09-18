import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export default function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="main-container">
      <Sidebar />
      <main className="content">
        <TopBar username={session.username} />
        {children}
      </main>
    </div>
  );
}
