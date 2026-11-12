import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useI18n, LANGUAGES } from "@/lib/i18n";

/** Sélecteur de langue (globe + menu). Le français reste la langue de secours. */
export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Changer la langue / Change language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-bk/10 bg-white px-3 py-1.5 text-sm font-semibold text-bk-ink shadow-sm hover:bg-bk-mint"
      >
        <Globe className="h-4 w-4 text-bk" />
        {!compact && <span className="hidden sm:inline">{current.native}</span>}
        <span className="uppercase">{current.code}</span>
        <ChevronDown className="h-4 w-4 text-bk-ink/60" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-bk/10 bg-white py-1 shadow-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-bk-mint ${
                l.code === lang ? "font-semibold text-bk" : "text-bk-ink"
              }`}
            >
              <span className="w-6 text-center">{l.flag}</span>
              <span className="flex-1">{l.native}</span>
              <span className="text-[10px] uppercase text-bk-ink/40">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
