import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useCreateGrcPolicy } from '../../../hooks/useGrc';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewPolicyModal: React.FC<NewPolicyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLocalization(['common', 'grc']);
  const { showSuccess, showError } = useToast();
  const createPolicy = useCreateGrcPolicy();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('compliance');
  const [version, setVersion] = useState('1.0');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createPolicy.mutateAsync({
        title: { en: title.trim(), ar: title.trim() },
        category,
        version: version.trim() || '1.0',
        effectiveDate: effectiveDate || undefined,
        reviewDate: reviewDate || undefined,
      });
      showSuccess(t('grc.governance.toasts.policyLogged'));
      setTitle('');
      setCategory('compliance');
      setVersion('1.0');
      setEffectiveDate('');
      setReviewDate('');
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{t('grc.governance.newPolicy')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('grc.governance.table.policyTitle')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('grc.governance.table.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="compliance">{t('grc.governance.policyCategories.compliance')}</option>
                  <option value="financial">{t('grc.governance.policyCategories.financial')}</option>
                  <option value="hr">{t('grc.governance.policyCategories.hr')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('grc.governance.table.version')}
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={t('grc.governance.versionPlaceholder')}
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('grc.governance.effectiveDate')}
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('grc.governance.table.reviewDate')}
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createPolicy.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {createPolicy.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPolicyModal;
