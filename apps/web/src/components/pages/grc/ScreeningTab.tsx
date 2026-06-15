import React, { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useGrcScreening, useScreenEntity, type ScreeningResult } from '../../../hooks/useGrc';
import type { ComplianceEntityType, RiskLevel } from '../../../types';
import { formatDate, formatNumber } from '../../../lib/utils';

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9.5 14.5 5-5" />
    <path d="m14.5 14.5-5-5" />
  </svg>
);

const ShieldAlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const { language } = useLocalization();
  return (
    <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft flex items-center space-x-4 rtl:space-x-reverse">
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">
          {formatNumber(value, language)}
        </p>
      </div>
    </div>
  );
};

const ScreeningTab: React.FC = () => {
  const { t, language } = useLocalization(['common', 'compliance', 'projects', 'grc']);
  const toast = useToast();
  const { data, isLoading, isError } = useGrcScreening();
  const screenEntity = useScreenEntity();

  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<ComplianceEntityType>('individual');
  const [country, setCountry] = useState('');
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);

  const stats = data?.stats ?? {
    totalEntities: 0,
    highRisk: 0,
    openAlerts: 0,
  };
  const entities = data?.entities ?? [];
  const alerts = data?.alerts ?? [];

  const handleScreen = async () => {
    if (!entityName.trim() || !country.trim()) {
      toast.showWarning(t('compliance.toasts.missingInfoMessage'), {
        title: t('compliance.toasts.missingInfoTitle'),
      });
      return;
    }

    setScreeningResult(null);

    try {
      const response = await screenEntity.mutateAsync({
        name: entityName.trim(),
        type: entityType,
        country: country.trim(),
        listSourceLabel: t('compliance.simulatedWatchlist'),
      });
      setScreeningResult(response.result);
      setEntityName('');
      setCountry('');
    } catch {
      toast.showError(t('compliance.toasts.screeningFailedMessage'), {
        title: t('compliance.toasts.screeningFailedTitle'),
      });
    }
  };

  const riskLevelStyles = (level: RiskLevel) => {
    switch (level) {
      case 'high':
        return 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-200';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 text-green-800 dark:text-green-200';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const riskEmoji = (level: RiskLevel) => {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪️';
    }
  };

  const recommendationEmoji = (rec: string) => {
    switch (rec) {
      case 'approve': return '👍';
      case 'review': return '🤔';
      case 'reject': return '👎';
      default: return '❔';
    }
  };

  const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
    const styles: Record<RiskLevel, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[level]}`}>
        {t(`projects.risks.levels.${level}`)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-dashed border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        {t('common.error')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DEFERRED: needs external AML/sanctions provider — see Deferred Activation Register */}
      <div className="relative">
        <span className="absolute top-0 end-0 z-10 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {t('grc.deferred.simulatedScreening')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('compliance.totalEntities')}
          value={stats.totalEntities}
          icon={<ShieldCheckIcon />}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
        />
        <StatCard
          title={t('compliance.highRisk')}
          value={stats.highRisk}
          icon={<ShieldAlertIcon />}
          color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
        />
        <StatCard
          title={t('compliance.openAlerts')}
          value={stats.openAlerts}
          icon={<AlertTriangleIcon />}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">{t('compliance.screenNew')}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('compliance.entityName')}</label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('compliance.entityType')}</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as ComplianceEntityType)}
                className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              >
                <option value="individual">{t('compliance.types.individual')}</option>
                <option value="organization">{t('compliance.types.organization')}</option>
                <option value="vendor">{t('compliance.types.vendor')}</option>
                <option value="partner">{t('compliance.types.partner')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('compliance.country')}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <button
              onClick={handleScreen}
              disabled={screenEntity.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors disabled:bg-gray-400"
            >
              {screenEntity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('compliance.aiScreen')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="text-lg font-bold mb-4">{t('compliance.recentlyScreened')}</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="p-2">{t('compliance.headers.name')}</th>
                  <th className="p-2">{t('compliance.headers.type')}</th>
                  <th className="p-2">{t('compliance.headers.riskLevel')}</th>
                  <th className="p-2">{t('compliance.headers.date')}</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity) => (
                  <tr key={entity.id} className="border-t dark:border-slate-700">
                    <td className="p-2 font-semibold text-foreground dark:text-dark-foreground">{entity.name}</td>
                    <td className="p-2 capitalize text-gray-500 dark:text-gray-400">
                      {t(`compliance.types.${entity.type}`)}
                    </td>
                    <td className="p-2">
                      <RiskBadge level={entity.riskLevel as RiskLevel} />
                    </td>
                    <td className="p-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entity.lastScreened, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {screeningResult && (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700/50 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-dark-foreground mb-6">
            📊 {t('compliance.results')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition">
              <div className="text-sm font-medium mb-2 opacity-90">{t('compliance.score')}</div>
              <div className="text-5xl font-bold">
                {screeningResult.risk_score}
                <span className="text-2xl">/100</span>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border-2 shadow-lg transform hover:scale-105 transition ${riskLevelStyles(screeningResult.risk_level)}`}>
              <div className="text-sm font-medium mb-2">{t('compliance.level')}</div>
              <div className="text-5xl font-bold flex items-center gap-2">
                {riskEmoji(screeningResult.risk_level)}
                <span>{t(`projects.risks.levels.${screeningResult.risk_level}`)}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition">
              <div className="text-sm font-medium mb-2 opacity-90">{t('compliance.rec')}</div>
              <div className="text-5xl font-bold flex items-center gap-2">
                {recommendationEmoji(screeningResult.recommendation)}
                <span>{t(`compliance.recommendations.${screeningResult.recommendation}`)}</span>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-6 border-2 mb-6 ${riskLevelStyles(screeningResult.risk_level)}`}>
            <h3 className="font-bold text-lg mb-3">💡 {t('compliance.details')}</h3>
            <p className="leading-relaxed">
              {language === 'ar' ? screeningResult.reasoning_ar : screeningResult.reasoning_en}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 px-6 py-4 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span className="font-medium">{t('compliance.saveSuccess')}</span>
          </div>
        </div>
      )}

      <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
        <h3 className="text-lg font-bold mb-4">{t('compliance.activeAlerts')}</h3>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-2">{t('compliance.headers.entity')}</th>
                <th className="p-2">{t('compliance.headers.matchDetails')}</th>
                <th className="p-2">{t('compliance.headers.status')}</th>
                <th className="p-2">{t('compliance.headers.date')}</th>
              </tr>
            </thead>
            <tbody>
              {alerts
                .filter((alert) => alert.status === 'open' || alert.status === 'in-review')
                .map((alert) => (
                  <tr key={alert.id} className="border-t dark:border-slate-700">
                    <td className="p-2 font-semibold text-foreground dark:text-dark-foreground">
                      {alert.entityName}
                    </td>
                    <td className="p-2 text-xs max-w-sm truncate text-gray-500 dark:text-gray-400">
                      {alert.matchDetails}
                    </td>
                    <td className="p-2 capitalize text-gray-500 dark:text-gray-400">
                      {t(`compliance.alertStatuses.${alert.status.replace(/-/g, '_')}`)}
                    </td>
                    <td className="p-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(alert.createdAt, language)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScreeningTab;
