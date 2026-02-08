/**
 * Staff — renders a MusicXML score using OpenSheetMusicDisplay (OSMD).
 *
 * This component manages the full OSMD lifecycle:
 *   1. Creates the renderer once (lazy initialization on first render)
 *   2. Re-renders whenever `scoreXml` changes
 *   3. Updates cursor color/opacity whenever `cursorStyle` changes
 *
 * The parent controls cursor position via the imperative `StaffHandle` ref,
 * keeping the "which note is current" logic in the parent (App) while this
 * component focuses purely on rendering.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffProps {
  /** Complete MusicXML document string to render. */
  scoreXml: string;
  /** Visual style for the playback cursor. */
  cursorStyle: CursorStyle;
}

interface CursorStyle {
  color: string;
  alpha: number;
}

/** Imperative handle exposed to parent components via ref. */
export interface StaffHandle {
  /** Advance the cursor to the next note position. */
  nextCursor(): void;
  /** Reset the cursor to the first note. */
  resetCursor(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Zoom level for the rendered score (2× for readability). */
const SCORE_ZOOM = 1;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Staff = forwardRef<StaffHandle, StaffProps>(function Staff(
  { scoreXml, cursorStyle },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  // Keep a mutable ref to the latest cursor style so the score-render
  // effect can apply the current style without depending on it.
  const cursorStyleRef = useRef(cursorStyle);
  cursorStyleRef.current = cursorStyle;

  /** Applies color and opacity to the OSMD cursor element. */
  const applyCursorStyle = useCallback((style: CursorStyle) => {
    const cursor = osmdRef.current?.cursor;
    if (!cursor) return;
    cursor.CursorOptions = {
      ...cursor.CursorOptions,
      color: style.color,
      alpha: style.alpha,
    };
    cursor.show();
  }, []);

  /** Lazily creates the OSMD instance (exactly once per mount). */
  const getOrCreateOsmd = useCallback((): OpenSheetMusicDisplay | null => {
    if (osmdRef.current) return osmdRef.current;
    if (!containerRef.current) return null;

    osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
      drawMetronomeMarks: false,
      drawTitle: false,
      drawPartNames: false,
      drawMeasureNumbers: false,
      autoResize: true,
      followCursor: true,
    });

    return osmdRef.current;
  }, []);

  // Expose imperative cursor controls to the parent.
  useImperativeHandle(ref, () => ({
    nextCursor: () => osmdRef.current?.cursor?.next(),
    resetCursor: () => osmdRef.current?.cursor?.reset(),
  }), []);

  // Load and render the score whenever the XML changes.
  useEffect(() => {
    const osmd = getOrCreateOsmd();
    if (!osmd) return;

    let cancelled = false;

    (async () => {
      await osmd.load(scoreXml);
      if (cancelled) return;

      osmd.zoom = SCORE_ZOOM;
      osmd.render();
      applyCursorStyle(cursorStyleRef.current);
      osmd.cursor?.reset();
    })();

    return () => {
      cancelled = true;
    };
  }, [scoreXml, getOrCreateOsmd, applyCursorStyle]);

  // Update cursor appearance independently of score rendering.
  useEffect(() => {
    applyCursorStyle(cursorStyle);
  }, [cursorStyle, applyCursorStyle]);

  return <div id="osmd" className="osmd" ref={containerRef} />;
});

export default Staff;
