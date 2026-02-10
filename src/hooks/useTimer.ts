import { useCallback, useEffect, useRef, useState } from "react";

export interface Timer {
    elapsedMs: number;
    isRunning: boolean;
    start: () => void;
    stop: () => void;
    toggle: () => void;
    reset: () => void;
}

/**
 * Manages a pausable elapsed-time timer with ~200ms tick resolution.
 *
 * Time is accumulated across start/stop cycles so that pausing
 * and resuming doesn't reset the elapsed value.
 */
export default function useTimer(): Timer {
    const startedAtMs = useRef<number | null>(null);
    const accumulatedMs = useRef(0);

    const [isRunning, setRunning] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);

    const reset = useCallback(() => {
        startedAtMs.current = null;
        accumulatedMs.current = 0;
        setElapsedMs(0);
        setRunning(false);
    }, []);

    const start = useCallback(() => {
        setRunning((current) => {
            if (current) return current;
            startedAtMs.current = Date.now();
            return true;
        });
    }, []);

    const stop = useCallback(() => {
        setRunning((current) => {
            if (!current || startedAtMs.current === null) return current;
            accumulatedMs.current += Date.now() - startedAtMs.current;
            startedAtMs.current = null;
            setElapsedMs(accumulatedMs.current);
            return false;
        });
    }, []);

    const toggle = useCallback(() => {
        setRunning((current) => {
            if (current) {
                // stop
                if (startedAtMs.current !== null) {
                    accumulatedMs.current += Date.now() - startedAtMs.current;
                    startedAtMs.current = null;
                    setElapsedMs(accumulatedMs.current);
                }
                return false;
            }
            // start
            startedAtMs.current = Date.now();
            return true;
        });
    }, []);

    useEffect(() => {
        if (!isRunning) return;

        const tick = () => {
            if (startedAtMs.current === null) return;
            setElapsedMs(
                accumulatedMs.current + (Date.now() - startedAtMs.current),
            );
        };

        tick();
        const intervalId = window.setInterval(tick, 200);
        return () => window.clearInterval(intervalId);
    }, [isRunning]);

    return { elapsedMs, isRunning, start, stop, toggle, reset };
}
