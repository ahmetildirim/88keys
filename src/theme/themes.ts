/**
 * Theme tokens applied as CSS custom properties on :root.
 *
 * Add/adjust palettes here without touching component code.
 */

type ThemeTokens = {
  "--bg-main": string;
  "--bg-alt": string;
  "--bg-glow": string;
  "--surface": string;
  "--surface-soft": string;
  "--text-main": string;
  "--text-muted": string;
  "--border": string;
  "--border-strong": string;
  "--accent": string;
  "--accent-strong": string;
  "--accent-soft": string;
  "--accent-ink": string;
  "--overlay": string;
  "--shadow-soft": string;
  "--shadow-strong": string;
};

interface ThemeDefinition {
  label: string;
  tokens: ThemeTokens;
}

export const THEMES = {
  skyline: {
    label: "Skyline",
    tokens: {
      "--bg-main": "#e8edf5",
      "--bg-alt": "#dce5f0",
      "--bg-glow": "#f6f9ff",
      "--surface": "rgba(255, 255, 255, 0.86)",
      "--surface-soft": "#eef3fa",
      "--text-main": "#172031",
      "--text-muted": "#4d5f80",
      "--border": "rgba(23, 32, 49, 0.15)",
      "--border-strong": "rgba(23, 32, 49, 0.28)",
      "--accent": "#2f74f9",
      "--accent-strong": "#1a56c1",
      "--accent-soft": "rgba(47, 116, 249, 0.2)",
      "--accent-ink": "#f2f7ff",
      "--overlay": "rgba(11, 16, 26, 0.4)",
      "--shadow-soft": "0 16px 40px rgba(14, 24, 39, 0.14)",
      "--shadow-strong": "0 24px 72px rgba(14, 24, 39, 0.26)",
    },
  },
  ember: {
    label: "Ember",
    tokens: {
      "--bg-main": "#f7efe6",
      "--bg-alt": "#f0e3d6",
      "--bg-glow": "#fff9f2",
      "--surface": "rgba(255, 252, 247, 0.88)",
      "--surface-soft": "#faefe2",
      "--text-main": "#2f221a",
      "--text-muted": "#6f5546",
      "--border": "rgba(47, 34, 26, 0.18)",
      "--border-strong": "rgba(47, 34, 26, 0.3)",
      "--accent": "#df6e35",
      "--accent-strong": "#b14c20",
      "--accent-soft": "rgba(223, 110, 53, 0.22)",
      "--accent-ink": "#fff2e9",
      "--overlay": "rgba(28, 16, 10, 0.4)",
      "--shadow-soft": "0 16px 40px rgba(36, 25, 18, 0.16)",
      "--shadow-strong": "0 24px 72px rgba(36, 25, 18, 0.28)",
    },
  },
  noir: {
    label: "Noir",
    tokens: {
      "--bg-main": "#dee3ea",
      "--bg-alt": "#d1d8e3",
      "--bg-glow": "#f4f7fc",
      "--surface": "rgba(255, 255, 255, 0.84)",
      "--surface-soft": "#e8edf6",
      "--text-main": "#171d28",
      "--text-muted": "#4d586e",
      "--border": "rgba(23, 29, 40, 0.16)",
      "--border-strong": "rgba(23, 29, 40, 0.3)",
      "--accent": "#1f344f",
      "--accent-strong": "#122238",
      "--accent-soft": "rgba(31, 52, 79, 0.2)",
      "--accent-ink": "#f2f4f8",
      "--overlay": "rgba(12, 15, 20, 0.48)",
      "--shadow-soft": "0 16px 40px rgba(11, 16, 24, 0.17)",
      "--shadow-strong": "0 24px 72px rgba(11, 16, 24, 0.3)",
    },
  },
  material: {
    label: "Material",
    tokens: {
      "--bg-main": "#f4effa",
      "--bg-alt": "#ede7f6",
      "--bg-glow": "#fef7ff",
      "--surface": "rgba(255, 252, 255, 0.9)",
      "--surface-soft": "#f3edf7",
      "--text-main": "#1d1b20",
      "--text-muted": "#49454f",
      "--border": "rgba(29, 27, 32, 0.16)",
      "--border-strong": "rgba(29, 27, 32, 0.28)",
      "--accent": "#6750a4",
      "--accent-strong": "#4f378b",
      "--accent-soft": "rgba(103, 80, 164, 0.22)",
      "--accent-ink": "#f6eeff",
      "--overlay": "rgba(29, 27, 32, 0.42)",
      "--shadow-soft": "0 16px 40px rgba(103, 80, 164, 0.16)",
      "--shadow-strong": "0 24px 72px rgba(79, 55, 139, 0.26)",
    },
  },
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeName = keyof typeof THEMES;

export const DEFAULT_THEME: ThemeName = "skyline";
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export function isThemeName(value: string | null): value is ThemeName {
  return value !== null && THEME_NAMES.some((themeName) => themeName === value);
}

export function applyTheme(themeName: ThemeName): void {
  const root = document.documentElement;
  const { tokens } = THEMES[themeName];

  Object.entries(tokens).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });

  root.dataset.theme = themeName;
}
