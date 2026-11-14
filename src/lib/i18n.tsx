import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Language, type TranslationSet } from "./translations";

export type { Language };

export const LANGUAGES: { code: Language; label: string; native: string; short: string }[] = [
  { code: "fr", label: "Français", native: "Français", short: "FR" },
  { code: "en", label: "Anglais", native: "English", short: "EN" },
  { code: "mo", label: "Mooré", native: "Mooré", short: "MO" },
  { code: "di", label: "Dioula", native: "Jùla", short: "DI" },
  { code: "ff", label: "Pular", native: "Pular", short: "FF" },
  { code: "gma", label: "Gourmanchéma", native: "Gourmanché", short: "GMA" },
];

const KEY = "boutikbf-lang";

type Ctx = {
  lang: Language;
  setLang: (l: Language) => void;
  t: TranslationSet;
};

const I18nContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Language | null;
      if (saved && translations[saved]) setLangState(saved);
    } catch {
      /* privé */
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* privé */
    }
    document.documentElement.lang =
      l === "mo" || l === "di" || l === "ff" || l === "gma" ? "fr" : l;
  };

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: translations[lang] ?? translations.fr }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
