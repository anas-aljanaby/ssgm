import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useToast } from '../../../hooks/useToast';
import type { FinancialTransaction } from '../../../types/financials';

interface TransactionRowActionsProps {
  transaction: FinancialTransaction;
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
}

const TransactionRowActions: React.FC<TransactionRowActionsProps> = ({
  transaction,
  onDelete,
  isDeleting = false,
}) => {
  const { t, language } = useLocalization(['common', 'financials']);
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayDescription =
    transaction.description[language]?.trim() ||
    transaction.description[language === 'en' ? 'ar' : 'en']?.trim() ||
    transaction.reference;

  const handleDeleteConfirm = async () => {
    try {
      await onDelete();
      toast.showSuccess(t('financials.transactions.deleteSuccess', 'Transaction deleted'));
    } catch {
      toast.showError(
        t('financials.transactions.deleteFailed', 'Unable to delete transaction. Please try again.')
      );
    } finally {
      setIsConfirmOpen(false);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDeleting}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
        aria-label={t('financials.common.actions', 'Actions')}
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-9 z-20 w-44 rounded-lg border border-gray-200 bg-card p-1 shadow-lg dark:border-slate-700 dark:bg-dark-card">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isDeleting}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
            {t('financials.transactions.delete', 'Delete')}
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('financials.transactions.delete', 'Delete')}
        message={t('financials.transactions.deleteConfirm', {
          description: displayDescription,
          defaultValue: `Permanently delete "${displayDescription}"? This cannot be undone.`,
        })}
      />
    </div>
  );
};

export default TransactionRowActions;
