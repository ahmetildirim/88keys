import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import {
  midiStatusLabel,
  midiToNoteLabel,
  useMidiDevices,
  useMidiInput,
} from "../features/midi";
import { MISSED_MESSAGE_TIMEOUT_MS } from "../features/practice/constants";
import { CURSOR_STYLES } from "../features/practice/config/cursorStyles";
import type { CursorFeedback } from "../features/practice/types";
import {
  type StaffHandle,
} from "../features/practice";
import { useSightReadingSession, useTimer } from "../features/session";
import type { ThemeMode } from "../features/settings/types";
import type { PreviousSessionItem } from "../features/setup/types";
import {
  DEFAULT_MAX_NOTE,
  DEFAULT_MIN_NOTE,
  DEFAULT_TOTAL_NOTES,
  MAX_TOTAL_NOTES,
  MIN_TOTAL_NOTES,
} from "../features/setup/constants";
import { TRAININGS, type Training } from "../features/setup/config/trainings";
import type { PersistedCustomTraining } from "../shared/storage";
import { NOTE_NAMES, generateScore, type NoteName } from "../entities/score";
import { APP_ROUTES } from "./routes";
import type { AppPage, ReturnPage } from "./routes/types";
import { APP_ROUTE_SEO } from "../shared/config/seo";
import { applySeo } from "../shared/seo/applySeo";
import { clamp, formatTime } from "../shared/utils";
import {
  addCustomTraining,
  addSessionRun,
  deleteCustomTraining,
  listCustomTrainings,
  listSessionRuns,
  loadSettings,
  saveSettings,
  seedTrainings,
  toPreviousSessionItem,
  type PersistedSessionRun,
} from "../shared/storage";

const AboutPage = lazy(() => import("../pages/About/AboutPage"));
const PracticePage = lazy(() => import("../pages/Practice/PracticePage"));
const ResultsPage = lazy(() => import("../pages/Results/ResultsPage"));
const SettingsPage = lazy(() => import("../pages/Settings/SettingsPage"));
const SetupPage = lazy(() => import("../pages/Setup/SetupPage"));

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

function pageFromPathname(pathname: string): AppPage {
  switch (pathname) {
    case APP_ROUTES.practice:
      return "practice";
    case APP_ROUTES.settings:
      return "settings";
    case APP_ROUTES.results:
      return "results";
    case APP_ROUTES.about:
      return "about";
    case APP_ROUTES.setup:
    default:
      return "setup";
  }
}

