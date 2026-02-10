export type CursorFeedback = "idle" | "correct" | "wrong";
export type AppPage = "setup" | "practice" | "settings";
export type ReturnPage = Exclude<AppPage, "settings">;
export type MidiInputOption = { id: string; name: string };
