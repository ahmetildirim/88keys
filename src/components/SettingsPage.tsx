import type { MidiInputOption } from "../types";

interface SettingsPageProps {
    darkMode: boolean;
    midiInputs: MidiInputOption[];
    midiDevice: string;
    midiConnected: boolean;
    onDarkModeChange: (value: boolean) => void;
    onMidiDeviceChange: (value: string) => void;
    onBack: () => void;
}

export default function SettingsPage({
    darkMode,
    midiInputs,
    midiDevice,
    midiConnected,
    onDarkModeChange,
    onMidiDeviceChange,
    onBack,
}: SettingsPageProps) {
    return (
        <div className="settings-page">
            <nav className="settings-nav">
                <div className="settings-nav-inner">
                    <div className="settings-brand">
                        <div className="brand-mark">88</div>
                        <span>88keys.app</span>
                    </div>

                    <button type="button" className="back-button" onClick={onBack}>
                        <span>Back to Practice</span>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </nav>

            <main className="settings-main">
                <div className="settings-wrapper">
                    <header className="settings-intro">
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
                                    <h3>Dark Mode</h3>
                                    <p>Switch between light and dark themes.</p>
                                </div>
                                <label className="switch" htmlFor="dark-mode-toggle">
                                    <input
                                        id="dark-mode-toggle"
                                        className="toggle-input"
                                        type="checkbox"
                                        checked={darkMode}
                                        onChange={(event) => onDarkModeChange(event.target.checked)}
                                    />
                                    <span className="toggle-track" />
                                </label>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-title">
                                <div className="settings-icon-box">
                                    <span className="material-symbols-outlined">piano</span>
                                </div>
                                <h2>MIDI Input Device</h2>
                            </div>

                            <label className="settings-field" htmlFor="midi-device-select">
                                Select MIDI Device
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
                                <span>{midiConnected ? "Device Connected" : "No Device Detected"}</span>
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
                            <span>Version 1.0.2 (Build 8420)</span>
                        </div>
                    </section>

                    <div className="settings-handle" aria-hidden />
                </div>
            </main>
        </div>
    );
}
