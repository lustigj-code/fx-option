import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FX Option Control Room',
  description: 'Internal operator dashboard for quotes, payments, hedges and audit trails.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
