import { ReactNode } from 'react';

export default function AuthLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {children}
      </div>
    </div>
  );
}
