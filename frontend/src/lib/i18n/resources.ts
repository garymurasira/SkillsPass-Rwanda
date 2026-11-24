import { admin } from "./locales/admin";
import { auth } from "./locales/auth";
import { common } from "./locales/common";
import { employer } from "./locales/employer";
import { errors } from "./locales/errors";
import { messages } from "./locales/messages";
import { verify } from "./locales/verify";
import { worker } from "./locales/worker";

const build = (lang: "en" | "rw" | "fr") => ({
  common: common[lang],
  auth: auth[lang],
  errors: errors[lang],
  worker: worker[lang],
  verify: verify[lang],
  employer: employer[lang],
  messages: messages[lang],
  admin: admin[lang],
});

export const resources = { en: build("en"), rw: build("rw"), fr: build("fr") };

/** The shape every language must have: English is the reference. */
export type Resources = ReturnType<typeof build>;
