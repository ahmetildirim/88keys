import type { MidiStatus } from "../hooks/useMidiInput";

export function midiStatusLabel(status: MidiStatus): string {
    if (status === "MIDI: connected") return "MIDI Connected";
    if (status === "Checking MIDI support…") return "Checking MIDI";
    if (status === "MIDI: permission denied") return "MIDI Permission Denied";
    if (status === "MIDI: not supported in this browser") return "MIDI Unsupported";
    return "MIDI Disconnected";
}
