import type { NoteName } from "../../entities/score";
import type { ThemeMode } from "../../features/settings/types";

export type PersistedSettings = {
  themeMode: ThemeMode;
  selectedMidiDevice: string;
  minNote: NoteName;
  maxNote: NoteName;
  totalNotes: number;
  updatedAt: number;
};

export type PersistedSessionRun = {
  id: string;
  sessionId: string;
  createdAt: number;
  durationSeconds: number;
  accuracy: number;
  speedNpm: number;
  speedDelta: number;
  improvements: { note: string; misses: number }[];
  config: {
    minNote: NoteName;
    maxNote: NoteName;
    totalNotes: number;
  };
};

export type PersistedCustomTraining = {
  id: string;
  title: string;
  minNote: NoteName;
  maxNote: NoteName;
  totalNotes: number;
  createdAt: number;
};
