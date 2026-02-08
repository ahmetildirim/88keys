/**
 * React hook for connecting to MIDI input devices via the Web MIDI API.
 *
 * Listens for Note On / Note Off messages from all connected MIDI inputs
 * and dispatches callbacks. Tracks which keys are currently held down to
 * correctly detect the "all keys released" state.
 *
 * ## Relevant MIDI message format
 *
 *   Byte 0 (status): upper nibble = command, lower nibble = channel
 *     0x90 = Note On
 *     0x80 = Note Off
 *   Byte 1: note number (0–127, middle C = 60)
 *   Byte 2: velocity (0–127; Note On with velocity 0 ≡ Note Off)
 */

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// MIDI protocol constants
// ---------------------------------------------------------------------------

/** Bitmask to extract the command from a MIDI status byte. */
const COMMAND_MASK = 0xf0;
/** MIDI command: a key was pressed. */
const NOTE_ON = 0x90;
/** MIDI command: a key was released. */
const NOTE_OFF = 0x80;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Human-readable MIDI connection status shown in the UI footer. */
export type MidiStatus =
    | "Checking MIDI support…"
    | "MIDI: connected"
    | "MIDI: no device found"
    | "MIDI: not supported in this browser"
    | "MIDI: permission denied";

/** Callbacks fired in response to MIDI key events. */
export interface MidiCallbacks {
    /** A key was pressed. `note` is the MIDI note number (0–127). */
    onNoteOn?: (note: number, velocity: number) => void;
    /** A key was released. */
    onNoteOff?: (note: number) => void;
    /** All previously held keys have been released. */
    onAllNotesOff?: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Connects to all available MIDI inputs and dispatches note events.
 *
 * Returns a human-readable status string describing the connection state.
 * Automatically cleans up listeners on unmount or when callbacks change.
 */
export default function useMidiInput(callbacks: MidiCallbacks): MidiStatus {
    const { onNoteOn, onNoteOff, onAllNotesOff } = callbacks;
    const [status, setStatus] = useState<MidiStatus>("Checking MIDI support…");
    const heldNotes = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!navigator.requestMIDIAccess) {
            setStatus("MIDI: not supported in this browser");
            return;
        }

        let boundInputs: MIDIInput[] = [];

        const handleMessage = (event: MIDIMessageEvent) => {
            if (!event.data || event.data.length < 3) return;

            const [statusByte, note, velocity] = event.data;
            const command = statusByte & COMMAND_MASK;

            // Key released: explicit Note Off, or Note On with velocity 0.
            if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
                heldNotes.current.delete(note);
                onNoteOff?.(note);
                if (heldNotes.current.size === 0) {
                    onAllNotesOff?.();
                }
                return;
            }

            // Key pressed: only fire once per key (ignore repeated Note On).
            if (command === NOTE_ON && !heldNotes.current.has(note)) {
                heldNotes.current.add(note);
                onNoteOn?.(note, velocity);
            }
        };

        navigator.requestMIDIAccess().then(
            (access) => {
                const inputs = Array.from(access.inputs.values());
                boundInputs = inputs;
                for (const input of inputs) {
                    input.onmidimessage = handleMessage;
                }
                setStatus(inputs.length > 0 ? "MIDI: connected" : "MIDI: no device found");
            },
            () => {
                setStatus("MIDI: permission denied");
            },
        );

        return () => {
            for (const input of boundInputs) {
                input.onmidimessage = null;
            }
            heldNotes.current.clear();
        };
    }, [onNoteOn, onNoteOff, onAllNotesOff]);

    return status;
}
