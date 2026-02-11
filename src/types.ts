export type CursorFeedback = "idle" | "correct" | "wrong";
export type AppPage = "setup" | "practice" | "settings" | "results";
export type ReturnPage = Exclude<AppPage, "settings">;
export type ThemeMode = "light" | "dark" | "system";
export type MidiInputOption = { id: string; name: string };
