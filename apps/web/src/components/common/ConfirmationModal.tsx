
import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { WarningTriangleIcon } from '../icons/UtilityIcons';
import ModalPortal from './ModalPortal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  /** Parent-controlled pending state (e.g. from useDestructiveConfirmation). */
  isConfirming?: boolean;
}

function isPromise(value: unknown): value is Promise<void> {
  return !!value && typeof (value as Promise<void>).then === 'function';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmingLabel,
  isConfirming = false,
}) => {
  const { t } = useLocalization();
  const [internalPending, setInternalPending] = React.useState(false);
  const busy = isConfirming || internalPending;

  React.useEffect(() => {
    if (!isOpen) setInternalPending(false);
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, busy]);

  const handleConfirm = async () => {
    if (busy) return;

    try {
      const result = onConfirm();
      if (isPromise(result)) {
        setInternalPending(true);
        await result;
      }
    } finally {
      setInternalPending(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  if (!isOpen) return null;

  const pendingLabel = confirmingLabel ?? t('common.deleting', 'Deleting…');

  return (
    <ModalPortal isOpen={isOpen} onClose={handleClose} labelledBy="confirmation-title">
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <WarningTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <div className="mt-0 text-center sm:text-left">
              <h3 className="text-lg leading-6 font-bold text-foreground dark:text-dark-foreground" id="confirmation-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => { void handleConfirm(); }}
            disabled={busy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            )}
            {busy ? pendingLabel : (confirmLabel ?? t('common.confirm'))}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmationModal;