export default function App() {
  const staffRef = useRef<StaffHandle>(null);
  const missedMessageTimer = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const page = useMemo(() => pageFromPathname(location.pathname), [location.pathname]);

  useEffect(() => {
    applySeo(APP_ROUTE_SEO[page]);
  }, [page]);

  const [settingsReturnPage, setSettingsReturnPage] = useState<ReturnPage>("setup");

  const [minNote, setMinNote] = useState<NoteName>(DEFAULT_MIN_NOTE);
  const [maxNote, setMaxNote] = useState<NoteName>(DEFAULT_MAX_NOTE);
  const [totalNotes, setTotalNotes] = useState(DEFAULT_TOTAL_NOTES);
  const [seed, setSeed] = useState(1);

  const [previousSessions, setPreviousSessions] = useState<PreviousSessionItem[]>([]);
  const [sessionRuns, setSessionRuns] = useState<PersistedSessionRun[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  const [cursorFeedback, setCursorFeedback] = useState<CursorFeedback>("idle");
  const [completedNotes, setCompletedNotes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [missedMessage, setMissedMessage] = useState<string | null>(null);
  const [autoFinishToken, setAutoFinishToken] = useState(0);
  const [missedNoteCounts, setMissedNoteCounts] = useState<Record<string, number>>({});
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  const { elapsedMs, isRunning: timerRunning, start: startTimer, stop: stopTimer, toggle: toggleTimer, reset: resetTimer } = useTimer();
  const { midiInputs, selectedDevice, setSelectedDevice } = useMidiDevices();
  const { reset, handleNoteOn, handleNoteOff } = useSightReadingSession();

  useEffect(() => {
    let mounted = true;

    const baseTime = Date.now();
    void seedTrainings(
      TRAININGS.map((t, index) => ({
        id: t.id,
        title: t.title,
        minNote: t.minNote,
        maxNote: t.maxNote,
        totalNotes: t.totalNotes,
        createdAt: baseTime - index,
      })),
    )
      .then(() => Promise.all([loadSettings(), listSessionRuns(), listCustomTrainings()]))
      .then(([settings, runs, savedTrainings]) => {
        if (!mounted) return;

        if (settings) {
          setThemeMode(settings.themeMode);
          setSelectedDevice(settings.selectedMidiDevice);
          setMinNote(settings.minNote);
          setMaxNote(settings.maxNote);
          setTotalNotes(clampNoteCount(settings.totalNotes));
        }

        setSessionRuns(runs);
        setPreviousSessions(runs.map(toPreviousSessionItem));
        setTrainings(
          savedTrainings.map((t) => ({
            id: t.id,
            title: t.title,
            minNote: t.minNote,
            maxNote: t.maxNote,
            totalNotes: t.totalNotes,
          })),
        );
      })
      .finally(() => {
        if (!mounted) return;
        setIsStorageHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, [setSelectedDevice]);

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (missedMessageTimer.current !== null) {
        window.clearTimeout(missedMessageTimer.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!isStorageHydrated) return;

    void saveSettings({
      themeMode,
      selectedMidiDevice: selectedDevice,
      minNote,
      maxNote,
      totalNotes,
      updatedAt: Date.now(),
    }).catch((error: unknown) => {
      console.warn("Failed to save settings to IndexedDB.", error);
    });
  }, [
    isStorageHydrated,
    maxNote,
    minNote,
    selectedDevice,
    themeMode,
    totalNotes,
  ]);

  useEffect(() => {
    reset(score.expectedNotes);
    setCursorFeedback("idle");
    setCompletedNotes(0);
    setAttempts(0);
    setCorrectAttempts(0);
    setAutoFinishToken(0);
    setMissedNoteCounts({});
    resetTimer();
    clearMissedMessage();
    staffRef.current?.resetCursor();
  }, [reset, score.expectedNotes, clearMissedMessage, resetTimer]);

  const onNoteOn = useCallback(
    (note: number) => {
      if (page !== "practice") return;

      if (!timerRunning) {
        startTimer();
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
    [handleNoteOn, showMissedMessage, page, timerRunning, startTimer],
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

  const midiStatus = useMidiInput({
    selectedDeviceId: selectedDevice,
    onNoteOn,
    onNoteOff,
    onAllNotesOff,
  });

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
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  const rangeSummary =
    minNote === "A0" && maxNote === "C8"
      ? "Full piano (A0 - C8)"
      : `${minNote} - ${maxNote}`;

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

  const loadPreviousSession = useCallback((sessionId: string) => {
    const selectedSession = sessionRuns.find(
      (session) => session.id === sessionId,
    );
    if (!selectedSession) return;

    setMinNote(selectedSession.config.minNote);
    setMaxNote(selectedSession.config.maxNote);
    setTotalNotes(clampNoteCount(selectedSession.config.totalNotes));
  }, [sessionRuns]);

  const loadTraining = useCallback((trainingId: string) => {
    const training = trainings.find((t) => t.id === trainingId);
    if (!training) return;

    setMinNote(training.minNote);
    setMaxNote(training.maxNote);
    setTotalNotes(clampNoteCount(training.totalNotes));
  }, [trainings]);

  const saveTraining = useCallback((title: string) => {
    const training: PersistedCustomTraining = {
      id: crypto.randomUUID(),
      title,
      minNote,
      maxNote,
      totalNotes,
      createdAt: Date.now(),
    };

    setTrainings((current) => [
      { id: training.id, title: training.title, minNote: training.minNote, maxNote: training.maxNote, totalNotes: training.totalNotes },
      ...current,
    ]);

    void addCustomTraining(training).catch((error: unknown) => {
      console.warn("Failed to save custom training to IndexedDB.", error);
    });
  }, [minNote, maxNote, totalNotes]);

  const removeTraining = useCallback((trainingId: string) => {
    setTrainings((current) => current.filter((t) => t.id !== trainingId));

    void deleteCustomTraining(trainingId).catch((error: unknown) => {
      console.warn("Failed to delete custom training from IndexedDB.", error);
    });
  }, []);

  const startSession = useCallback(() => {
    setAutoFinishToken(0);
    setSessionResult(null);
    setSeed((value) => value + 1);
    navigate(APP_ROUTES.practice);
  }, [navigate]);

  const finishSession = useCallback(() => {
    stopTimer();
    const durationSeconds = Math.floor(elapsedMs / 1000);
    const speedNpm =
      durationSeconds === 0
        ? 0
        : Math.round((completedNotes / Math.max(durationSeconds, 1)) * 60);
    const speedDelta = speedNpm - 36;
    const improvements = Object.entries(missedNoteCounts)
      .map(([note, misses]) => ({ note, misses }))
      .sort((left, right) => right.misses - left.misses)
      .slice(0, 2);

    const nextResult: SessionResult = {
      accuracy,
      speedNpm,
      speedDelta,
      improvements,
      durationSeconds,
      sessionId: `#SFL-${String(seed).padStart(4, "0")}`,
    };
    const sessionRun: PersistedSessionRun = {
      id: crypto.randomUUID(),
      sessionId: nextResult.sessionId,
      createdAt: Date.now(),
      durationSeconds: nextResult.durationSeconds,
      accuracy: nextResult.accuracy,
      speedNpm: nextResult.speedNpm,
      speedDelta: nextResult.speedDelta,
      improvements: nextResult.improvements,
      config: {
        minNote,
        maxNote,
        totalNotes,
      },
    };

    setSessionResult(nextResult);
    setSessionRuns((current) => [sessionRun, ...current]);
    setPreviousSessions((current) => [
      toPreviousSessionItem(sessionRun),
      ...current,
    ]);
    void addSessionRun(sessionRun).catch((error: unknown) => {
      console.warn("Failed to save session run to IndexedDB.", error);
    });
    navigate(APP_ROUTES.results);
  }, [
    accuracy,
    completedNotes,
    maxNote,
    minNote,
    missedNoteCounts,
    navigate,
    seed,
    elapsedMs,
    stopTimer,
    totalNotes,
  ]);

  useEffect(() => {
    if (page !== "practice") return;
    if (autoFinishToken === 0) return;
    finishSession();
  }, [autoFinishToken, finishSession, page]);

  const newSetupFromResults = useCallback(() => {
    navigate(APP_ROUTES.setup);
  }, [navigate]);

  const retrySession = useCallback(() => {
    setSeed((value) => value + 1);
    navigate(APP_ROUTES.practice);
  }, [navigate]);

  const openSettings = useCallback(
    (from: ReturnPage) => {
      setSettingsReturnPage(from);
      navigate(APP_ROUTES.settings);
    },
    [navigate],
  );

  const closeSettings = useCallback(() => {
    navigate(APP_ROUTES[settingsReturnPage]);
  }, [navigate, settingsReturnPage]);

  const openAbout = useCallback(() => {
    navigate(APP_ROUTES.about);
  }, [navigate]);

  const closeAbout = useCallback(() => {
    navigate(APP_ROUTES.settings);
  }, [navigate]);

  return (
    <Suspense fallback={<div className="app-page setup-page" />}>
      <Routes>
        <Route
          path={APP_ROUTES.setup}
          element={
            <SetupPage
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
              previousSessions={previousSessions}
              onLoadPreviousSession={loadPreviousSession}
              trainings={trainings}
              onLoadTraining={loadTraining}
              onSaveTraining={saveTraining}
              onDeleteTraining={removeTraining}
            />
          }
        />

        <Route
          path={APP_ROUTES.practice}
          element={
            <PracticePage
              staffRef={staffRef}
              scoreXml={score.xml}
              cursorStyle={cursorStyle}
              rangeLabel={`${minNote} - ${maxNote}`}
              totalNotes={totalNotes}
              completedNotes={completedNotes}
              accuracy={accuracy}
              elapsedTimeLabel={formatTime(elapsedSeconds)}
              timerRunning={timerRunning}
              onToggleTimer={toggleTimer}
              missedMessage={missedMessage}
              onOpenSettings={() => openSettings("practice")}
              onFinish={finishSession}
            />
          }
        />

        <Route
          path={APP_ROUTES.results}
          element={
            sessionResult ? (
              <ResultsPage
                accuracy={sessionResult.accuracy}
                speedNpm={sessionResult.speedNpm}
                speedDelta={sessionResult.speedDelta}
                improvements={sessionResult.improvements}
                durationLabel={formatTime(sessionResult.durationSeconds)}
                sessionId={sessionResult.sessionId}
                onNewSetup={newSetupFromResults}
                onTryAgain={retrySession}
              />
            ) : (
              <Navigate to={APP_ROUTES.setup} replace />
            )
          }
        />

        <Route
          path={APP_ROUTES.settings}
          element={
            <SettingsPage
              themeMode={themeMode}
              midiInputs={midiInputs}
              midiDevice={selectedDevice}
              midiConnected={midiConnected}
              onThemeModeChange={setThemeMode}
              onMidiDeviceChange={setSelectedDevice}
              onOpenAbout={openAbout}
              onBack={closeSettings}
            />
          }
        />

        <Route path={APP_ROUTES.about} element={<AboutPage onBack={closeAbout} />} />
        <Route path="/" element={<Navigate to={APP_ROUTES.setup} replace />} />
        <Route path="*" element={<Navigate to={APP_ROUTES.setup} replace />} />
      </Routes>
    </Suspense>
  );
}
