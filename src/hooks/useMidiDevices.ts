import { useEffect, useState } from "react";
import type { MidiInputOption } from "../types";

/**
 * Enumerates connected MIDI input devices and auto-selects the first one.
 *
 * Listens for device connection/disconnection events and keeps the list
 * in sync. If the currently selected device is disconnected, the first
 * remaining device is selected automatically.
 */
export default function useMidiDevices() {
    const [midiInputs, setMidiInputs] = useState<MidiInputOption[]>([]);
    const [selectedDevice, setSelectedDevice] = useState("");

    useEffect(() => {
        if (!navigator.requestMIDIAccess) return;

        let accessRef: MIDIAccess | null = null;
        let mounted = true;

        const syncInputs = () => {
            if (!accessRef || !mounted) return;
            const inputs = Array.from(accessRef.inputs.values()).map((input) => ({
                id: input.id,
                name: input.name ?? "Unnamed MIDI Input",
            }));
            setMidiInputs(inputs);
        };

        navigator.requestMIDIAccess().then(
            (access) => {
                if (!mounted) return;
                accessRef = access;
                syncInputs();
                access.onstatechange = syncInputs;
            },
            () => {
                if (!mounted) return;
                setMidiInputs([]);
            },
        );

        return () => {
            mounted = false;
            if (accessRef) {
                accessRef.onstatechange = null;
            }
        };
    }, []);

    // Auto-select first device when list changes
    useEffect(() => {
        if (midiInputs.length === 0) {
            setSelectedDevice("");
            return;
        }

        setSelectedDevice((current) => {
            if (current && midiInputs.some((input) => input.id === current)) {
                return current;
            }
            return midiInputs[0].id;
        });
    }, [midiInputs]);

    return { midiInputs, selectedDevice, setSelectedDevice };
}
