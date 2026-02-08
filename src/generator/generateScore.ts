import type { GeneratedScore, GeneratorOptions, NoteStep } from "./types";

type Clef = "treble" | "bass";

type Pitch = {
  step: NoteStep;
  octave: number;
};

const NOTE_STEPS: readonly NoteStep[] = ["C", "D", "E", "F", "G", "A", "B"];

const SEMITONE_OFFSET: Readonly<Record<NoteStep, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const DIVISIONS = 4;
const NOTES_PER_MEASURE = 4;
const DURATION_TO_TYPE: Readonly<Record<number, string>> = {
  2: "eighth",
  4: "quarter",
  8: "half",
  16: "whole",
};

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function parseNoteName(note: string): Pitch {
  const match = /^([A-G])([0-8])$/.exec(note);
  if (!match) {
    throw new Error(`Invalid note name "${note}". Expected natural note like C4.`);
  }

  return {
    step: match[1] as NoteStep,
    octave: Number(match[2]),
  };
}

function pitchToMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + SEMITONE_OFFSET[pitch.step];
}

function naturalPitchesInRange(minMidi: number, maxMidi: number): readonly Pitch[] {
  const pitches: Pitch[] = [];

  for (let octave = 0; octave <= 8; octave++) {
    for (const step of NOTE_STEPS) {
      const midi = pitchToMidi({ step, octave });
      if (midi >= minMidi && midi <= maxMidi) {
        pitches.push({ step, octave });
      }
    }
  }

  return pitches;
}

function inferClefFromRange(minMidi: number, maxMidi: number): Clef {
  const midpoint = (minMidi + maxMidi) / 2;
  return midpoint < 60 ? "bass" : "treble";
}

function serializeAttributes(): string {
  return [
    "        <attributes>",
    `          <divisions>${DIVISIONS}</divisions>`,
    "          <key><fifths>0</fifths></key>",
    "          <time><beats>4</beats><beat-type>4</beat-type></time>",
    "          <staves>2</staves>",
    "          <clef number=\"1\"><sign>G</sign><line>2</line></clef>",
    "          <clef number=\"2\"><sign>F</sign><line>4</line></clef>",
    "        </attributes>",
  ].join("\n");
}

function serializeNote(pitch: Pitch, staff: 1 | 2): string {
  return [
    "        <note>",
    "          <pitch>",
    `            <step>${pitch.step}</step>`,
    `            <octave>${pitch.octave}</octave>`,
    "          </pitch>",
    "          <voice>1</voice>",
    `          <duration>${DIVISIONS}</duration>`,
    "          <type>quarter</type>",
    `          <staff>${staff}</staff>`,
    "        </note>",
  ].join("\n");
}

function serializeRest(duration: number, staff: 1 | 2): string {
  const type = DURATION_TO_TYPE[duration] ?? "quarter";
  return [
    "        <note>",
    "          <rest/>",
    "          <voice>2</voice>",
    `          <duration>${duration}</duration>`,
    `          <type>${type}</type>`,
    `          <staff>${staff}</staff>`,
    "        </note>",
  ].join("\n");
}

export function generateScore(options: GeneratorOptions): GeneratedScore {
  const { minNote, maxNote, noteCount, seed = Date.now() } = options;

  if (!Number.isInteger(noteCount) || noteCount <= 0) {
    throw new Error(`noteCount must be a positive integer. Received: ${noteCount}`);
  }

  const minMidi = pitchToMidi(parseNoteName(minNote));
  const maxMidi = pitchToMidi(parseNoteName(maxNote));

  if (minMidi > maxMidi) {
    throw new Error(`minNote must be <= maxNote. Received: ${minNote} > ${maxNote}.`);
  }

  const pitchPool = naturalPitchesInRange(minMidi, maxMidi);
  if (pitchPool.length === 0) {
    throw new Error(`No natural pitches available between ${minNote} and ${maxNote}.`);
  }

  const rng = createRng(seed);
  const clef = inferClefFromRange(minMidi, maxMidi);
  const noteStaff: 1 | 2 = clef === "treble" ? 1 : 2;
  const restStaff: 1 | 2 = clef === "treble" ? 2 : 1;
  const expectedNotes: number[] = [];
  const measureXmls: string[] = [];

  let remaining = noteCount;
  let measureNumber = 1;

  while (remaining > 0) {
    const count = Math.min(NOTES_PER_MEASURE, remaining);
    const notes: Pitch[] = [];
    for (let i = 0; i < count; i++) {
      notes.push(pick(pitchPool, rng));
    }

    expectedNotes.push(...notes.map(pitchToMidi));
    const attributes = measureNumber === 1 ? "\n" + serializeAttributes() : "";
    const noteDuration = count * DIVISIONS;
    const noteElements = [
      notes.map((note) => serializeNote(note, noteStaff)).join("\n"),
      "        <backup>",
      `          <duration>${noteDuration}</duration>`,
      "        </backup>",
      serializeRest(noteDuration, restStaff),
    ].join("\n");

    measureXmls.push(
      [`      <measure number="${measureNumber}">${attributes}`, noteElements, "      </measure>"].join("\n"),
    );

    measureNumber += 1;
    remaining -= count;
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"',
    '  "http://www.musicxml.org/dtds/partwise.dtd">',
    '<score-partwise version="3.1">',
    "  <part-list>",
    '    <score-part id="P1"><part-name>Music</part-name></score-part>',
    "  </part-list>",
    '  <part id="P1">',
    measureXmls.join("\n"),
    "  </part>",
    "</score-partwise>",
  ].join("\n");

  return { xml, expectedNotes };
}
