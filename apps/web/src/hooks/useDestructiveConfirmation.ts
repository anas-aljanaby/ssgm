import { useCallback, useRef, useState } from 'react';

/** Duration for row exit animation after a successful destructive action. */
export const ROW_EXIT_MS = 220;

function delay(ms: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export interface UseDestructiveConfirmationOptions<T> {
    getRowId: (item: T) => string;
}

/**
 * Reusable state for destructive list actions (delete/remove):
 * - confirmation target + pending modal state
 * - highlighted pending row while the API runs
 * - exit animation on the row before the caller removes it from cache
 */
export function useDestructiveConfirmation<T>({ getRowId }: UseDestructiveConfirmationOptions<T>) {
    const [target, setTarget] = useState<T | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [pendingRowId, setPendingRowId] = useState<string | null>(null);
    const [exitingRowId, setExitingRowId] = useState<string | null>(null);
    const pendingRef = useRef(false);

    const open = useCallback((item: T) => {
        if (pendingRef.current) return;
        setTarget(item);
    }, []);

    const close = useCallback(() => {
        if (pendingRef.current) return;
        setTarget(null);
    }, []);

    const confirm = useCallback(async (action: (item: T) => Promise<void>): Promise<T | null> => {
        if (!target || pendingRef.current) return null;

        const item = target;
        const rowId = getRowId(item);
        pendingRef.current = true;
        setIsPending(true);
        setPendingRowId(rowId);

        try {
            await action(item);
            setTarget(null);
            setPendingRowId(null);
            setExitingRowId(rowId);
            await delay(ROW_EXIT_MS);
            setExitingRowId(null);
            return item;
        } catch (error) {
            setPendingRowId(null);
            throw error;
        } finally {
            pendingRef.current = false;
            setIsPending(false);
        }
    }, [target, getRowId]);

    const isRowPending = useCallback((id: string) => pendingRowId === id, [pendingRowId]);
    const isRowExiting = useCallback((id: string) => exitingRowId === id, [exitingRowId]);
    const isRowBusy = useCallback(
        (id: string) => pendingRowId === id || exitingRowId === id,
        [pendingRowId, exitingRowId],
    );

    return {
        target,
        isOpen: target != null,
        isPending,
        pendingRowId,
        exitingRowId,
        open,
        close,
        confirm,
        isRowPending,
        isRowExiting,
        isRowBusy,
    };
}
