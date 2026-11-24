import { intlLocale } from "@/lib/i18n";

// Dates come from the API as ISO strings. Short, unambiguous formats: "12 Nov 2026", "12 Nov 2026, 14:05",
// written in the language of the interface (English, French or Kinyarwanda).

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const locale = intlLocale();
  const id = `${locale}|${key}`;
  let f = formatters.get(id);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatters.set(id, f);
  }
  return f;
}

const parse = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? formatter("date", { day: "numeric", month: "short", year: "numeric" }).format(d) : "—";
};

export const formatDateTime = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? formatter("dateTime", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d) : "—";
};

const time = () => formatter("time", { hour: "2-digit", minute: "2-digit" });

/** "14:05" for today, "12 Nov, 14:05" for earlier days. */
export const formatMessageTime = (iso: string | null | undefined, now: Date = new Date()): string => {
  const d = parse(iso);
  if (!d) return "";
  return d.toDateString() === now.toDateString() ? time().format(d) : formatter("dayAndTime", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
};

/** "14:05" for today, "12 Nov" for earlier days. For the conversation list. */
export const formatMessageDay = (iso: string | null | undefined, now: Date = new Date()): string => {
  const d = parse(iso);
  if (!d) return "";
  return d.toDateString() === now.toDateString() ? time().format(d) : formatter("day", { day: "numeric", month: "short" }).format(d);
};
