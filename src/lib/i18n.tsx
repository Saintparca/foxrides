import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "tn";

const DICT = {
  en: {
    where_to: "Where to?",
    ready_to_drive: "Ready to drive",
    pickup: "Pickup",
    destination: "Destination",
    add_stop: "Add stop",
    remove: "Remove",
    stop: "Stop",
    schedule_ride: "Schedule for later",
    now: "Now",
    scheduled: "Scheduled",
    request_fox: "Request Fox",
    schedule_fox: "Schedule Fox",
    requesting: "Requesting…",
    estimated_fare: "Estimated fare",
    calculating: "Calculating route…",
    pick_dest_hint: "Pick a destination to estimate",
    view_history: "View ride history",
    home: "Home",
    work: "Work",
    manage: "Manage",
    cancel_ride: "Cancel ride",
    language: "Language",
  },
  tn: {
    where_to: "O ya kae?",
    ready_to_drive: "O ipaakantse go kgweetsa",
    pickup: "Kgweetsa",
    destination: "Kwa o yang teng",
    add_stop: "Oketsa boemelo",
    remove: "Tlosa",
    stop: "Boemelo",
    schedule_ride: "Rulaganya nako",
    now: "Jaanong",
    scheduled: "Go rulagantswe",
    request_fox: "Bitsa Fox",
    schedule_fox: "Rulaganya Fox",
    requesting: "Go kopiwa…",
    estimated_fare: "Tuelo e e lekanyeditsweng",
    calculating: "Go balwa tsela…",
    pick_dest_hint: "Tlhopha lefelo go bala tuelo",
    view_history: "Bona dipalangwa tse di fetileng",
    home: "Legae",
    work: "Tirong",
    manage: "Laola",
    cancel_ride: "Khansela palo",
    language: "Puo",
  },
} as const;

type Key = keyof typeof DICT["en"];

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en", setLang: () => {}, t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem("fox_lang") : null) as Lang | null;
    if (saved === "en" || saved === "tn") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("fox_lang", l);
  };
  const t = (k: Key) => (DICT[lang] as any)[k] ?? DICT.en[k] ?? k;
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border bg-card text-xs font-bold">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >EN</button>
      <button
        onClick={() => setLang("tn")}
        className={`px-2.5 py-1 ${lang === "tn" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >TN</button>
    </div>
  );
}
