"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isManuallySet = theme !== "system";
  const isDark = resolvedTheme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleReset = () => {
    setTheme("system");
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Theme</h3>
        <p className="text-sm text-muted-foreground">
          {isManuallySet ? "Manual theme override active" : "Using device theme"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-medium text-sm">Light</span>
        </div>

        <Switch
          checked={isDark}
          onCheckedChange={handleToggle}
          className="mx-2"
        />

        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Dark</span>
          <span className="text-xl">🌙</span>
        </div>
      </div>

      {isManuallySet && (
        <button
          onClick={handleReset}
          className="w-full py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors"
        >
          Reset to system theme
        </button>
      )}
    </div>
  );
}
