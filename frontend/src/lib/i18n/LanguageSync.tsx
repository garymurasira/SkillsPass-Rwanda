import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { applyLanguage, rememberLanguage, storedLanguage } from "./index";

/**
 * Keeps the interface in the person's language: the one saved on their account when signed in,
 * otherwise the one they picked last time (or their browser's). Renders nothing.
 */
export function LanguageSync() {
  const { status, user } = useAuth();
  const accountLanguage = user?.language;

  useEffect(() => {
    if (status === "loading") return;
    if (accountLanguage) {
      applyLanguage(accountLanguage);
      rememberLanguage(accountLanguage); // so the sign-in page speaks the same language after signing out
    } else {
      applyLanguage(storedLanguage() ?? "EN");
    }
  }, [status, accountLanguage]);

  return null;
}
