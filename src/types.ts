/**
 * Shared domain types for the 88keys sight-reading trainer.
 *
 * This module defines the core vocabulary of the application. Every module
 * importing these types shares a single, consistent language for describing
 * musical concepts, MIDI interactions, and rendering configuration.
 */

// ---------------------------------------------------------------------------
// Musical primitives
// ---------------------------------------------------------------------------

/** The seven natural note names. No accidentals are used in this trainer. */
export type NoteName = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** Standard musical clefs supported by the trainer. */
export type Clef = "treble" | "bass";

/**
 * A pitch expressed as a note name and octave number.
 *
 * Examples: { step: "C", octave: 4 } is middle C.
 */
export interface Pitch {
    readonly step: NoteName;
    readonly octave: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Defines a MIDI note range for score generation and the clef to render.
 *
 * `minMidi` and `maxMidi` are inclusive bounds using standard MIDI note
 * numbers (0–127), where middle C (C4) = 60.
 */
export interface RangePreset {
    readonly label: string;
    readonly minMidi: number;
    readonly maxMidi: number;
    readonly clef: Clef;
}

/** Visual appearance for the OSMD cursor highlight. */
export interface CursorStyle {
    readonly color: string;
    readonly alpha: number;
}
