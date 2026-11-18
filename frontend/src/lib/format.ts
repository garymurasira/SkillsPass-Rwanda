// Dates come from the API as ISO strings. Short, unambiguous formats: "12 Nov 2026", "12 Nov 2026, 14:05".

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const parse = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? date.format(d) : "—";
};

export const formatDateTime = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? dateTime.format(d) : "—";
};
