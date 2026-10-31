'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Theme = 'system' | 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
    if (match && (match[1] === 'light' || match[1] === 'dark' || match[1] === 'system')) {
      setTheme(match[1] as Theme);
    }
  }, []);

  const cycleTheme = () => {
    let nextTheme: Theme = 'light';
    if (theme === 'system') nextTheme = 'light';
    else if (theme === 'light') nextTheme = 'dark';
    else nextTheme = 'system';

    setTheme(nextTheme);
    document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;

    const isDark =
      nextTheme === 'dark' ||
      (nextTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={`Theme: ${theme}. Click to change.`}
      aria-label={`Current theme is ${theme}. Click to change theme.`}
      className="text-ink hover:text-brand"
    >
      {theme === 'system' && <Laptop className="h-4 w-4" />}
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
    </Button>
  );
}
