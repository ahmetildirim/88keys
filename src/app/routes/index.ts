import type { AppPage } from "./types";

export const APP_ROUTES = {
  setup: "/",
  practice: "/practice",
  settings: "/settings",
  results: "/results",
  about: "/about",
} as const satisfies Record<AppPage, string>;
