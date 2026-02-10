import type { NoteName } from "../generator";
import { MIN_TOTAL_NOTES, MAX_TOTAL_NOTES } from "../constants";
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
}: GeneratorSetupPageProps) {
    return (
        <div className="setup-page">
            <nav className="setup-nav">
                <div className="setup-brand">
                    <span className="material-symbols-outlined">piano</span>
                    <span>88keys.app</span>
                </div>

                <div className="setup-nav-right">
                    <div className="midi-chip">
                        <span
                            className={`status-dot ${midiConnected ? "connected" : "disconnected"}`}
                            aria-hidden
                        />
                        <span className="midi-chip-label">{midiLabel}</span>
                    </div>

                    <button
                        type="button"
                        className="profile-button"
                        aria-label="Open settings"
                        onClick={onOpenSettings}
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </nav>

            <main className="setup-main">
                <div className="setup-wrapper">
                    <header className="setup-intro">
                        <h1>Generator Setup</h1>
                        <p>Configure your sight-reading session parameters.</p>
                    </header>

                    <section className="setup-card">
                        <div className="setup-section">
                            <div className="section-head">
                                <h2>
                                    <span className="material-symbols-outlined">piano</span>
                                    Note Range
                                </h2>
                                <span>{rangeSummary}</span>
                            </div>

                            <div className="key-grid">
                                <KeyStepper
                                    label="Minimum Key"
                                    value={minNote}
                                    hint="Lowest note to generate"
                                    onIncrease={onIncreaseMinNote}
                                    onDecrease={onDecreaseMinNote}
                                />

                                <KeyStepper
                                    label="Maximum Key"
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
                                        style={{ left: `${selectedRangeLeftPercent + selectedRangeWidthPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="setup-section">
                            <div className="section-head">
                                <h2>
                                    <span className="material-symbols-outlined">queue_music</span>
                                    Session Length
                                </h2>
                            </div>

                            <label className="notes-label" htmlFor="number-of-notes-input">
                                Number of Notes
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

                        <div className="setup-actions">
                            <button
                                type="button"
                                className="start-session-button"
                                onClick={onStartSession}
                            >
                                <span className="material-symbols-outlined">play_arrow</span>
                                <span>Start Session</span>
                            </button>
                        </div>
                    </section>

                    <div className="setup-links">
                        <button type="button" className="ghost-link" onClick={onOpenSettings}>
                            <span className="material-symbols-outlined">settings</span>
                            Advanced Settings
                        </button>
                    </div>
                </div>
            </main>

            <footer className="setup-footer">© 2023 88keys.app. Minimalist Sight-Reading Trainer.</footer>
        </div>
    );
}
