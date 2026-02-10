import { clamp } from "./clamp";

const CHROMATIC_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
] as const;

export function midiToNoteLabel(midi: number): string {
    const safeMidi = clamp(Math.round(midi), 0, 127);
    const octave = Math.floor(safeMidi / 12) - 1;
    const note = CHROMATIC_NAMES[safeMidi % 12];
    return `${note}${octave}`;
}
