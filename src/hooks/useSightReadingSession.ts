/**
 * React hook managing a single sight-reading session.
 *
 * Tracks the player's progress through an ordered sequence of expected
 * MIDI notes, providing feedback for each key press and release.
 *
 * ## State machine
 *
 * For each expected note, the player must:
 *   1. Press the correct key  → note becomes "armed"  (cursor turns green)
 *   2. Release that key       → cursor advances        (next note)
 *
 * Pressing the wrong key produces a "wrong" result (cursor turns red)
 * but does NOT advance; the player must still press the correct key.
 *
 *   ┌──────────┐  correct press  ┌────────┐  correct release  ┌──────────┐
 *   │ AWAITING ├─────────────────► ARMED  ├───────────────────► AWAITING │
 *   │  INPUT   │                 │        │                    │  (next)  │
 *   └────┬─────┘                 └────────┘                    └──────────┘
 *        │ wrong press
 *        ▼
 *   ┌──────────┐
 *   │  WRONG   │  (visual feedback only; cursor stays at same index)
 *   └──────────┘
 */

import { useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result of pressing a key (Note On). */
export type NoteOnResult =
    | "correct"   // Pressed note matches the expected note; now armed.
    | "wrong"     // Pressed note does not match.
    | "complete"; // Session finished; no more notes expected.

/** Result of releasing a key (Note Off). */
export type NoteOffResult =
    | "advanced"  // Armed note released; cursor moves to next note.
    | "complete"  // That was the last note; session finished.
    | "idle";     // Released key was not the armed note; no state change.

/** The public API returned by the hook. */
export interface SightReadingSession {
    /** Load a new sequence of expected MIDI note numbers. Resets all state. */
    reset: (expectedNotes: number[]) => void;
    /** Handle a MIDI Note On event. */
    handleNoteOn: (midiNote: number) => NoteOnResult;
    /** Handle a MIDI Note Off event. */
    handleNoteOff: (midiNote: number) => NoteOffResult;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useSightReadingSession(): SightReadingSession {
    /** Ordered MIDI notes the player must play. */
    const expectedNotes = useRef<number[]>([]);
    /** Index of the next note the player should press. */
    const cursor = useRef(0);
    /**
     * The MIDI note currently "armed" (pressed correctly, awaiting release).
     * `null` when no note is armed.
     */
    const armedNote = useRef<number | null>(null);

    const reset = useCallback((notes: number[]) => {
        expectedNotes.current = notes;
        cursor.current = 0;
        armedNote.current = null;
    }, []);

    const handleNoteOn = useCallback((midiNote: number): NoteOnResult => {
        const idx = cursor.current;

        // Session already complete.
        if (idx >= expectedNotes.current.length) return "complete";

        // A note is already armed — only that note matters until released.
        if (armedNote.current !== null) {
            return midiNote === armedNote.current ? "correct" : "wrong";
        }

        // Check whether the pressed key matches the expected note.
        if (midiNote === expectedNotes.current[idx]) {
            armedNote.current = midiNote;
            return "correct";
        }

        return "wrong";
    }, []);

    const handleNoteOff = useCallback((midiNote: number): NoteOffResult => {
        // Only the armed note's release advances the cursor.
        if (armedNote.current === null || midiNote !== armedNote.current) {
            return "idle";
        }

        armedNote.current = null;
        cursor.current += 1;

        return cursor.current >= expectedNotes.current.length
            ? "complete"
            : "advanced";
    }, []);

    return { reset, handleNoteOn, handleNoteOff };
}
