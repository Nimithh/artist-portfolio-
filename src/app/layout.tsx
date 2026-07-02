import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artist Portfolio",
  description:
    "A home for artists to show their work. Browse artists, view their portfolios, and get in touch.",
};

async function getSessionUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 antialiased">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="font-heading text-xl font-semibold tracking-tight">
              Artist Portfolio
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-zinc-600 hover:text-zinc-900">
                Browse
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-zinc-900 px-4 py-1.5 text-white hover:bg-zinc-700"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-zinc-900 px-4 py-1.5 text-white hover:bg-zinc-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-200 py-6">
          <p className="mx-auto w-full max-w-6xl px-4 text-sm text-zinc-500 sm:px-6">
            Artist Portfolio
          </p>
        </footer>
      </body>
    </html>
  );
}
