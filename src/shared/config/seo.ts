import { APP_ROUTES } from "../../app/routes";
import type { AppPage } from "../../app/routes/types";
import { APP_NAME, APP_SITE_ORIGIN } from "./appMeta";

export const SITE_ORIGIN = APP_SITE_ORIGIN;
export const DEFAULT_OG_IMAGE_PATH = "/pwa-512.png";
export const DEFAULT_SEO_KEYWORDS = [
  "piano sight-reading app",
  "sight reading practice",
  "midi piano trainer",
  "beginner piano practice",
  "music reading trainer",
  "sfl app",
].join(", ");

const SETUP_DESCRIPTION =
  "Beginner-friendly piano sight-reading practice with MIDI keyboard input, customizable note ranges, and offline progress tracking.";

export type RouteSeoConfig = {
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  ogType?: "website" | "article";
};

export const APP_ROUTE_SEO: Record<AppPage, RouteSeoConfig> = {
  setup: {
    title: `${APP_NAME} | Piano Sight-Reading Practice`,
    description: SETUP_DESCRIPTION,
    robots: "index, follow",
    canonicalPath: APP_ROUTES.setup,
    ogType: "website",
  },
  practice: {
    title: `Practice Session | ${APP_NAME}`,
    description:
      "Live sight-reading session view with real-time MIDI note input and accuracy tracking.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.practice,
    ogType: "website",
  },
  results: {
    title: `Session Results | ${APP_NAME}`,
    description:
      "Review session accuracy, speed, and improvement notes after each sight-reading run.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.results,
    ogType: "website",
  },
  settings: {
    title: `Settings | ${APP_NAME}`,
    description:
      "Configure MIDI device selection and appearance preferences for SFL.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.settings,
    ogType: "website",
  },
  about: {
    title: `About ${APP_NAME}`,
    description:
      "Learn about SFL, a simple and focused web app for daily piano sight-reading practice.",
    robots: "index, follow",
    canonicalPath: APP_ROUTES.about,
    ogType: "article",
  },
};

export function absoluteUrl(path: string): string {
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  return new URL(normalizedPath, SITE_ORIGIN).toString();
}
