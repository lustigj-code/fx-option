import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}
