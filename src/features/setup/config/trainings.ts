import type { NoteName } from "../../../entities/score";

export type Training = {
    id: string;
    title: string;
    minNote: NoteName;
    maxNote: NoteName;
    totalNotes: number;
};

export const TRAININGS: readonly Training[] = [
    { id: "treble-low", title: "Treble low", minNote: "C4", maxNote: "C5", totalNotes: 60 },
    { id: "bass-middle", title: "Bass middle", minNote: "C3", maxNote: "C4", totalNotes: 60 },
    { id: "treble-middle", title: "Treble middle", minNote: "C5", maxNote: "C6", totalNotes: 80 },
    { id: "grand-staff-narrow", title: "Grand staff narrow", minNote: "C3", maxNote: "C5", totalNotes: 100 },
    { id: "bass-low-middle", title: "Bass low–middle", minNote: "E2", maxNote: "E4", totalNotes: 140 },
    { id: "grand-staff-mod", title: "Grand staff moderate", minNote: "E2", maxNote: "G5", totalNotes: 200 },
    { id: "grand-staff-wide", title: "Grand staff wide", minNote: "C2", maxNote: "C6", totalNotes: 260 },
] as const;
