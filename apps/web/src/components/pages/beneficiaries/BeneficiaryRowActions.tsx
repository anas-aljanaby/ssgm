import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Beneficiary, BeneficiaryStatus } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useToast } from '../../../hooks/useToast';

interface BeneficiaryRowActionsProps {
  beneficiary: Beneficiary;
  onView: () => void;
  onChangeStatus: (status: BeneficiaryStatus) => void;
  onRemove: () => void;
}

const STATUS_OPTIONS: BeneficiaryStatus[] = ['active', 'inactive', 'suspended', 'graduated', 'on-hold'];

const BeneficiaryRowActions: React.FC<BeneficiaryRowActionsProps> = ({
  beneficiary,
  onView,
  onChangeStatus,
  onRemove,
}) => {
  const { t } = useLocalization(['common', 'beneficiaries']);
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsStatusMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (status: BeneficiaryStatus) => {
    onChangeStatus(status);
    setIsOpen(false);
    setIsStatusMenuOpen(false);
    toast.showSuccess(t('beneficiaries.actions.statusChanged'));
  };

  const handleRemoveConfirm = () => {
    onRemove();
    setIsConfirmOpen(false);
    setIsOpen(false);
    toast.showSuccess(t('beneficiaries.actions.removed', { name: beneficiary.name.en }));
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setIsStatusMenuOpen(false);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-9 z-20 w-44 rounded-lg border border-gray-200 bg-card p-1 shadow-lg dark:border-slate-700 dark:bg-dark-card">
          <button
            onClick={onView}
            className="w-full rounded-md px-3 py-2 text-start text-sm text-foreground transition-colors hover:bg-gray-100 dark:text-dark-foreground dark:hover:bg-slate-800"
          >
            {t('beneficiaries.actions.viewDetails')}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsStatusMenuOpen((prev) => !prev)}
              className="w-full rounded-md px-3 py-2 text-start text-sm text-foreground transition-colors hover:bg-gray-100 dark:text-dark-foreground dark:hover:bg-slate-800"
            >
              {t('beneficiaries.actions.changeStatus')}
            </button>

            {isStatusMenuOpen && (
              <div className="absolute start-full top-0 z-30 ms-1 w-44 rounded-lg border border-gray-200 bg-card p-1 shadow-lg dark:border-slate-700 dark:bg-dark-card">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="w-full rounded-md px-3 py-2 text-start text-sm text-foreground transition-colors hover:bg-gray-100 dark:text-dark-foreground dark:hover:bg-slate-800"
                  >
                    {t(`beneficiaries.statuses.${status}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsConfirmOpen(true)}
            className="w-full rounded-md px-3 py-2 text-start text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {t('beneficiaries.actions.remove')}
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRemoveConfirm}
        title={t('beneficiaries.actions.remove')}
        message={t('beneficiaries.actions.removeConfirm')}
      />
    </div>
  );
};

export default BeneficiaryRowActions;
