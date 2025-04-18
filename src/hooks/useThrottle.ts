import { useCallback, useRef } from "preact/hooks";

export const useThrottle = (fn: (...args: any[]) => void, delay: number) => {
    const lastCall = useRef(0);

    return useCallback((...args: any[]) => {
        const now = Date.now();
        if (now - lastCall.current >= delay) {
            lastCall.current = now;
            fn(...args);
        }
    }, [fn, delay]);
};