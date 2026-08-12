"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  isLocale,
  translate,
  type DictionaryKey,
  type Locale,
} from "./dictionary";

type TranslateFn = (
  key: DictionaryKey,
  params?: Readonly<Record<string, string | number>>,
) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LOCALE_EVENT = "aura-locale-change";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocale(stored)) {
      return stored;
    }
  } catch {
    return DEFAULT_LOCALE;
  }

  return DEFAULT_LOCALE;
}

function subscribeLocale(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LOCALE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCALE_EVENT, onStoreChange);
  };
}

function getLocaleSnapshot(): Locale {
  return readStoredLocale();
}

function writeLocaleCookie(locale: Locale): void {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=${maxAge};samesite=lax`;
  } catch {
    // Ignore cookie failures (privacy mode); localStorage + event still update UI.
  }
}

function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore quota / private mode failures; in-memory listeners still update via event.
  }
  writeLocaleCookie(locale);
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  /** SSR-resolved locale from cookie so server and first paint agree. */
  initialLocale?: Locale;
}) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    () => initialLocale,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    writeLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      <div data-locale={locale}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
