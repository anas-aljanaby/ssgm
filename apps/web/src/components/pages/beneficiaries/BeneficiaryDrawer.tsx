import React, { useEffect } from 'react';
import ModalPortal from '../../common/ModalPortal';
import type { Beneficiary } from '../../../types';
import { X } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import BeneficiaryDetailView from './BeneficiaryDetailView';

interface BeneficiaryDrawerProps {
  beneficiary: Beneficiary | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (beneficiary: Beneficiary) => void;
}

const BeneficiaryDrawer: React.FC<BeneficiaryDrawerProps> = ({
  beneficiary,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { t, dir, language } = useLocalization(['beneficiaries']);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !beneficiary) return null;

  const sideClass = dir === 'rtl' ? 'left-0' : 'right-0';
  const transformClass = isOpen
    ? 'translate-x-0'
    : dir === 'rtl'
      ? '-translate-x-full'
      : 'translate-x-full';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/50 animate-fade-in"
      containerClassName="relative min-h-full"
    >
      <aside
        className={`absolute top-0 ${sideClass} h-full w-full max-w-2xl transform bg-card shadow-2xl transition-transform duration-300 ease-out dark:bg-dark-card ${transformClass}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-700">
            <h2 className="truncate text-lg font-bold text-foreground dark:text-dark-foreground">
              {beneficiary.name[language] || beneficiary.name.en || beneficiary.name.ar}
            </h2>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
              aria-label={t('beneficiaries.drawer.close')}
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <BeneficiaryDetailView
              beneficiary={beneficiary}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </aside>
    </ModalPortal>
  );
};

export default BeneficiaryDrawer;
