import { APP_ROUTES } from "../../app/routes";
import type { AppPage } from "../../app/routes/types";
import { APP_SITE_ORIGIN, APP_TITLE } from "./appMeta";

export const SITE_ORIGIN = APP_SITE_ORIGIN;
export const DEFAULT_OG_IMAGE_PATH = "/pwa-512.png";
export const DEFAULT_SEO_KEYWORDS = [
  "sight reading",
  "sight reading app",
  "sight reading online",
  "piano sight-reading",
  "sight reading practice",
  "learn to read sheet music",
  "midi piano trainer",
  "beginner piano practice",
  "music reading trainer",
  "piano note reading",
  "free sight reading app",
  "piano practice online",
  "sheet music reading practice",
  "sight reading exercises piano",
  "piano sight reading for beginners",
  "piano sight reading app",
  "practice sight reading piano",
  "read music notes piano",
].join(", ");

export type RouteSeoConfig = {
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  ogType?: "website" | "article";
};

export const APP_ROUTE_SEO: Record<AppPage, RouteSeoConfig> = {
  setup: {
    title: `${APP_TITLE} — Sight Reading App for Piano Practice Online`,
    description:
      "Free sight reading app for piano. Practice sight reading online with your MIDI keyboard, customize note ranges, and improve reading accuracy and speed.",
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    canonicalPath: APP_ROUTES.setup,
    ogType: "website",
  },
  practice: {
    title: `Practice Session — ${APP_TITLE}`,
    description:
      "Live sight-reading practice session with real-time MIDI keyboard input and instant accuracy feedback. Part of sightreading.studio.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.practice,
    ogType: "website",
  },
  results: {
    title: `Session Results — ${APP_TITLE}`,
    description:
      "Review your sight-reading session accuracy, speed, improvement areas, and streaks. Track your piano reading progress over time.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.results,
    ogType: "website",
  },
  settings: {
    title: `Settings — ${APP_TITLE}`,
    description:
      "Configure MIDI device selection and appearance preferences for sightreading.studio.",
    robots: "noindex, follow",
    canonicalPath: APP_ROUTES.settings,
    ogType: "website",
  },
  about: {
    title: `About ${APP_TITLE} — Free Sight Reading App`,
    description:
      "Learn about Sight Reading Studio, a free sight reading app for daily piano practice online with MIDI keyboard support. No ads, no account, fully offline.",
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    canonicalPath: APP_ROUTES.about,
    ogType: "article",
  },
};

export function absoluteUrl(path: string): string {
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  return new URL(normalizedPath, SITE_ORIGIN).toString();
}
