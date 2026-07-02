"use client";

// Light/dark toggle in the header. The chosen theme is kept in
// localStorage; a small inline script in the layout applies it before
// paint so there is no flash of the wrong theme on load.
//
// Both icons are always rendered and CSS (the dark: variant) decides which
// one shows -- no state, so server and client render identical DOM.

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing can block storage; the toggle still works for
      // the current page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light or dark mode"
      title="Toggle light or dark mode"
      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
