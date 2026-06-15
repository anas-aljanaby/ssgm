import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useUpdateGrcRisk } from '../../../hooks/useGrc';
import type { GrcRisk } from '../../../types';
import { getRiskLevelBadgeStyles } from './utils';

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => (
  <div>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="text-md font-bold">{value}</p>
  </div>
);

interface RiskDetailModalProps {
  risk: GrcRisk | null;
  onClose: () => void;
}

const RiskDetailModal: React.FC<RiskDetailModalProps> = ({ risk, onClose }) => {
  const { t, language } = useLocalization(['common', 'grc', 'projects']);
  const toast = useToast();
  const updateRisk = useUpdateGrcRisk();
  const [mitigationText, setMitigationText] = useState('');

  if (!risk) return null;

  const { text, bg } = getRiskLevelBadgeStyles(risk.level);

  const handleUpdateMitigation = async () => {
    const nextMitigation = mitigationText.trim()
      ? [{ en: mitigationText.trim(), ar: mitigationText.trim() }, ...risk.mitigation]
      : risk.mitigation;

    try {
      await updateRisk.mutateAsync({
        id: risk.id,
        mitigation: nextMitigation,
        status: risk.status === 'identified' ? 'mitigating' : risk.status,
      });
      toast.showSuccess(t('grc.risk.toasts.updated'));
      setMitigationText('');
      onClose();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{risk.risk[language]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className={`p-3 rounded-lg ${bg}`}>
              <p className="text-xs font-bold">{t('grc.risk.level')}</p>
              <p className={`text-lg font-extrabold ${text}`}>{t(`grc.risk.levels.${risk.level}`)}</p>
            </div>
            <DetailField label={t('grc.risk.table.score')} value={risk.score} />
            <DetailField label={t('projects.risks.impact')} value={risk.impact} />
            <DetailField label={t('projects.risks.probability')} value={risk.probability} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField
              label={t('projects.risks.category')}
              value={t(`grc.risk.categories.${risk.category}`, risk.category)}
            />
            <DetailField
              label={t('grc.risk.scope')}
              value={t(`grc.risk.scopes.${risk.scope}`, risk.scope)}
            />
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">{t('grc.risk.mitigation.title')}</h3>
            <ul className="list-disc list-inside space-y-1 text-sm bg-gray-50 dark:bg-slate-800/50 p-4 rounded-md">
              {risk.mitigation.map((item, idx) => (
                <li key={idx}>{item[language]}</li>
              ))}
            </ul>
            <textarea
              value={mitigationText}
              onChange={(e) => setMitigationText(e.target.value)}
              rows={2}
              placeholder={t('grc.risk.mitigation.placeholder')}
              className="mt-3 w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold"
          >
            {t('common.close')}
          </button>
          <button
            type="button"
            onClick={handleUpdateMitigation}
            disabled={updateRisk.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {updateRisk.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('grc.risk.mitigation.update')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskDetailModal;
