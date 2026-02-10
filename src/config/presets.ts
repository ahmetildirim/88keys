/**
 * Cursor feedback styles — visual configuration for the OSMD cursor.
 */

import type { CursorFeedback } from "../types";

interface CursorStyle {
    color: string;
    alpha: number;
}

/**
 * Maps each feedback state to the visual style applied to the OSMD cursor.
 *
 *   idle    — default blue; awaiting player input
 *   correct — green flash; the player pressed the right key
 *   wrong   — red flash; the player pressed the wrong key
 */
export const CURSOR_STYLES: Readonly<Record<CursorFeedback, CursorStyle>> = {
    idle: { color: "#6daaf5", alpha: 0.60 },
    correct: { color: "#76ffa8", alpha: 0.40 },
    wrong: { color: "#f76666", alpha: 0.45 },
};
