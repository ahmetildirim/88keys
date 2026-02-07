import { useCallback, useEffect, useMemo, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { buildScore } from "../lib/musicxml";
import type { RangePreset } from "../config/presets";

type CursorStyle = {
  color: string;
  alpha: number;
};

type StaffProps = {
  rangePreset: RangePreset;
  totalNotes: number;
  seed: number;
  onExpectedChange: (expected: Array<number | null>) => void;
  onOsmdReady?: (osmd: OpenSheetMusicDisplay) => void;
  cursorStyle: CursorStyle;
};

export default function Staff({
  rangePreset,
  totalNotes,
  seed,
  onExpectedChange,
  onOsmdReady,
  cursorStyle,
}: StaffProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  const scoreData = useMemo(
    () =>
      buildScore({
        rangePreset,
        notesPerMeasure: 4,
        totalNotes,
        seed,
      }),
    [rangePreset, totalNotes, seed]
  );

  const applyCursorStyle = useCallback(() => {
    const cursor = osmdRef.current?.cursor;
    if (!cursor) return;
    cursor.CursorOptions = {
      ...cursor.CursorOptions,
      color: cursorStyle.color,
      alpha: cursorStyle.alpha,
    };
    cursor.show();
  }, [cursorStyle]);

  const renderScore = useCallback(async () => {
    if (!containerRef.current) return;
    if (!osmdRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        drawTitle: false,
        drawPartNames: false,
        drawMeasureNumbers: false,
        autoResize: true,
      });
    }

    await osmdRef.current.load(scoreData.xml);
    osmdRef.current.zoom = 2;
    osmdRef.current.render();

    const cursor = osmdRef.current.cursor;
    if (cursor) {
      applyCursorStyle();
      cursor.reset();
    }

    onExpectedChange(scoreData.expected);
    onOsmdReady?.(osmdRef.current);
  }, [applyCursorStyle, onExpectedChange, onOsmdReady, scoreData]);

  useEffect(() => {
    renderScore();
  }, [renderScore]);

  useEffect(() => {
    applyCursorStyle();
  }, [applyCursorStyle]);

  return <div id="osmd" className="osmd" ref={containerRef}></div>;
}
