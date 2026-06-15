import React, { useMemo, useState } from 'react';
import {
  TriangleAlert,
  BarChart3,
  Search,
  CirclePlus,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useCreateGrcRisk } from '../../../hooks/useGrc';
import type { GrcRisk, GrcRiskLevel } from '../../../types';
import AiCard from '../ai/AiCard';
import StatCard from './StatCard';
import RiskMatrix from './RiskMatrix';
import RiskStatusBadge from './RiskStatusBadge';
import RiskDetailModal from './RiskDetailModal';
import LogRiskModal from './LogRiskModal';
import { getRiskLevelCardStyles } from './utils';

interface RiskTabProps {
  risks: GrcRisk[];
}

const LevelBadge: React.FC<{ level: GrcRiskLevel }> = ({ level }) => {
  const { t } = useLocalization(['grc']);
  const { text, bg } = getRiskLevelCardStyles(level);
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>
      {t(`grc.risk.levels.${level}`)}
    </span>
  );
};

const RiskTab: React.FC<RiskTabProps> = ({ risks }) => {
  const { t, language } = useLocalization(['common', 'grc', 'projects']);
  const toast = useToast();
  const createRisk = useCreateGrcRisk();
  const [registerSearch, setRegisterSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<GrcRisk | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const stats = useMemo(
    () => ({
      total: risks.length,
      critical: risks.filter((r) => r.level === 'Critical').length,
      high: risks.filter((r) => r.level === 'High').length,
      medium: risks.filter((r) => r.level === 'Medium').length,
    }),
    [risks],
  );

  const filteredRegister = useMemo(
    () =>
      risks.filter((risk) => {
        if (registerSearch === '') return true;
        const query = registerSearch.toLowerCase();
        return (
          risk.risk.en.toLowerCase().includes(query) ||
          risk.risk.ar.toLowerCase().includes(query)
        );
      }),
    [risks, registerSearch],
  );

  const handleLogRisk = async (payload: Parameters<typeof createRisk.mutateAsync>[0]) => {
    try {
      await createRisk.mutateAsync(payload);
      toast.showSuccess(t('grc.risk.toasts.logged'));
      setIsLogModalOpen(false);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t('common.error'));
      throw err;
    }
  };

  const translateCategory = (category: string) =>
    t(`grc.risk.categories.${category}`, category);

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('grc.risk.totalRisks')}
            value={stats.total}
            icon={<BarChart3 />}
          />
          <StatCard
            title={t('grc.risk.criticalRisks')}
            value={stats.critical}
            icon={<TriangleAlert className="text-red-500" />}
          />
          <StatCard
            title={t('grc.risk.highRisks')}
            value={stats.high}
            icon={<TriangleAlert className="text-orange-500" />}
          />
          <StatCard
            title={t('grc.risk.mediumRisks')}
            value={stats.medium}
            icon={<TriangleAlert className="text-yellow-500" />}
          />
        </div>

        <AiCard title={t('grc.risk.register')}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={registerSearch}
                onChange={(e) => setRegisterSearch(e.target.value)}
                placeholder={t('grc.risk.searchPlaceholder')}
                className="w-full p-2 pl-10 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg w-full sm:w-auto"
            >
              <CirclePlus size={16} />
              {t('grc.risk.logRisk')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="p-2">{t('grc.risk.table.description')}</th>
                  <th className="p-2">{t('projects.risks.category')}</th>
                  <th className="p-2 text-center">{t('grc.risk.table.score')}</th>
                  <th className="p-2">{t('grc.risk.level')}</th>
                  <th className="p-2">{t('projects.risks.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegister.map((risk) => {
                  const levelStyles = getRiskLevelCardStyles(risk.level);
                  return (
                    <tr
                      key={risk.id}
                      onClick={() => setSelectedRisk(risk)}
                      className="border-t dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <td className="p-3 font-semibold text-foreground dark:text-dark-foreground">
                        {risk.risk[language]}
                      </td>
                      <td className="p-3">{translateCategory(risk.category)}</td>
                      <td className="p-3 text-center">
                        <div
                          className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-bold ${levelStyles.bg} ${levelStyles.text}`}
                        >
                          {risk.score}
                        </div>
                      </td>
                      <td className="p-3">
                        <LevelBadge level={risk.level} />
                      </td>
                      <td className="p-3">
                        <RiskStatusBadge status={risk.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRegister.length === 0 && (
              <p className="text-center py-8 text-gray-500">{t('common.noResults')}</p>
            )}
          </div>
        </AiCard>

        <RiskMatrix risks={risks} onCellClick={() => {}} activeCell={null} />
      </div>

      {selectedRisk && (
        <RiskDetailModal risk={selectedRisk} onClose={() => setSelectedRisk(null)} />
      )}
      {isLogModalOpen && (
        <LogRiskModal onClose={() => setIsLogModalOpen(false)} onLog={handleLogRisk} />
      )}
    </>
  );
};

export default RiskTab;
