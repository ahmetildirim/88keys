import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { StaffHandle } from "./components/Staff";
import GeneratorSetupPage from "./components/GeneratorSetupPage";
import PracticePlayerPage from "./components/PracticePlayerPage";
import SessionResultPage from "./components/SessionResultPage";
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
import type { AppPage, CursorFeedback, ReturnPage, ThemeMode } from "./types";
import { clamp, formatTime, midiStatusLabel, midiToNoteLabel } from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampNoteCount(value: number): number {
  return clamp(value, MIN_TOTAL_NOTES, MAX_TOTAL_NOTES);
}

type SessionResult = {
  accuracy: number;
  speedNpm: number;
  speedDelta: number;
  improvements: { note: string; misses: number }[];
  durationSeconds: number;
  sessionId: string;
};

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
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Session stats
  const [cursorFeedback, setCursorFeedback] = useState<CursorFeedback>("idle");
  const [completedNotes, setCompletedNotes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [missedMessage, setMissedMessage] = useState<string | null>(null);
  const [autoFinishToken, setAutoFinishToken] = useState(0);
  const [missedNoteCounts, setMissedNoteCounts] = useState<Record<string, number>>(
    {},
  );
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  // Extracted hooks
  const timer = useTimer();
  const { midiInputs, selectedDevice, setSelectedDevice } = useMidiDevices();
  const { reset, handleNoteOn, handleNoteOff } = useSightReadingSession();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  const darkMode = themeMode === "dark" || (themeMode === "system" && systemPrefersDark);

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
    setAutoFinishToken(0);
    setMissedNoteCounts({});
    timer.reset();
    clearMissedMessage();
    staffRef.current?.resetCursor();
  }, [reset, score.expectedNotes, clearMissedMessage, timer.reset]);

  // MIDI event handlers
  const onNoteOn = useCallback(
    (note: number) => {
      if (page !== "practice") return;

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
      const noteLabel = midiToNoteLabel(note);
      setMissedNoteCounts((value) => ({
        ...value,
        [noteLabel]: (value[noteLabel] ?? 0) + 1,
      }));
      showMissedMessage(note);
    },
    [handleNoteOn, showMissedMessage, page, timer.isRunning, timer.start],
  );

  const onNoteOff = useCallback(
    (note: number) => {
      if (page !== "practice") return;

      const result = handleNoteOff(note);
      if (result !== "advanced" && result !== "complete") return;

      staffRef.current?.nextCursor();
      setCompletedNotes((value) => Math.min(totalNotes, value + 1));
      setCursorFeedback("idle");
      if (result === "complete") {
        setAutoFinishToken((value) => value + 1);
      }
    },
    [handleNoteOff, page, totalNotes],
  );

  const onAllNotesOff = useCallback(() => {
    if (page !== "practice") return;
    setCursorFeedback("idle");
  }, [page]);

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
      ? "Full piano (A0 - C8)"
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
    setAutoFinishToken(0);
    setSessionResult(null);
    setSeed((value) => value + 1);
    setPage("practice");
  }, []);

  const finishSession = useCallback(() => {
    timer.stop();
    const durationSeconds = Math.floor(timer.elapsedMs / 1000);
    const speedNpm =
      durationSeconds === 0
        ? 0
        : Math.round((completedNotes / Math.max(durationSeconds, 1)) * 60);
    const speedDelta = speedNpm - 36;
    const improvements = Object.entries(missedNoteCounts)
      .map(([note, misses]) => ({ note, misses }))
      .sort((left, right) => right.misses - left.misses)
      .slice(0, 2);

    setSessionResult({
      accuracy,
      speedNpm,
      speedDelta,
      improvements,
      durationSeconds,
      sessionId: `#88K-${String(seed).padStart(4, "0")}`,
    });
    setPage("results");
  }, [accuracy, completedNotes, missedNoteCounts, seed, timer]);

  useEffect(() => {
    if (page !== "practice") return;
    if (autoFinishToken === 0) return;
    finishSession();
  }, [autoFinishToken, finishSession, page]);

  const newSetupFromResults = useCallback(() => {
    setPage("setup");
  }, []);

  const retrySession = useCallback(() => {
    setSeed((value) => value + 1);
    setPage("practice");
  }, []);

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

  if (page === "results" && sessionResult) {
    return (
      <SessionResultPage
        accuracy={sessionResult.accuracy}
        speedNpm={sessionResult.speedNpm}
        speedDelta={sessionResult.speedDelta}
        improvements={sessionResult.improvements}
        durationLabel={formatTime(sessionResult.durationSeconds)}
        sessionId={sessionResult.sessionId}
        onNewSetup={newSetupFromResults}
        onTryAgain={retrySession}
      />
    );
  }

  return (
    <SettingsPage
      themeMode={themeMode}
      midiInputs={midiInputs}
      midiDevice={selectedDevice}
      midiConnected={midiConnected}
      onThemeModeChange={setThemeMode}
      onMidiDeviceChange={setSelectedDevice}
      onBack={closeSettings}
    />
  );
}
