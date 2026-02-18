import { useState } from "react";
import type { NoteName } from "../../../entities/score";
import { MAX_TOTAL_NOTES, MIN_TOTAL_NOTES } from "../constants";
import type { Training } from "../config/trainings";
import type { PreviousSessionItem } from "../types";
import AppTopBar from "../../../shared/ui/components/AppTopBar";
import KeyStepper from "./KeyStepper";

interface GeneratorSetupPageProps {
    midiConnected: boolean;
    midiLabel: string;
    minNote: NoteName;
    maxNote: NoteName;
    totalNotes: number;
    rangeSummary: string;
    selectedRangeLeftPercent: number;
    selectedRangeWidthPercent: number;
    onDecreaseMinNote: () => void;
    onIncreaseMinNote: () => void;
    onDecreaseMaxNote: () => void;
    onIncreaseMaxNote: () => void;
    onDecreaseNotes: () => void;
    onIncreaseNotes: () => void;
    onNoteCountInput: (value: number) => void;
    onStartSession: () => void;
    onOpenSettings: () => void;
    previousSessions: PreviousSessionItem[];
    onLoadPreviousSession: (sessionId: string) => void;
    trainings: readonly Training[];
    onLoadTraining: (trainingId: string) => void;
    onSaveTraining: (title: string) => void;
    onDeleteTraining: (trainingId: string) => void;
}

