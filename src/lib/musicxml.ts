import type { RangePreset } from "../config/presets";

const STEP_TO_SEMITONE = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
} as const;

const STEPS = Object.keys(STEP_TO_SEMITONE) as Array<keyof typeof STEP_TO_SEMITONE>;

type Rng = () => number;

type NotePitch = {
  step: keyof typeof STEP_TO_SEMITONE;
  octave: number;
};

type MeasureData = {
  xml: string;
  expectedMidi: Array<number | null>;
};

const toMidi = (step: keyof typeof STEP_TO_SEMITONE, octave: number) =>
  (octave + 1) * 12 + STEP_TO_SEMITONE[step];

// Deterministic RNG so identical settings + seed produce the same score.
const createRng = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const randomChoice = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

const buildNaturalNotesInRange = (minMidi: number, maxMidi: number): NotePitch[] => {
  const notes: NotePitch[] = [];
  for (let octave = 0; octave <= 8; octave += 1) {
    for (const step of STEPS) {
      const midi = (octave + 1) * 12 + STEP_TO_SEMITONE[step];
      if (midi >= minMidi && midi <= maxMidi) {
        notes.push({ step, octave });
      }
    }
  }
  return notes;
};

const generateRhythm = (allowedDurations: number[], notesCount: number, rng: Rng): number[] => {
  const total = 16; // 4/4 with divisions=4
  const durations: number[] = [];
  let remaining = total;
  const minDuration = Math.min(...allowedDurations);

  for (let i = 0; i < notesCount; i += 1) {
    const slotsLeft = notesCount - i - 1;
    const maxForSlot = remaining - minDuration * slotsLeft;
    const options = allowedDurations.filter(
      (duration) => duration <= maxForSlot && duration <= remaining
    );
    const duration = options.length > 0 ? randomChoice(options, rng) : minDuration;
    durations.push(duration);
    remaining -= duration;
  }

  if (remaining > 0) {
    durations[durations.length - 1] += remaining;
  }

  return durations;
};

type BuildMeasureInput = {
  rangePreset: RangePreset;
  rhythmPreset: number[];
  notesCount: number;
  measureNumber: number;
  includeAttributes: boolean;
  rng: Rng;
};

const buildMeasureXml = ({
  rangePreset,
  rhythmPreset,
  notesCount,
  measureNumber,
  includeAttributes,
  rng,
}: BuildMeasureInput): MeasureData => {
  const { minMidi, maxMidi, clef } = rangePreset;
  const notePool = buildNaturalNotesInRange(minMidi, maxMidi);
  const durations = generateRhythm(rhythmPreset, notesCount, rng);

  const notes = durations.map((duration) => {
    const pitch = randomChoice(notePool, rng);
    return { pitch, duration };
  });

  const expectedMidi = notes.map((note) => toMidi(note.pitch.step, note.pitch.octave));

  const attributes = includeAttributes
    ? `<attributes>
          <divisions>4</divisions>
          <key>
            <fifths>0</fifths>
          </key>
          <time>
            <beats>4</beats>
            <beat-type>4</beat-type>
          </time>
          <clef>
            <sign>${clef === "treble" ? "G" : "F"}</sign>
            <line>${clef === "treble" ? 2 : 4}</line>
          </clef>
        </attributes>`
    : "";

  const xml = `<measure number="${measureNumber}">
        ${attributes}
        ${notes
          .map((note) => {
            const typeMap: Record<number, string> = {
              2: "eighth",
              4: "quarter",
              8: "half",
            };
            const durationType = typeMap[note.duration] || "quarter";

            return `<note><pitch><step>${note.pitch.step}</step><octave>${note.pitch.octave}</octave></pitch><duration>${note.duration}</duration><type>${durationType}</type></note>`;
          })
          .join("\n")}
      </measure>`;

  return { xml, expectedMidi };
};

type BuildScoreInput = {
  rangePreset: RangePreset;
  notesPerMeasure: number;
  totalNotes: number;
  seed?: number;
};

type BuildScoreOutput = {
  xml: string;
  expected: Array<number | null>;
};

export const buildScore = ({
  rangePreset,
  notesPerMeasure,
  totalNotes,
  seed = Date.now(),
}: BuildScoreInput): BuildScoreOutput => {
  const measures: string[] = [];
  const expected: Array<number | null> = [];
  let remainingNotes = totalNotes;
  let measureNumber = 1;
  const rng = createRng(seed);

  while (remainingNotes > 0) {
    const count = Math.min(notesPerMeasure, remainingNotes);
    const data = buildMeasureXml({
      rangePreset,
      rhythmPreset: [4],
      notesCount: count,
      measureNumber,
      includeAttributes: measureNumber === 1,
      rng,
    });
    measures.push(data.xml);
    expected.push(...data.expectedMidi);
    remainingNotes -= count;
    measureNumber += 1;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
  <score-partwise version="3.1">
    <part-list>
      <score-part id="P1">
        <part-name>Music</part-name>
      </score-part>
    </part-list>
    <part id="P1">
      ${measures.join("\n")}
    </part>
  </score-partwise>`;

  return { xml, expected };
};
