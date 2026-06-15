import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatDate } from '../../../lib/utils';
import type { AuditLog } from '../../../types';
import AiCard from '../ai/AiCard';

interface AuditTabProps {
  log: AuditLog[];
}

const AuditTab: React.FC<AuditTabProps> = ({ log }) => {
  const { t, language } = useLocalization(['common', 'grc']);

  return (
    <AiCard title={t('grc.audit.title')}>
      <div className="mb-4 flex justify-end">
        {/* DEFERRED: needs platform-wide audit emission — see Deferred Activation Register */}
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {t('grc.deferred.crossModuleAudit')}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="p-2">{t('grc.audit.table.date')}</th>
              <th className="p-2">{t('grc.audit.table.user')}</th>
              <th className="p-2">{t('grc.audit.table.module')}</th>
              <th className="p-2">{t('grc.audit.table.action')}</th>
              <th className="p-2">{t('grc.audit.table.recordId')}</th>
            </tr>
          </thead>
          <tbody className="text-foreground dark:text-dark-foreground">
            {log.map((entry) => (
              <tr key={entry.id} className="border-t dark:border-slate-700">
                <td className="p-2">
                  {formatDate(entry.timestamp, language, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="p-2">{entry.userId}</td>
                <td className="p-2">
                  {t(`grc.audit.modules.${entry.module}`, entry.module)}
                </td>
                <td className="p-2">
                  {t(`grc.audit.actions.${entry.action}`, entry.action)}
                </td>
                <td className="p-2 font-mono text-xs">
                  {t(`grc.audit.recordTypes.${entry.recordType}`, entry.recordType)}:{entry.recordId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AiCard>
  );
};

export default AuditTab;
