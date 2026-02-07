export type RangePreset = {
  minMidi: number;
  maxMidi: number;
  clef: "treble" | "bass";
};

export const RANGE_PRESETS: Record<string, RangePreset> = {
  "Treble (C4–G5)": { minMidi: 60, maxMidi: 79, clef: "treble" },
  "Treble Wide (A3–C6)": { minMidi: 57, maxMidi: 84, clef: "treble" },
  "Bass (E2–C4)": { minMidi: 40, maxMidi: 60, clef: "bass" },
};

export const CURSOR_COLORS = {
  correct: "#1f8a5b",
  wrong: "#c2281b",
} as const;
