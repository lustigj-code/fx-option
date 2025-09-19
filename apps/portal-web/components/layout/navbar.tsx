"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useMemo } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#company", label: "Company" },
  { href: "#about", label: "About Us" }
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const linkElements = useMemo(
    () =>
      links.map((link) => {
        const isActive = link.href !== "#" && pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition hover:text-text ${
              isActive ? "text-text" : "text-text/70"
            }`}
          >
            {link.label}
          </Link>
        );
      }),
    [pathname]
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b border-white/5 bg-background/80 px-4 py-4 sm:px-8">
        <Link href="/" className="text-lg font-semibold">
          FX Portal
        </Link>
        <nav className="hidden items-center gap-6 md:flex">{linkElements}</nav>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-text/70 sm:inline">{session.user?.name}</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-accent/40 px-4 py-1.5 text-sm font-semibold text-text transition hover:border-accent hover:bg-accent/20"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signIn()}
                className="rounded-full border border-accent/40 px-4 py-1.5 text-sm font-semibold text-text transition hover:border-accent hover:bg-accent/20"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => signIn("credentials")}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition hover:translate-y-0.5"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
