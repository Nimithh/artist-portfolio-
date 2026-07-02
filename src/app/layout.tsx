import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "./theme-toggle";
import "./globals.css";

// Runs before paint so a dark-mode visitor never sees a white flash.
// Static string only -- no user input goes anywhere near it.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="font-heading text-xl font-semibold tracking-tight transition-colors hover:text-accent"
            >
              Artist Portfolio
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <ThemeToggle />
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Browse
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-accent px-4 py-1.5 text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-accent px-4 py-1.5 text-accent-foreground transition-colors hover:bg-accent-hover"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-border py-6">
          <p className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground sm:px-6">
            Artist Portfolio
          </p>
        </footer>
      </body>
    </html>
  );
}
