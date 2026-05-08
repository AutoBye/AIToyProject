"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";

export function Shell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const appTitle = "AI \ucf54\ub4dc \ubc0f \ub85c\uadf8 \ubd84\uc11d";
  const nextThemeLabel = dark ? "\ub77c\uc774\ud2b8 \ubaa8\ub4dc" : "\ub2e4\ud06c \ubaa8\ub4dc";
  const themeTitle = `${nextThemeLabel}\ub85c \uc804\ud658`;
  const logoutLabel = "\ub85c\uadf8\uc544\uc6c3";

  return (
    <main className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-panel/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-bold tracking-wide">{appTitle}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="h-9 gap-2 rounded-md border border-slate-900 bg-slate-900 px-3 text-white shadow-sm hover:bg-slate-800 dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950 dark:hover:bg-amber-100"
              title={themeTitle}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{nextThemeLabel}</span>
            </Button>
            <Button className="h-9 gap-2 bg-slate-700 px-3" title={logoutLabel} onClick={logout}>
              <LogOut size={18} />
              <span>{logoutLabel}</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}
