import { useCallback, useEffect, useState, type RefObject } from "react";

import Staff, { type StaffHandle } from "./Staff";

interface PracticePlayerPageProps {
    staffRef: RefObject<StaffHandle | null>;
    scoreXml: string;
    cursorStyle: { color: string; alpha: number };
    rangeLabel: string;
    totalNotes: number;
    completedNotes: number;
    accuracy: number;
    elapsedTimeLabel: string;
    timerRunning: boolean;
    onToggleTimer: () => void;
    missedMessage: string | null;
    onOpenSettings: () => void;
    onFinish: () => void;
}

export default function PracticePlayerPage({
    staffRef,
    scoreXml,
    cursorStyle,
    rangeLabel,
    totalNotes,
    completedNotes,
    accuracy,
    elapsedTimeLabel,
    timerRunning,
    onToggleTimer,
    missedMessage,
    onOpenSettings,
    onFinish,
}: PracticePlayerPageProps) {
    const [fullscreenActive, setFullscreenActive] = useState(false);

    const completionPercent = Math.min(
        100,
        (completedNotes / Math.max(totalNotes, 1)) * 100,
    );
    const completionPercentLabel = `${Math.round(completionPercent)}%`;

    useEffect(() => {
        const onFullscreenChange = () => {
            setFullscreenActive(Boolean(document.fullscreenElement));
        };

        document.addEventListener("fullscreenchange", onFullscreenChange);
        onFullscreenChange();

        return () => {
            document.removeEventListener("fullscreenchange", onFullscreenChange);
        };
    }, []);

    const onToggleFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            await document.documentElement.requestFullscreen();
        } catch {
            // Ignore fullscreen errors (e.g. unsupported browser or blocked request).
        }
    }, []);

    return (
        <div className="practice-page">
            <header className="practice-header">
                <div className="practice-header-inner">
                    <div className="practice-session-meta">
                        <h2>Practice session</h2>
                        <p>Range: {rangeLabel} | {totalNotes} Notes</p>
                    </div>

                    <div className="practice-header-center">
                        <div className="practice-stat-list">
                            <button
                                type="button"
                                className={`practice-stat-chip timer-chip ${timerRunning ? "running" : ""}`}
                                onClick={onToggleTimer}
                                aria-label={timerRunning ? "Stop timer" : "Start timer"}
                            >
                                <span className="material-symbols-outlined">timer</span>
                                <span className="practice-stat-value mono">{elapsedTimeLabel}</span>
                            </button>

                            <div className="practice-stat-chip">
                                <span className="material-symbols-outlined">music_note</span>
                                <div className="practice-notes-value">
                                    <span className="practice-stat-value mono">{completedNotes}</span>
                                    <span className="practice-stat-total">/{totalNotes}</span>
                                </div>
                            </div>

                            <div className="practice-stat-chip success">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span className="practice-stat-value mono">{accuracy}%</span>
                            </div>
                        </div>

                        <div className="practice-progress-row">
                            <span className="practice-progress-label">{completionPercentLabel}</span>
                            <div className="practice-progress-track" aria-label="Completed notes progress">
                                <span
                                    className="practice-progress-fill"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                            <span className="practice-progress-label">100%</span>
                        </div>
                    </div>

                    <div className="practice-header-actions">
                        <button
                            type="button"
                            className="practice-icon-button"
                            aria-label="Open settings"
                            onClick={onOpenSettings}
                        >
                            <span className="material-symbols-outlined">settings</span>
                        </button>

                        <button
                            type="button"
                            className="practice-icon-button"
                            aria-label={fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"}
                            onClick={onToggleFullscreen}
                        >
                            <span className="material-symbols-outlined">
                                {fullscreenActive ? "fullscreen_exit" : "fullscreen"}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="practice-main">
                {missedMessage ? (
                    <div className="missed-message" aria-live="polite">
                        {missedMessage}
                    </div>
                ) : null}

                <div className="practice-score">
                    <Staff ref={staffRef} scoreXml={scoreXml} cursorStyle={cursorStyle} />
                </div>
            </main>

            <footer className="practice-footer">
                <div className="practice-footer-inner">
                    <button type="button" className="finish-button" onClick={onFinish}>
                        <span className="material-symbols-outlined">flag</span>
                        <span>Finish session</span>
                    </button>
                </div>
            </footer>
        </div>
    );
}
