/**
 * MIDI note number utilities.
 *
 * The MIDI standard assigns integer note numbers 0–127 to pitches.
 * Middle C (C4) = 60. Each semitone increments by 1.
 * Octave N starts at MIDI note (N + 1) × 12, so C−1 = 0, C0 = 12, C4 = 60.
 */

import type { NoteName, Pitch } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Semitone offset of each natural note within an octave (C = 0). */
const SEMITONE_OFFSET: Readonly<Record<NoteName, number>> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
};

/** All natural note names in ascending chromatic order. */
export const NOTE_NAMES: readonly NoteName[] = [
    "C", "D", "E", "F", "G", "A", "B",
];

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** Converts a pitch (step + octave) to its MIDI note number. */
export function pitchToMidi(pitch: Pitch): number {
    return (pitch.octave + 1) * 12 + SEMITONE_OFFSET[pitch.step];
}

// ---------------------------------------------------------------------------
// Range enumeration
// ---------------------------------------------------------------------------

/**
 * Returns all natural pitches whose MIDI numbers fall within
 * [minMidi, maxMidi], in ascending order.
 *
 * Only natural notes (no sharps/flats) are included because this
 * trainer focuses on staff reading without accidentals.
 */
export function naturalPitchesInRange(
    minMidi: number,
    maxMidi: number,
): readonly Pitch[] {
    const pitches: Pitch[] = [];
    for (let octave = 0; octave <= 8; octave++) {
        for (const step of NOTE_NAMES) {
            const midi = pitchToMidi({ step, octave });
            if (midi >= minMidi && midi <= maxMidi) {
                pitches.push({ step, octave });
            }
        }
    }
    return pitches;
}
