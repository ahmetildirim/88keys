/**
 * Application presets and visual configuration.
 *
 * Centralizes the tunable parameters of the trainer:
 *   - Note range presets (which pitches to generate, which clef to display)
 *   - Cursor feedback styles (visual response to correct/incorrect input)
 *
 * To add a new practice range, append an entry to RANGE_PRESETS.
 */

import type { CursorStyle, RangePreset } from "../types";

// ---------------------------------------------------------------------------
// Note range presets
// ---------------------------------------------------------------------------

/**
 * Predefined note ranges, ordered from beginner-friendly to advanced.
 *
 * Each preset constrains random note generation to a MIDI range and
 * specifies which clef to use for rendering. MIDI note numbers follow
 * the standard convention where middle C (C4) = 60.
 */
export const RANGE_PRESETS: readonly RangePreset[] = [
    { label: "Treble (C4–G5)", minMidi: 60, maxMidi: 79, clef: "treble" },
    { label: "Treble Wide (A3–C6)", minMidi: 57, maxMidi: 84, clef: "treble" },
    { label: "Bass (E2–C4)", minMidi: 40, maxMidi: 60, clef: "bass" },
];

// ---------------------------------------------------------------------------
// Cursor feedback styles
// ---------------------------------------------------------------------------

/**
 * Maps each feedback state to the visual style applied to the OSMD cursor.
 *
 *   idle    — default blue; awaiting player input
 *   correct — green flash; the player pressed the right key
 *   wrong   — red flash; the player pressed the wrong key
 */
export const CURSOR_STYLES: Readonly<Record<string, CursorStyle>> = {
    idle: { color: "#6daaf5", alpha: 0.60 },
    correct: { color: "#76ffa8", alpha: 0.40 },
    wrong: { color: "#f76666", alpha: 0.45 },
};
