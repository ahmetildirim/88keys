import type { MidiInputOption, ThemeMode } from "../types";
import AppTopBar from "./AppTopBar";

interface SettingsPageProps {
    themeMode: ThemeMode;
    midiInputs: MidiInputOption[];
    midiDevice: string;
    midiConnected: boolean;
    onThemeModeChange: (value: ThemeMode) => void;
    onMidiDeviceChange: (value: string) => void;
    onBack: () => void;
}

export default function SettingsPage({
    themeMode,
    midiInputs,
    midiDevice,
    midiConnected,
    onThemeModeChange,
    onMidiDeviceChange,
    onBack,
}: SettingsPageProps) {
    return (
        <div className="app-page settings-page">
            <AppTopBar
                rightSlot={
                    <button type="button" className="back-button" onClick={onBack}>
                        <span className="material-symbols-outlined">chevron_left</span>
                        <span>Back</span>
                    </button>
                }
            />

            <main className="settings-main">
                <div className="settings-wrapper">
                    <header className="settings-intro">
                        <p className="section-kicker">Control center</p>
                        <h1>Settings</h1>
                        <p>Configure your instrument and appearance.</p>
                    </header>

                    <section className="settings-card">
                        <div className="settings-section">
                            <div className="settings-title">
                                <div className="settings-icon-box">
                                    <span className="material-symbols-outlined">palette</span>
                                </div>
                                <h2>Appearance</h2>
                            </div>

                            <div className="toggle-row">
                                <div>
                                    <h3>Theme</h3>
                                    <p>Choose light, dark, or follow your system setting.</p>
                                </div>
                                <div className="select-wrap theme-select-wrap">
                                    <select
                                        id="theme-mode-select"
                                        value={themeMode}
                                        onChange={(event) =>
                                            onThemeModeChange(event.target.value as ThemeMode)
                                        }
                                        aria-label="Theme mode"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="system">System</option>
                                    </select>
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-title">
                                <div className="settings-icon-box">
                                    <span className="material-symbols-outlined">piano</span>
                                </div>
                                <h2>MIDI input device</h2>
                            </div>

                            <label className="settings-field" htmlFor="midi-device-select">
                                Select MIDI device
                            </label>

                            <div className="select-wrap">
                                <select
                                    id="midi-device-select"
                                    value={midiDevice}
                                    onChange={(event) => onMidiDeviceChange(event.target.value)}
                                    disabled={midiInputs.length === 0}
                                >
                                    {midiInputs.length === 0 ? (
                                        <option value="">No MIDI inputs detected</option>
                                    ) : (
                                        midiInputs.map((input) => (
                                            <option key={input.id} value={input.id}>
                                                {input.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>

                            <div
                                className={`device-status ${midiConnected ? "connected" : "disconnected"}`}
                            >
                                <span className="status-dot" aria-hidden />
                                <span>{midiConnected ? "Device connected" : "No device detected"}</span>
                            </div>

                            <div className="settings-info">
                                <span className="material-symbols-outlined">info</span>
                                <p>
                                    If your keyboard isn't showing up, try reconnecting the USB cable
                                    or refreshing the page.
                                </p>
                            </div>
                        </div>

                        <div className="settings-bottom-row">
                            <span>Version 2.0.0 (Monochrome Precision)</span>
                        </div>
                    </section>

                    <div className="settings-handle" aria-hidden />
                </div>
            </main>
        </div>
    );
}