export default function GeneratorSetupPage({
    midiConnected,
    midiLabel,
    minNote,
    maxNote,
    totalNotes,
    rangeSummary,
    selectedRangeLeftPercent,
    selectedRangeWidthPercent,
    onDecreaseMinNote,
    onIncreaseMinNote,
    onDecreaseMaxNote,
    onIncreaseMaxNote,
    onDecreaseNotes,
    onIncreaseNotes,
    onNoteCountInput,
    onStartSession,
    onOpenSettings,
    previousSessions,
    onLoadPreviousSession,
    trainings,
    onLoadTraining,
    onSaveTraining,
    onDeleteTraining,
}: GeneratorSetupPageProps) {
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveTitle, setSaveTitle] = useState("");

    const handleSave = () => {
        const trimmed = saveTitle.trim();
        if (!trimmed) return;
        onSaveTraining(trimmed);
        setSaveTitle("");
        setShowSaveForm(false);
    };

    const renderTrainingsPanelContent = () => (
        <>
            <div className="section-head">
                <div>
                    <p className="section-kicker">Quick start</p>
                    <h2>Trainings</h2>
                </div>
            </div>

            {trainings.length === 0 ? (
                <p className="trainings-empty">No trainings yet.</p>
            ) : (
                <ul className="trainings-list">
                    {trainings.map((training) => (
                        <li
                            key={training.id}
                            className="training-item"
                        >
                            <div className="training-meta">
                                <h3>{training.title}</h3>
                                <p className="mono">
                                    {training.minNote} – {training.maxNote} · {training.totalNotes} notes
                                </p>
                            </div>

                            <div className="training-actions">
                                <button
                                    type="button"
                                    className="training-load-button"
                                    onClick={() => onLoadTraining(training.id)}
                                    aria-label={`Load training ${training.title}`}
                                >
                                    Load
                                </button>
                                <button
                                    type="button"
                                    className="training-delete-button"
                                    onClick={() => onDeleteTraining(training.id)}
                                    aria-label={`Delete training ${training.title}`}
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );

    const renderPreviousSessionsPanelContent = () => (
        <>
            <div className="section-head">
                <div>
                    <p className="section-kicker">History</p>
                    <h2>Previous sessions</h2>
                </div>
            </div>

            {previousSessions.length === 0 ? (
                <p className="previous-sessions-empty">No previous sessions yet.</p>
            ) : (
                <ul className="previous-sessions-list">
                    {previousSessions.map((session) => {
                        const range = `${session.config.minNote} - ${session.config.maxNote}`;

                        return (
                            <li
                                key={session.id}
                                className="previous-session-item"
                            >
                                <div className="previous-session-meta">
                                    <p>{session.createdAtLabel}</p>
                                    <p className="mono">
                                        {session.durationLabel} · {session.accuracy}%
                                    </p>
                                    <p className="mono">{range}</p>
                                    <p className="mono">{session.config.totalNotes} notes</p>
                                </div>

                                <button
                                    type="button"
                                    className="previous-session-load-button"
                                    onClick={() => onLoadPreviousSession(session.id)}
                                    aria-label={`Load session from ${session.createdAtLabel}`}
                                >
                                    Load
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );

    return (
        <div className="app-page setup-page">
            <AppTopBar
                rightSlot={
                    <>
                        <div className="midi-chip">
                            <span
                                className={`status-dot ${midiConnected ? "connected" : "disconnected"}`}
                                aria-hidden
                            />
                            <span className="midi-chip-label">{midiLabel}</span>
                        </div>

                        <button
                            type="button"
                            className="icon-button"
                            aria-label="Open settings"
                            onClick={onOpenSettings}
                        >
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                    </>
                }
            />

            <main className="setup-main">
                <div className="setup-wrapper">
                    <section className="setup-intro" style={{ display: "none" }}>
                        <h1>Free Sight Reading App for Piano Practice Online</h1>
                        <p>
                            Practice sight reading online with your MIDI keyboard. Improve note reading
                            speed and accuracy with focused, customizable sessions.
                        </p>
                    </section>

                    <div className="setup-content">
                        <aside className="setup-side-panel trainings-panel">
                            {renderTrainingsPanelContent()}
                        </aside>

                        <div className="setup-mobile-sections">
                            <details className="setup-mobile-section">
                                <summary className="setup-mobile-section-summary">
                                    <span>Quick start</span>
                                    <span className="material-symbols-outlined" aria-hidden>
                                        expand_more
                                    </span>
                                </summary>
                                <div className="setup-side-panel trainings-panel setup-mobile-section-panel">
                                    {renderTrainingsPanelContent()}
                                </div>
                            </details>

                            <details className="setup-mobile-section">
                                <summary className="setup-mobile-section-summary">
                                    <span>History</span>
                                    <span className="material-symbols-outlined" aria-hidden>
                                        expand_more
                                    </span>
                                </summary>
                                <div className="setup-side-panel previous-sessions setup-mobile-section-panel">
                                    {renderPreviousSessionsPanelContent()}
                                </div>
                            </details>
                        </div>

                        <section className="setup-card">
                            <div className="setup-main-panel">
                                <div className="setup-section">
                                    <div className="section-head">
                                        <div>
                                            <p className="section-kicker">Pitch</p>
                                            <h2>Note range</h2>
                                        </div>
                                        <span className="section-summary mono">{rangeSummary}</span>
                                    </div>

                                    <div className="key-grid">
                                        <KeyStepper
                                            label="Minimum key"
                                            value={minNote}
                                            hint="Lowest note to generate"
                                            onIncrease={onIncreaseMinNote}
                                            onDecrease={onDecreaseMinNote}
                                        />

                                        <KeyStepper
                                            label="Maximum key"
                                            value={maxNote}
                                            hint="Highest note to generate"
                                            onIncrease={onIncreaseMaxNote}
                                            onDecrease={onDecreaseMaxNote}
                                        />
                                    </div>

                                    <div className="range-slider" aria-hidden>
                                        <div className="range-track">
                                            <div
                                                className="range-selection"
                                                style={{
                                                    left: `${selectedRangeLeftPercent}%`,
                                                    width: `${Math.max(selectedRangeWidthPercent, 1.5)}%`,
                                                }}
                                            />
                                            <span
                                                className="range-handle"
                                                style={{ left: `${selectedRangeLeftPercent}%` }}
                                            />
                                            <span
                                                className="range-handle"
                                                style={{
                                                    left: `${selectedRangeLeftPercent + selectedRangeWidthPercent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="setup-section">
                                    <div className="section-head">
                                        <div>
                                            <p className="section-kicker">Length</p>
                                            <h2>Session count</h2>
                                        </div>
                                    </div>

                                    <label className="notes-label" htmlFor="number-of-notes-input">
                                        Number of notes
                                    </label>
                                    <div className="notes-row">
                                        <button
                                            type="button"
                                            className="step-button"
                                            onClick={onDecreaseNotes}
                                            aria-label="Decrease note count"
                                        >
                                            <span className="material-symbols-outlined">remove</span>
                                        </button>

                                        <div className="notes-input-wrap">
                                            <input
                                                id="number-of-notes-input"
                                                className="notes-input"
                                                type="number"
                                                min={MIN_TOTAL_NOTES}
                                                max={MAX_TOTAL_NOTES}
                                                value={totalNotes}
                                                onChange={(event) => onNoteCountInput(Number(event.target.value))}
                                            />
                                            <span>notes</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="step-button"
                                            onClick={onIncreaseNotes}
                                            aria-label="Increase note count"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="session-preview">
                                    <h3>Session preview</h3>
                                    <dl>
                                        <div>
                                            <dt>Range</dt>
                                            <dd className="mono">{rangeSummary}</dd>
                                        </div>
                                        <div>
                                            <dt>Total</dt>
                                            <dd className="mono">{totalNotes} notes</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="setup-actions">
                                    {showSaveForm ? (
                                        <div className="save-training-form">
                                            <input
                                                className="save-training-input"
                                                type="text"
                                                placeholder="Training name"
                                                value={saveTitle}
                                                onChange={(e) => setSaveTitle(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                                                // biome-ignore lint/a11y/noAutofocus: intentional for inline form
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="save-training-confirm"
                                                onClick={handleSave}
                                                disabled={!saveTitle.trim()}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                className="save-training-cancel"
                                                onClick={() => { setShowSaveForm(false); setSaveTitle(""); }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="save-training-button"
                                            onClick={() => setShowSaveForm(true)}
                                        >
                                            <span className="material-symbols-outlined">bookmark_add</span>
                                            <span>Save as training</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="start-session-button"
                                        onClick={onStartSession}
                                    >
                                        <span>Start session</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        <aside className="setup-side-panel previous-sessions">
                            {renderPreviousSessionsPanelContent()}
                        </aside>
                    </div>
                </div>
            </main>

            <footer className="setup-footer">
            </footer>
        </div>
    );
}
