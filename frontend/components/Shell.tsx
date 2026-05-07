"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";

export function Shell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-panel/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-sm font-bold tracking-wide">AI Code & Log Analyzer</div>
          <div className="flex items-center gap-2">
            <Button className="h-9 w-9 px-0" title="Toggle theme" onClick={() => setDark((value) => !value)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button className="h-9 w-9 px-0 bg-slate-700" title="Log out" onClick={logout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}
