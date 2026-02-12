import type { NoteName } from "../../../entities/score";
import { APP_RELEASE_STAGE } from "../../../shared/config/appMeta";
import { MAX_TOTAL_NOTES, MIN_TOTAL_NOTES } from "../constants";
import type { Preset } from "../config/presets";
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
    presets: readonly Preset[];
    onLoadPreset: (presetId: string) => void;
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
    presets,
    onLoadPreset,
}: GeneratorSetupPageProps) {
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
                    {/* <header className="setup-intro">
            <p className="section-kicker">Generator configuration</p>
            <h1>Build your next sight-reading run</h1>
          </header> */}

                    <div className="setup-content">
                        <aside className="setup-side-panel presets-panel">
                            <div className="section-head">
                                <div>
                                    <p className="section-kicker">Quick start</p>
                                    <h2>Presets</h2>
                                </div>
                            </div>

                            <ul className="presets-list">
                                {presets.map((preset) => (
                                    <li
                                        key={preset.id}
                                        className="preset-item"
                                    >
                                        <div className="preset-meta">
                                            <h3>{preset.title}</h3>
                                            <p className="mono">
                                                {preset.minNote} – {preset.maxNote} · {preset.totalNotes} notes
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="preset-load-button"
                                            onClick={() => onLoadPreset(preset.id)}
                                            aria-label={`Load preset ${preset.title}`}
                                        >
                                            Load
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </aside>

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
                        </aside>
                    </div>
                </div>
            </main>

            <footer className="setup-footer">
                © {new Date().getFullYear()} 88keys.app {APP_RELEASE_STAGE} | Minimalist sight-reading trainer.
            </footer>
        </div>
    );
}
