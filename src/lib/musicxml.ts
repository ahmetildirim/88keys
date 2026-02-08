/**
 * MusicXML score generation for sight-reading practice.
 *
 * Generates valid MusicXML 3.1 documents containing random natural notes
 * within a specified pitch range. The generated scores use:
 *
 *   - 4/4 time signature
 *   - Quarter notes only (keeping rhythm simple for pitch-focused practice)
 *   - Natural notes only (no accidentals)
 *   - A deterministic PRNG so the same seed always produces the same score
 *
 * @see https://www.musicxml.com/for-developers/ for the MusicXML specification.
 */

import type { Clef, Pitch, RangePreset } from "../types";
import { naturalPitchesInRange, pitchToMidi } from "./midi";

// ---------------------------------------------------------------------------
// Deterministic PRNG (splitmix32 variant)
// ---------------------------------------------------------------------------

/**
 * Creates a seeded pseudo-random number generator.
 *
 * Given the same seed, the returned function always produces the identical
 * sequence of values in [0, 1). This guarantees that identical user settings
 * and seed reproduce the exact same score — useful for sharing or replaying.
 */
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

/** Picks a uniformly random element from a non-empty array. */
function pick<T>(items: readonly T[], rng: () => number): T {
    return items[Math.floor(rng() * items.length)];
}

// ---------------------------------------------------------------------------
// MusicXML serialization helpers
// ---------------------------------------------------------------------------

/**
 * MusicXML divisions per quarter note. With divisions = 4:
 *   - eighth  note duration = 2
 *   - quarter note duration = 4
 *   - half    note duration = 8
 */
const DIVISIONS = 4;

/** Maps duration units to MusicXML <type> element values. */
const DURATION_TO_TYPE: Readonly<Record<number, string>> = {
    2: "eighth",
    4: "quarter",
    8: "half",
};

/** Serializes a single <note> element. */
function serializeNote(pitch: Pitch, duration: number): string {
    const type = DURATION_TO_TYPE[duration] ?? "quarter";
    return [
        "        <note>",
        `          <pitch>`,
        `            <step>${pitch.step}</step>`,
        `            <octave>${pitch.octave}</octave>`,
        `          </pitch>`,
        `          <duration>${duration}</duration>`,
        `          <type>${type}</type>`,
        "        </note>",
    ].join("\n");
}

/**
 * Returns the <attributes> block for the first measure, declaring
 * key signature (C major), time signature (4/4), and clef.
 */
function serializeAttributes(clef: Clef): string {
    const sign = clef === "treble" ? "G" : "F";
    const line = clef === "treble" ? 2 : 4;
    return [
        "        <attributes>",
        `          <divisions>${DIVISIONS}</divisions>`,
        "          <key><fifths>0</fifths></key>",
        "          <time><beats>4</beats><beat-type>4</beat-type></time>",
        `          <clef><sign>${sign}</sign><line>${line}</line></clef>`,
        "        </attributes>",
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Measure generation
// ---------------------------------------------------------------------------

interface MeasureResult {
    /** MusicXML fragment for one <measure>. */
    xml: string;
    /** MIDI note numbers for the notes in this measure, in order. */
    midiNotes: number[];
}

/**
 * Generates a single measure of random quarter notes.
 *
 * Notes are drawn uniformly from the natural pitches within the range
 * preset. All notes are quarter-note duration (duration = DIVISIONS).
 */
function buildMeasure(
    pitchPool: readonly Pitch[],
    noteCount: number,
    measureNumber: number,
    clef: Clef,
    isFirstMeasure: boolean,
    rng: () => number,
): MeasureResult {
    const pitches: Pitch[] = [];
    for (let i = 0; i < noteCount; i++) {
        pitches.push(pick(pitchPool, rng));
    }

    const midiNotes = pitches.map(pitchToMidi);
    const attributes = isFirstMeasure ? "\n" + serializeAttributes(clef) : "";
    const noteElements = pitches
        .map((p) => serializeNote(p, DIVISIONS))
        .join("\n");

    const xml = [
        `      <measure number="${measureNumber}">${attributes}`,
        noteElements,
        "      </measure>",
    ].join("\n");

    return { xml, midiNotes };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Input configuration for score generation. */
export interface ScoreConfig {
    /** Which pitch range and clef to use. */
    rangePreset: RangePreset;
    /** Notes per measure (typically 4 for 4/4 with quarter notes). */
    notesPerMeasure: number;
    /** Total number of notes across all measures. */
    totalNotes: number;
    /** Seed for deterministic randomization. Same seed → same score. */
    seed?: number;
}

/** The output of score generation. */
export interface GeneratedScore {
    /** Complete MusicXML document string, ready for OSMD. */
    xml: string;
    /** Ordered MIDI note numbers the player must play to complete the score. */
    expectedNotes: number[];
}

/**
 * Generates a complete MusicXML score filled with random notes.
 *
 * The score is divided into measures of `notesPerMeasure` quarter notes.
 * The final measure may contain fewer notes if `totalNotes` is not evenly
 * divisible by `notesPerMeasure`.
 */
export function generateScore(config: ScoreConfig): GeneratedScore {
    const { rangePreset, notesPerMeasure, totalNotes, seed = Date.now() } = config;

    const rng = createRng(seed);
    const pitchPool = naturalPitchesInRange(rangePreset.minMidi, rangePreset.maxMidi);

    const measureXmls: string[] = [];
    const expectedNotes: number[] = [];
    let remaining = totalNotes;
    let measureNumber = 1;

    while (remaining > 0) {
        const count = Math.min(notesPerMeasure, remaining);
        const measure = buildMeasure(
            pitchPool, count, measureNumber,
            rangePreset.clef, measureNumber === 1, rng,
        );
        measureXmls.push(measure.xml);
        expectedNotes.push(...measure.midiNotes);
        remaining -= count;
        measureNumber++;
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
