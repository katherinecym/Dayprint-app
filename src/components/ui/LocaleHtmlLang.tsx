"use client";

import { useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { htmlLangOf } from "@/lib/i18n";

/**
 * Keeps `<html lang>` in sync with the in-app language switch.
 *
 * `app/layout.tsx` is a server component and cannot read the user's language
 * (it lives in localStorage, hydrated client-side), so it shipped a hardcoded
 * `lang="en"`. That is wrong the moment a Chinese user switches to 中文:
 * screen readers pick the English voice, Chrome stops offering to translate,
 * and the `:lang()` CSS selectors in globals.css never fire. This component
 * patches the attribute after hydration.
 *
 * SSR keeps `lang="en"` to match the pre-hydration default and avoid a
 * hydration mismatch; the effect corrects it on the first paint after mount.
 */
export function LocaleHtmlLang() {
  const { language } = useMemory();

  useEffect(() => {
    const el = document.documentElement;
    const next = htmlLangOf(language);
    if (el.lang !== next) el.lang = next;
  }, [language]);

  return null;
}
