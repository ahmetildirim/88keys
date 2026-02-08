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
import { CURSOR_STYLES } from "./config/presets";
import useMidiInput from "./hooks/useMidiInput";
import useSightReadingSession from "./hooks/useSightReadingSession";
import {
  NOTE_NAMES,
  generateScore,
  type NoteName,
} from "./generator";
import {
  DEFAULT_THEME,
  THEME_NAMES,
  THEMES,
  applyTheme,
  isThemeName,
  type ThemeName,
} from "./theme/themes";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Feedback state that drives cursor color — one of the CURSOR_STYLES keys. */
type CursorFeedback = "idle" | "correct" | "wrong";

const MIN_TOTAL_NOTES = 4;
const MAX_TOTAL_NOTES = 200;
const DEFAULT_TOTAL_NOTES = 100;
const THEME_STORAGE_KEY = "88keys-theme";

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

  const [minNote, setMinNote] = useState<NoteName>("C4");
  const [maxNote, setMaxNote] = useState<NoteName>("G5");
  const [totalNotes, setTotalNotes] = useState(DEFAULT_TOTAL_NOTES);
  const [seed, setSeed] = useState(1);
  const [isControlPanelOpen, setControlPanelOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(storedTheme) ? storedTheme : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setControlPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  // -- Score generation (derived from settings) -----------------------------

  const score = useMemo(
    () =>
      generateScore({
        minNote,
        maxNote,
        noteCount: totalNotes,
        seed,
      }),
    [minNote, maxNote, totalNotes, seed],
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

  const cursorStyle = CURSOR_STYLES[cursorFeedback];

  // -- Render ---------------------------------------------------------------

  return (
    <main className="app">
      <section className="sheet">
        <div className="osmd-wrapper">
          <Staff ref={staffRef} scoreXml={score.xml} cursorStyle={cursorStyle} />
        </div>
      </section>

      <footer className="note">{midiStatus}</footer>

      <ControlPanel
        isOpen={isControlPanelOpen}
        minNote={minNote}
        maxNote={maxNote}
        totalNotes={totalNotes}
        theme={theme}
        onClose={() => setControlPanelOpen(false)}
        onToggle={() => setControlPanelOpen((open) => !open)}
        onThemeChange={setTheme}
        onMinNoteChange={setMinNote}
        onMaxNoteChange={setMaxNote}
        onTotalNotesChange={setTotalNotes}
        onNewScore={() => setSeed((s) => s + 1)}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// ControlPanel (private sub-component)
// ---------------------------------------------------------------------------

interface ControlPanelProps {
  isOpen: boolean;
  minNote: NoteName;
  maxNote: NoteName;
  totalNotes: number;
  theme: ThemeName;
  onClose: () => void;
  onToggle: () => void;
  onThemeChange: (themeName: ThemeName) => void;
  onMinNoteChange: (note: NoteName) => void;
  onMaxNoteChange: (note: NoteName) => void;
  onTotalNotesChange: (count: number) => void;
  onNewScore: () => void;
}

/**
 * Floating panel with user-adjustable controls.
 *
 * Kept in this file because it has no independent reuse outside of App.
 */
function ControlPanel({
  isOpen,
  minNote,
  maxNote,
  totalNotes,
  theme,
  onClose,
  onToggle,
  onThemeChange,
  onMinNoteChange,
  onMaxNoteChange,
  onTotalNotesChange,
  onNewScore,
}: ControlPanelProps) {
  const minIndex = NOTE_NAMES.indexOf(minNote);
  const maxIndex = NOTE_NAMES.indexOf(maxNote);
  const maxCandidates = NOTE_NAMES.filter((_, index) => index >= minIndex);
  const minCandidates = NOTE_NAMES.filter((_, index) => index <= maxIndex);
  const panelId = "floating-controls";

  return (
    <>
      <button
        type="button"
        className={`control-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-label="Close controls"
        tabIndex={isOpen ? 0 : -1}
      />

      <div className={`floating-controls ${isOpen ? "open" : ""}`}>
        {isOpen ? (
          <div className="controls" id={panelId}>
            <div className="controls-head">
              <div>
                <p className="controls-label">Practice controls</p>
                <p className="controls-caption">
                  Build your next randomized exercise.
                </p>
              </div>
              <button type="button" className="icon-button" onClick={onClose}>
                Close
              </button>
            </div>

            <button type="button" className="primary" onClick={onNewScore}>
              Generate New Score
            </button>

            <label className="field" htmlFor="theme-select">
              <span>Theme</span>
              <select
                id="theme-select"
                className="select"
                value={theme}
                onChange={(event) =>
                  onThemeChange(event.target.value as ThemeName)
                }
              >
                {THEME_NAMES.map((themeName) => (
                  <option key={themeName} value={themeName}>
                    {THEMES[themeName].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="min-note-select">
              <span>Min note</span>
              <select
                id="min-note-select"
                className="select"
                value={minNote}
                onChange={(event) => onMinNoteChange(event.target.value as NoteName)}
              >
                {minCandidates.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="max-note-select">
              <span>Max note</span>
              <select
                id="max-note-select"
                className="select"
                value={maxNote}
                onChange={(event) => onMaxNoteChange(event.target.value as NoteName)}
              >
                {maxCandidates.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" htmlFor="note-count-input">
              <span>Total notes</span>
              <input
                id="note-count-input"
                className="number"
                type="number"
                min={MIN_TOTAL_NOTES}
                max={MAX_TOTAL_NOTES}
                value={totalNotes}
                onChange={(event) => {
                  const n = Number(event.target.value);
                  onTotalNotesChange(
                    Number.isNaN(n) ? DEFAULT_TOTAL_NOTES : clampNoteCount(n),
                  );
                }}
              />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          className="control-toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span>{isOpen ? "Close controls" : "Practice controls"}</span>
          <span className="toggle-meta">{totalNotes} notes</span>
        </button>
      </div>
    </>
  );
}
