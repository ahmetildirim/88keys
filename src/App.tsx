import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { StaffHandle } from "./components/Staff";
import GeneratorSetupPage from "./components/GeneratorSetupPage";
import PracticePlayerPage from "./components/PracticePlayerPage";
import SettingsPage from "./components/SettingsPage";
import { CURSOR_STYLES } from "./config/presets";
import {
  DEFAULT_MIN_NOTE,
  DEFAULT_MAX_NOTE,
  DEFAULT_TOTAL_NOTES,
  MIN_TOTAL_NOTES,
  MAX_TOTAL_NOTES,
  MISSED_MESSAGE_TIMEOUT_MS,
} from "./constants";
import { NOTE_NAMES, generateScore, type NoteName } from "./generator";
import useMidiDevices from "./hooks/useMidiDevices";
import useMidiInput from "./hooks/useMidiInput";
import useSightReadingSession from "./hooks/useSightReadingSession";
import useTimer from "./hooks/useTimer";
import type { AppPage, CursorFeedback, ReturnPage } from "./types";
import { clamp, formatTime, midiStatusLabel, midiToNoteLabel } from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampNoteCount(value: number): number {
  return clamp(value, MIN_TOTAL_NOTES, MAX_TOTAL_NOTES);
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const staffRef = useRef<StaffHandle>(null);
  const missedMessageTimer = useRef<number | null>(null);

  // Navigation
  const [page, setPage] = useState<AppPage>("setup");
  const [settingsReturnPage, setSettingsReturnPage] = useState<ReturnPage>("setup");

  // Generator parameters
  const [minNote, setMinNote] = useState<NoteName>(DEFAULT_MIN_NOTE);
  const [maxNote, setMaxNote] = useState<NoteName>(DEFAULT_MAX_NOTE);
  const [totalNotes, setTotalNotes] = useState(DEFAULT_TOTAL_NOTES);
  const [seed, setSeed] = useState(1);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  // Session stats
  const [cursorFeedback, setCursorFeedback] = useState<CursorFeedback>("idle");
  const [completedNotes, setCompletedNotes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [missedMessage, setMissedMessage] = useState<string | null>(null);

  // Extracted hooks
  const timer = useTimer();
  const { midiInputs, selectedDevice, setSelectedDevice } = useMidiDevices();
  const { reset, handleNoteOn, handleNoteOff } = useSightReadingSession();

  // Dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Cleanup missed-message timer on unmount
  useEffect(() => {
    return () => {
      if (missedMessageTimer.current !== null) {
        window.clearTimeout(missedMessageTimer.current);
      }
    };
  }, []);

  // Generate score
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

  // Missed-message helpers
  const clearMissedMessage = useCallback(() => {
    if (missedMessageTimer.current !== null) {
      window.clearTimeout(missedMessageTimer.current);
      missedMessageTimer.current = null;
    }
    setMissedMessage(null);
  }, []);

  const showMissedMessage = useCallback((midi: number) => {
    if (missedMessageTimer.current !== null) {
      window.clearTimeout(missedMessageTimer.current);
    }
    setMissedMessage(`Missed ${midiToNoteLabel(midi)}`);
    missedMessageTimer.current = window.setTimeout(() => {
      setMissedMessage(null);
      missedMessageTimer.current = null;
    }, MISSED_MESSAGE_TIMEOUT_MS);
  }, []);

  // Reset session when score changes
  useEffect(() => {
    reset(score.expectedNotes);
    setCursorFeedback("idle");
    setCompletedNotes(0);
    setAttempts(0);
    setCorrectAttempts(0);
    timer.reset();
    clearMissedMessage();
    staffRef.current?.resetCursor();
  }, [reset, score.expectedNotes, clearMissedMessage, timer.reset]);

  // MIDI event handlers
  const onNoteOn = useCallback(
    (note: number) => {
      if (page === "practice" && !timer.isRunning) {
        timer.start();
      }

      const result = handleNoteOn(note);
      if (result === "complete") return;

      setAttempts((value) => value + 1);

      if (result === "correct") {
        setCorrectAttempts((value) => value + 1);
        setCursorFeedback("correct");
        return;
      }

      setCursorFeedback("wrong");
      showMissedMessage(note);
    },
    [handleNoteOn, showMissedMessage, page, timer.isRunning, timer.start],
  );

  const onNoteOff = useCallback(
    (note: number) => {
      const result = handleNoteOff(note);
      if (result !== "advanced" && result !== "complete") return;

      staffRef.current?.nextCursor();
      setCompletedNotes((value) => Math.min(totalNotes, value + 1));
      setCursorFeedback("idle");
    },
    [handleNoteOff, totalNotes],
  );

  const onAllNotesOff = useCallback(() => {
    setCursorFeedback("idle");
  }, []);

  const midiStatus = useMidiInput({ onNoteOn, onNoteOff, onAllNotesOff });

  // Derived values
  const midiConnected = midiStatus === "MIDI: connected";
  const midiLabel = midiStatusLabel(midiStatus);
  const cursorStyle = CURSOR_STYLES[cursorFeedback];

  const minIndex = NOTE_NAMES.indexOf(minNote);
  const maxIndex = NOTE_NAMES.indexOf(maxNote);
  const maxNoteIndex = NOTE_NAMES.length - 1;
  const selectedRangeLeftPercent = (minIndex / maxNoteIndex) * 100;
  const selectedRangeWidthPercent =
    ((maxIndex - minIndex) / maxNoteIndex) * 100;

  const accuracy =
    attempts === 0 ? 100 : Math.round((correctAttempts / attempts) * 100);
  const elapsedSeconds = Math.floor(timer.elapsedMs / 1000);

  const rangeSummary =
    minNote === "A0" && maxNote === "C8"
      ? "Full Piano (A0 - C8)"
      : `${minNote} - ${maxNote}`;

  // Note-range step handlers
  const updateMinNoteByStep = useCallback(
    (delta: number) => {
      setMinNote((current) => {
        const currentIndex = NOTE_NAMES.indexOf(current);
        const maxAllowedIndex = NOTE_NAMES.indexOf(maxNote);
        const nextIndex = clamp(currentIndex + delta, 0, maxAllowedIndex);
        return NOTE_NAMES[nextIndex] as NoteName;
      });
    },
    [maxNote],
  );

  const updateMaxNoteByStep = useCallback(
    (delta: number) => {
      setMaxNote((current) => {
        const currentIndex = NOTE_NAMES.indexOf(current);
        const minAllowedIndex = NOTE_NAMES.indexOf(minNote);
        const nextIndex = clamp(currentIndex + delta, minAllowedIndex, maxNoteIndex);
        return NOTE_NAMES[nextIndex] as NoteName;
      });
    },
    [minNote, maxNoteIndex],
  );

  // Navigation
  const startSession = useCallback(() => {
    setSeed((value) => value + 1);
    setPage("practice");
  }, []);

  const finishSession = useCallback(() => {
    timer.reset();
    setPage("setup");
  }, [timer.reset]);

  const openSettings = useCallback((from: ReturnPage) => {
    setSettingsReturnPage(from);
    setPage("settings");
  }, []);

  const closeSettings = useCallback(() => {
    setPage(settingsReturnPage);
  }, [settingsReturnPage]);

  // Render
  if (page === "setup") {
    return (
      <GeneratorSetupPage
        midiConnected={midiConnected}
        midiLabel={midiLabel}
        minNote={minNote}
        maxNote={maxNote}
        totalNotes={totalNotes}
        rangeSummary={rangeSummary}
        selectedRangeLeftPercent={selectedRangeLeftPercent}
        selectedRangeWidthPercent={selectedRangeWidthPercent}
        onDecreaseMinNote={() => updateMinNoteByStep(-1)}
        onIncreaseMinNote={() => updateMinNoteByStep(1)}
        onDecreaseMaxNote={() => updateMaxNoteByStep(-1)}
        onIncreaseMaxNote={() => updateMaxNoteByStep(1)}
        onDecreaseNotes={() =>
          setTotalNotes((value) => clampNoteCount(value - 1))
        }
        onIncreaseNotes={() =>
          setTotalNotes((value) => clampNoteCount(value + 1))
        }
        onNoteCountInput={(value) =>
          setTotalNotes(
            Number.isNaN(value) ? DEFAULT_TOTAL_NOTES : clampNoteCount(value),
          )
        }
        onStartSession={startSession}
        onOpenSettings={() => openSettings("setup")}
      />
    );
  }

  if (page === "practice") {
    return (
      <PracticePlayerPage
        staffRef={staffRef}
        scoreXml={score.xml}
        cursorStyle={cursorStyle}
        rangeLabel={`${minNote} - ${maxNote}`}
        totalNotes={totalNotes}
        completedNotes={completedNotes}
        accuracy={accuracy}
        elapsedTimeLabel={formatTime(elapsedSeconds)}
        timerRunning={timer.isRunning}
        onToggleTimer={timer.toggle}
        missedMessage={missedMessage}
        onOpenSettings={() => openSettings("practice")}
        onFinish={finishSession}
      />
    );
  }

  return (
    <SettingsPage
      darkMode={darkMode}
      midiInputs={midiInputs}
      midiDevice={selectedDevice}
      midiConnected={midiConnected}
      onDarkModeChange={setDarkMode}
      onMidiDeviceChange={setSelectedDevice}
      onBack={closeSettings}
    />
  );
}
