import { useEffect, useRef, useState } from "react";

type MidiHandlers = {
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
};

export default function useMidiInput({ onNoteOn, onNoteOff }: MidiHandlers) {
  const [midiStatus, setMidiStatus] = useState("MIDI: not connected");
  const noteOffTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let activeInputs: MIDIInput[] = [];

    if (!navigator.requestMIDIAccess) {
      setMidiStatus("MIDI: not supported in this browser");
      return undefined;
    }

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      if (!event.data) return;
      const [status, note, velocity] = event.data;
      const command = status & 0xf0;

      if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        if (noteOffTimerRef.current) {
          window.clearTimeout(noteOffTimerRef.current);
        }
        // Short delay smooths out rapid note-off chatter from some devices.
        noteOffTimerRef.current = window.setTimeout(() => {
          onNoteOff?.(note);
        }, 120);
        return;
      }

      if (command !== 0x90) return;

      if (noteOffTimerRef.current) {
        window.clearTimeout(noteOffTimerRef.current);
      }

      onNoteOn?.(note, velocity);
    };

    navigator
      .requestMIDIAccess()
      .then((access) => {
        const inputs = Array.from(access.inputs.values());
        activeInputs = inputs;
        inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });
        setMidiStatus(inputs.length ? "MIDI: connected" : "MIDI: no device found");
      })
      .catch(() => {
        setMidiStatus("MIDI: permission denied");
      });

    return () => {
      activeInputs.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, [onNoteOff, onNoteOn]);

  return midiStatus;
}
