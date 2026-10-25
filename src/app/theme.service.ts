import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'ledgerTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const stored = this.getStoredTheme();
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.apply(stored !== null ? stored : !!prefersDark, false);
  }

  private getStoredTheme(): boolean | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return null;
    } catch {
      return null;
    }
  }

  toggleTheme() {
    this.apply(!this.isDark(), true);
  }

  private apply(dark: boolean, persist: boolean) {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
      } catch {
        // localStorage not available, fail silently
      }
    }
  }
}