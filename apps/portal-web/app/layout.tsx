import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "FX Portal",
  description: "Modern hedging & exposure management portal"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text">
        <SessionProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 px-4 pb-16 pt-24 sm:px-8 lg:px-16 xl:px-24">
              {children}
            </main>
            <footer className="px-4 py-8 text-center text-xs text-text/60 sm:px-8">
              © {new Date().getFullYear()} FX Portal. All rights reserved.
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
