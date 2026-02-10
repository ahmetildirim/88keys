export function formatTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
}
