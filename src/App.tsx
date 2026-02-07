import { useCallback, useMemo, useRef, useState } from "react";
import Staff from "./components/Staff";
import { CURSOR_COLORS, RANGE_PRESETS } from "./config/presets";
import useMidiInput from "./hooks/useMidiInput";

const CURSOR_STYLES = {
  correct: { color: CURSOR_COLORS.correct, alpha: 0.35 },
  wrong: { color: CURSOR_COLORS.wrong, alpha: 0.45 },
} as const;

export default function App() {
  const expectedRef = useRef<Array<number | null>>([]);
  const expectedIndexRef = useRef(0);
  const osmdRef = useRef<import("opensheetmusicdisplay").OpenSheetMusicDisplay | null>(null);

  const [rangeLabel, setRangeLabel] = useState("Treble (C4–G5)");
  const [totalNotes, setTotalNotes] = useState(100);
  const [seed, setSeed] = useState(1);
  const [isWrong, setIsWrong] = useState(false);

  const rangePreset = useMemo(() => RANGE_PRESETS[rangeLabel], [rangeLabel]);
  const cursorStyle = isWrong ? CURSOR_STYLES.wrong : CURSOR_STYLES.correct;

  const handleExpectedChange = useCallback((expected: Array<number | null>) => {
    expectedRef.current = expected;
    expectedIndexRef.current = 0;
    setIsWrong(false);
  }, []);

  const handleOsmdReady = useCallback(
    (osmd: import("opensheetmusicdisplay").OpenSheetMusicDisplay) => {
      osmdRef.current = osmd;
    },
    []
  );

  const handleNoteOn = useCallback((note: number) => {
    const expectedNotes = expectedRef.current;
    let index = expectedIndexRef.current;

    while (index < expectedNotes.length && expectedNotes[index] === null) {
      index += 1;
    }

    if (index >= expectedNotes.length) return;

    const expectedMidi = expectedNotes[index];
    if (note === expectedMidi) {
      expectedIndexRef.current = index + 1;
      setIsWrong(false);
      osmdRef.current?.cursor?.next();
    } else {
      setIsWrong(true);
    }
  }, []);

  const handleNoteOff = useCallback(() => {
    setIsWrong(false);
  }, []);

  const midiStatus = useMidiInput({ onNoteOn: handleNoteOn, onNoteOff: handleNoteOff });

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Sightreading trainer</p>
          <h1>Practice one measure at a time.</h1>
          <p className="sub">Generate random notes and read them on staff. Adjust range as you improve.</p>
        </div>
        <div className="controls">
          <button className="primary" onClick={() => setSeed((value) => value + 1)}>
            New Random Measure
          </button>
          <label className="switch">
            <span>Note range</span>
            <select
              className="select"
              value={rangeLabel}
              onChange={(event) => setRangeLabel(event.target.value)}
            >
              {Object.keys(RANGE_PRESETS).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="switch">
            <span>Total notes</span>
            <input
              className="number"
              type="number"
              min={4}
              max={200}
              value={totalNotes}
              onChange={(event) => {
                const value = Number(event.target.value);
                setTotalNotes(Number.isNaN(value) ? 100 : Math.min(200, Math.max(4, value)));
              }}
            />
          </label>
        </div>
      </header>

      <section className="sheet">
        <div className="osmd-wrapper">
          <Staff
            rangePreset={rangePreset}
            totalNotes={totalNotes}
            seed={seed}
            onExpectedChange={handleExpectedChange}
            onOsmdReady={handleOsmdReady}
            cursorStyle={cursorStyle}
          />
        </div>
      </section>

      <footer className="note">{midiStatus}</footer>
    </main>
  );
}
