import type { RefObject } from "react";

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
    onFinish,
}: PracticePlayerPageProps) {
    const completionPercent = Math.min(
        100,
        (completedNotes / Math.max(totalNotes, 1)) * 100,
    );
    const completionPercentLabel = `${Math.round(completionPercent)}%`;

    return (
        <div className="practice-page">
            <header className="practice-header">
                <div className="practice-header-inner">
                    <div className="practice-header-top">
                        <div className="practice-session-meta">
                            <h2>Practice Session</h2>
                            <p>Range: {rangeLabel} | {totalNotes} Notes</p>
                        </div>

                        <div className="practice-stat-list">
                            <button
                                type="button"
                                className={`practice-stat-chip timer-chip ${timerRunning ? "running" : ""}`}
                                onClick={onToggleTimer}
                                aria-label={timerRunning ? "Stop timer" : "Start timer"}
                            >
                                <span className="material-symbols-outlined">schedule</span>
                                <span className="practice-stat-value">{elapsedTimeLabel}</span>
                                <span className="practice-stat-label">Time</span>
                                <span className="material-symbols-outlined timer-chip-action-icon">
                                    {timerRunning ? "pause_circle" : "play_circle"}
                                </span>
                            </button>

                            <div className="practice-stat-chip">
                                <span className="material-symbols-outlined">music_note</span>
                                <span className="practice-stat-value">{completedNotes}/{totalNotes}</span>
                                <span className="practice-stat-label">Notes</span>
                            </div>

                            <div className="practice-stat-chip success">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span className="practice-stat-value">{accuracy}%</span>
                                <span className="practice-stat-label">Acc.</span>
                            </div>
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
                <button type="button" className="finish-button" onClick={onFinish}>
                    <span className="material-symbols-outlined">flag</span>
                    <span>Finish Session</span>
                </button>
            </footer>
        </div>
    );
}
