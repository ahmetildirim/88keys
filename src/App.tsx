/**
 * Root application component for 88keys sight-reading trainer.
 *
 * Orchestrates the data flow between three concerns:
 *
 *   1. Score generation — random MusicXML based on user settings
 *   2. MIDI input      — listens for key presses from a connected device
 *   3. Session tracking — compares pressed notes against the expected sequence
 *
 * Data flows in one direction:
 *
 *   User settings → generated score → expected notes
 *       → session state machine → cursor feedback → Staff renderer
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Staff, { type StaffHandle } from "./components/Staff";
import { CURSOR_STYLES, RANGE_PRESETS } from "./config/presets";
import useMidiInput from "./hooks/useMidiInput";
import useSightReadingSession from "./hooks/useSightReadingSession";
import { generateScore } from "./lib/musicxml";
import type { CursorStyle, RangePreset } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Feedback state that drives cursor color — one of the CURSOR_STYLES keys. */
type CursorFeedback = "idle" | "correct" | "wrong";

const NOTES_PER_MEASURE = 4;
const MIN_TOTAL_NOTES = 4;
const MAX_TOTAL_NOTES = 200;
const DEFAULT_TOTAL_NOTES = 100;

/** Clamps a note count to the allowed [MIN, MAX] range. */
function clampNoteCount(n: number): number {
  return Math.max(MIN_TOTAL_NOTES, Math.min(MAX_TOTAL_NOTES, n));
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const staffRef = useRef<StaffHandle>(null);

  // -- User settings --------------------------------------------------------

  const [selectedPreset, setSelectedPreset] = useState<RangePreset>(RANGE_PRESETS[0]);
  const [totalNotes, setTotalNotes] = useState(DEFAULT_TOTAL_NOTES);
  const [seed, setSeed] = useState(1);

  // -- Score generation (derived from settings) -----------------------------

  const score = useMemo(
    () =>
      generateScore({
        rangePreset: selectedPreset,
        notesPerMeasure: NOTES_PER_MEASURE,
        totalNotes,
        seed,
      }),
    [selectedPreset, totalNotes, seed],
  );

  // -- Sight-reading session ------------------------------------------------

  const [cursorFeedback, setCursorFeedback] = useState<CursorFeedback>("idle");
  const { reset, handleNoteOn, handleNoteOff } = useSightReadingSession();

  // Reset the session whenever a new score is generated.
  useEffect(() => {
    reset(score.expectedNotes);
    setCursorFeedback("idle");
    staffRef.current?.resetCursor();
  }, [reset, score.expectedNotes]);

  // -- MIDI event handlers --------------------------------------------------

  const onNoteOn = useCallback(
    (note: number) => {
      const result = handleNoteOn(note);
      setCursorFeedback(result === "correct" ? "correct" : "wrong");
    },
    [handleNoteOn],
  );

  const onNoteOff = useCallback(
    (note: number) => {
      const result = handleNoteOff(note);
      if (result === "advanced" || result === "complete") {
        staffRef.current?.nextCursor();
        setCursorFeedback("idle");
      }
    },
    [handleNoteOff],
  );

  const onAllNotesOff = useCallback(() => {
    setCursorFeedback("idle");
  }, []);

  const midiStatus = useMidiInput({ onNoteOn, onNoteOff, onAllNotesOff });

  // -- Derived visual state -------------------------------------------------

  const cursorStyle: CursorStyle = CURSOR_STYLES[cursorFeedback];

  // -- Render ---------------------------------------------------------------

  return (
    <main className="app">
      <ControlPanel
        selectedPreset={selectedPreset}
        totalNotes={totalNotes}
        onPresetChange={setSelectedPreset}
        onTotalNotesChange={setTotalNotes}
        onNewScore={() => setSeed((s) => s + 1)}
      />

      <section className="sheet">
        <div className="osmd-wrapper">
          <Staff ref={staffRef} scoreXml={score.xml} cursorStyle={cursorStyle} />
        </div>
      </section>

      <footer className="note">{midiStatus}</footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// ControlPanel (private sub-component)
// ---------------------------------------------------------------------------

interface ControlPanelProps {
  selectedPreset: RangePreset;
  totalNotes: number;
  onPresetChange: (preset: RangePreset) => void;
  onTotalNotesChange: (count: number) => void;
  onNewScore: () => void;
}

/**
 * Header with the title copy and user-adjustable controls.
 *
 * Extracted as a named function component for readability, but kept in
 * the same file because it has no independent reuse outside of App.
 */
function ControlPanel({
  selectedPreset,
  totalNotes,
  onPresetChange,
  onTotalNotesChange,
  onNewScore,
}: ControlPanelProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">Sightreading trainer</p>
        <h1>Practice one measure at a time.</h1>
        <p className="sub">
          Generate random notes and read them on staff. Adjust range as you
          improve.
        </p>
      </div>

      <div className="controls">
        <button className="primary" onClick={onNewScore}>
          New Random Score
        </button>

        <label className="switch">
          <span>Note range</span>
          <select
            className="select"
            value={selectedPreset.label}
            onChange={(e) => {
              const preset = RANGE_PRESETS.find((p) => p.label === e.target.value);
              if (preset) onPresetChange(preset);
            }}
          >
            {RANGE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="switch">
          <span>Total notes</span>
          <input
            className="number"
            type="number"
            min={MIN_TOTAL_NOTES}
            max={MAX_TOTAL_NOTES}
            value={totalNotes}
            onChange={(e) => {
              const n = Number(e.target.value);
              onTotalNotesChange(Number.isNaN(n) ? DEFAULT_TOTAL_NOTES : clampNoteCount(n));
            }}
          />
        </label>
      </div>
    </header>
  );
}
