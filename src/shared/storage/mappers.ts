import type { PreviousSessionItem } from "../../features/setup/types";
import { formatTime } from "../utils/formatTime";
import type { PersistedSessionRun } from "./types";

const hourMinuteFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const monthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function isSameCalendarDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatCreatedAtLabel(createdAt: number): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const now = new Date();
  if (isSameCalendarDate(date, now)) {
    return `Today ${hourMinuteFormatter.format(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDate(date, yesterday)) {
    return `Yesterday ${hourMinuteFormatter.format(date)}`;
  }

  return monthDayYearFormatter.format(date);
}

export function formatDurationLabel(seconds: number): string {
  return formatTime(seconds);
}

export function toPreviousSessionItem(run: PersistedSessionRun): PreviousSessionItem {
  return {
    id: run.id,
    createdAtLabel: formatCreatedAtLabel(run.createdAt),
    durationLabel: formatDurationLabel(run.durationSeconds),
    accuracy: run.accuracy,
    config: {
      minNote: run.config.minNote,
      maxNote: run.config.maxNote,
      totalNotes: run.config.totalNotes,
    },
  };
}
