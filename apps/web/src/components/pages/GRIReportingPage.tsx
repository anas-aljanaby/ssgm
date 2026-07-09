import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, FileUp, Pencil } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GRIReportingIcon } from '../icons/ModuleIcons';
import ProgressRing from '../common/ProgressRing';
import Tabs from '../common/Tabs';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { topicStandards, universalStandards, type GriStandard } from '../../data/griData';
import {
  useCreateGriReport,
  useDeleteGriReport,
  useGriReports,
  useUpdateGriReport,
} from '../../hooks/useGriReporting';
import {
  griMaterialTopics,
  griReportMeta,
  type GriDisclosureResponse,
  type GriDisclosureStatus,
} from '../../data/griReportingData';

const allStandards: GriStandard[] = [...universalStandards, ...topicStandards];
const standardByNumber = new Map(allStandards.map((s) => [s.disclosureNumber, s]));

// The disclosureNumber already carries the standard-family number (e.g. "201-1"), so the
// canonical GRI reference is just "GRI <disclosureNumber>" — not standard + disclosureNumber.
const disclosureLabel = (s: GriStandard) => `GRI ${s.disclosureNumber}`;

const emptyResponse: GriDisclosureResponse = { narrative: '', status: 'not_started', reference: '' };
const getResponse = (
  responses: Record<string, GriDisclosureResponse>,
  disclosureNumber: string,
): GriDisclosureResponse => responses[disclosureNumber] ?? emptyResponse;
const responseEntries = (responses: Record<string, GriDisclosureResponse>) =>
  Object.entries(responses).map(([disclosureNumber, response]) => ({
    disclosureNumber,
    narrative: response.narrative,
    status: response.status,
    reference: response.reference,
  }));

type FieldKind = 'text' | 'number' | 'currency';
// Typed-input hint carried over from the (removed) questionnaire: numeric disclosures get a
// number input; economic ones get a SAR-suffixed currency input. Everything else is a textarea.
const fieldKind = (standard: GriStandard): FieldKind => {
  if (!standard.dataType.includes('numbers')) return 'text';
  return standard.category === 'Economic' ? 'currency' : 'number';
};

const STATUS_STYLES: Record<GriDisclosureStatus, string> = {
  complete: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  not_started: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
};

const useStatusLabel = () => {
  const { t } = useLocalization(['gri']);
  return (status: GriDisclosureStatus) => {
    if (status === 'complete') return t('gri.dataCollection.statusComplete');
    if (status === 'in_progress') return t('gri.dataCollection.statusInProgress');
    return t('gri.dataCollection.statusNotStarted');
  };
};

const StatusPill: React.FC<{ status: GriDisclosureStatus }> = ({ status }) => {
  const statusLabel = useStatusLabel();
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
};

const requirementKey = (required: GriStandard['required']) => {
  if (required === 'Yes') return 'gri.report.required.yes';
  if (required === 'If applicable') return 'gri.report.required.ifApplicable';
  return 'gri.report.required.recommended';
};

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

const KpiCard: React.FC<{ title: string; percentage: number; color: string }> = ({
  title,
  percentage,
  color,
}) => (
  <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex flex-col items-center text-center">
    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 h-10 flex items-center">
      {title}
    </h3>
    <ProgressRing percentage={percentage} color={color} label="" size={120} />
  </div>
);

type DonutDatum = { key: string; name: string; value: number; color: string };

const DonutTooltip: React.FC<{ active?: boolean; payload?: any[]; total: number }> = ({
  active,
  payload,
  total,
}) => {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload as DonutDatum;
  const pct = total ? Math.round((datum.value / total) * 100) : 0;
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: datum.color }} />
        <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
          {datum.name}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {datum.value} ({pct}%)
      </p>
    </div>
  );
};

const StatusDonut: React.FC<{ data: DonutDatum[]; centerLabel: string }> = ({
  data,
  centerLabel,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const complete = data.find((d) => d.key === 'complete')?.value ?? 0;
  const completionPct = total ? Math.round((complete / total) * 100) : 0;
  const segments = data.filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={segments.length > 1 ? 3 : 0}
              cornerRadius={6}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {segments.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground dark:text-dark-foreground leading-none">
            {completionPct}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{centerLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {data.map((entry) => {
          const pct = total ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div
              key={entry.key}
              className="flex flex-col items-center text-center rounded-lg py-2 bg-gray-50 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-lg font-bold text-foreground dark:text-dark-foreground leading-none">
                  {entry.value}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-full px-1">
                {entry.name}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{
  responses: Record<string, GriDisclosureResponse>;
  reportPeriod: string;
  onSavePeriod: (period: string) => void;
  onOpenDisclosure: (disclosureNumber: string) => void;
}> = ({ responses, reportPeriod, onSavePeriod, onOpenDisclosure }) => {
  const { t } = useLocalization(['gri']);

  const kpis = useMemo(() => {
    const completeIn = (list: GriStandard[]) =>
      list.filter((s) => getResponse(responses, s.disclosureNumber).status === 'complete').length;
    const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);
    return {
      overall: pct(completeIn(allStandards), allStandards.length),
      universal: pct(completeIn(universalStandards), universalStandards.length),
      topic: pct(completeIn(topicStandards), topicStandards.length),
    };
  }, [responses]);

  const donut = useMemo(() => {
    let complete = 0;
    let partial = 0;
    let missing = 0;
    for (const s of allStandards) {
      const status = getResponse(responses, s.disclosureNumber).status;
      if (status === 'complete') complete += 1;
      else if (status === 'in_progress') partial += 1;
      else missing += 1;
    }
    return [
      { key: 'complete', name: t('gri.statuses.complete'), value: complete, color: '#22c55e' },
      { key: 'partial', name: t('gri.statuses.partial'), value: partial, color: '#f59e0b' },
      { key: 'missing', name: t('gri.statuses.missing'), value: missing, color: '#ef4444' },
    ];
  }, [responses, t]);

  const gaps = useMemo(
    () =>
      allStandards.filter(
        (s) => s.required === 'Yes' && getResponse(responses, s.disclosureNumber).status !== 'complete',
      ),
    [responses],
  );

  const materialTopics = useMemo(
    () =>
      griMaterialTopics
        .map((num) => standardByNumber.get(num))
        .filter((s): s is GriStandard => Boolean(s)),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title={t('gri.overallCompletion')} percentage={kpis.overall} color="hsl(210, 40%, 50%)" />
        <KpiCard title={t('gri.universalStandards')} percentage={kpis.universal} color="#3B82F6" />
        <KpiCard title={t('gri.topicStandards')} percentage={kpis.topic} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="font-bold text-lg mb-4 text-center">{t('gri.statusBreakdown')}</h3>
          <StatusDonut data={donut} centerLabel={t('gri.statuses.complete')} />
        </div>

        <div className="lg:col-span-3 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="font-bold text-lg mb-1">{t('gri.overview.gapsTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('gri.overview.gapsDesc')}</p>
          {gaps.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              {t('gri.overview.allComplete')}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {gaps.map((gap) => (
                <button
                  key={gap.disclosureNumber}
                  type="button"
                  onClick={() => onOpenDisclosure(gap.disclosureNumber)}
                  className="w-full text-start p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500 shrink-0">
                      {disclosureLabel(gap)}
                    </span>
                    <span className="font-semibold text-sm truncate">{gap.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('gri.overview.missingData')}: {gap.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="font-bold text-lg mb-1">{t('gri.overview.materialTopicsTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('gri.overview.materialTopicsCaption')}
          </p>
          <div className="space-y-2">
            {materialTopics.map((topic) => (
              <div
                key={topic.disclosureNumber}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
              >
                <span className="font-mono text-xs text-gray-500 shrink-0">
                  {disclosureLabel(topic)}
                </span>
                <p className="text-sm font-medium truncate">{topic.title}</p>
              </div>
            ))}
          </div>
        </div>

        <ReportMetaCard reportPeriod={reportPeriod} onSavePeriod={onSavePeriod} />
      </div>
    </div>
  );
};

const ReportMetaCard: React.FC<{ reportPeriod: string; onSavePeriod: (period: string) => void }> = ({
  reportPeriod,
  onSavePeriod,
}) => {
  const { t } = useLocalization(['gri']);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(reportPeriod);

  const startEdit = () => {
    setDraft(reportPeriod);
    setIsEditing(true);
  };
  const save = () => {
    onSavePeriod(draft.trim() || reportPeriod);
    setIsEditing(false);
  };

  return (
    <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{t('gri.overview.reportMetaTitle')}</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary"
            aria-label={t('common.edit')}
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            {t('gri.overview.reportPeriod')}
          </label>
          {isEditing ? (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
            />
          ) : (
            <p className="font-medium">{reportPeriod}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            {t('gri.overview.frameworkVersion')}
          </label>
          <p className="font-medium">{griReportMeta.frameworkVersion}</p>
        </div>
      </div>
      {isEditing && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Disclosures tab
// ---------------------------------------------------------------------------

const StandardRow: React.FC<{
  standard: GriStandard;
  response: GriDisclosureResponse;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (disclosureNumber: string, response: GriDisclosureResponse) => Promise<boolean>;
}> = ({ standard, response, isExpanded, onToggle, onSave }) => {
  const { t } = useLocalization(['gri']);
  const toast = useToast();
  const [draft, setDraft] = useState(response);
  const [isSaving, setIsSaving] = useState(false);
  const kind = fieldKind(standard);

  // Keep the local draft in sync when the committed response changes (e.g. after save elsewhere).
  React.useEffect(() => setDraft(response), [response]);

  const handleSave = () => {
    setIsSaving(true);
    void onSave(standard.disclosureNumber, draft).then((ok) => {
      if (ok) toast.showSuccess(t('gri.dataCollection.saveSuccess'));
    }).finally(() => setIsSaving(false));
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-start hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-mono text-sm text-gray-500 shrink-0">
            {disclosureLabel(standard)}
          </span>
          <span className="font-semibold truncate">{standard.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusPill status={response.status} />
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown size={16} className="text-gray-500" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t dark:border-slate-700 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  {t('gri.dataCollection.narrativeResponse')}
                </label>
                {kind === 'text' ? (
                  <textarea
                    rows={5}
                    value={draft.narrative}
                    onChange={(e) => setDraft((d) => ({ ...d, narrative: e.target.value }))}
                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                    placeholder={standard.description}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      value={draft.narrative}
                      onChange={(e) => setDraft((d) => ({ ...d, narrative: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                      placeholder={standard.description}
                    />
                    {kind === 'currency' && (
                      <span className="absolute rtl:left-3 ltr:right-3 top-2.5 text-gray-400 text-sm">
                        SAR
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    {t('gri.dataCollection.supportingEvidence')}
                  </label>
                  <span className="inline-flex mb-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {t('gri.deferred.comingSoon')}
                  </span>
                  {/* DEFERRED: needs GRI evidence uploads endpoint + storage wiring — see Deferred Activation Register */}
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FileUp className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center gap-1">
                        <label className="relative cursor-pointer font-medium text-primary hover:text-primary-dark">
                          <span>{t('gri.dataCollection.uploadFile')}</span>
                          <input type="file" className="sr-only" />
                        </label>
                        <span>{t('gri.dataCollection.orDragDrop')}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('gri.dataCollection.fileTypes')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {t('gri.dataCollection.status')}
                    </label>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, status: e.target.value as GriDisclosureStatus }))
                      }
                      className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                    >
                      <option value="not_started">{t('gri.dataCollection.statusNotStarted')}</option>
                      <option value="in_progress">{t('gri.dataCollection.statusInProgress')}</option>
                      <option value="complete">{t('gri.dataCollection.statusComplete')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {t('gri.report.colReference')}
                    </label>
                    <input
                      value={draft.reference}
                      onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                      placeholder={t('gri.report.referencePlaceholder')}
                      className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm disabled:opacity-60"
                >
                  {t('gri.dataCollection.saveProgress')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StandardsGroup: React.FC<{
  title: string;
  standards: GriStandard[];
  responses: Record<string, GriDisclosureResponse>;
  expanded: string | null;
  onToggle: (disclosureNumber: string) => void;
  onSave: (disclosureNumber: string, response: GriDisclosureResponse) => void;
}> = ({ title, standards, responses, expanded, onToggle, onSave }) => {
  if (standards.length === 0) return null;
  return (
    <div className="bg-card dark:bg-dark-card rounded-lg shadow-sm overflow-hidden border dark:border-slate-700">
      <div className="w-full p-4 text-start bg-gray-50 dark:bg-dark-card/50">
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <div className="p-2 space-y-px">
        {standards.map((standard) => (
          <StandardRow
            key={standard.disclosureNumber}
            standard={standard}
            response={getResponse(responses, standard.disclosureNumber)}
            isExpanded={expanded === standard.disclosureNumber}
            onToggle={() => onToggle(standard.disclosureNumber)}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
};

const DisclosuresTab: React.FC<{
  responses: Record<string, GriDisclosureResponse>;
  onSave: (disclosureNumber: string, response: GriDisclosureResponse) => Promise<boolean>;
  expanded: string | null;
  onToggle: (disclosureNumber: string) => void;
}> = ({ responses, onSave, expanded, onToggle }) => {
  const { t } = useLocalization(['gri']);
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const visible = (standard: GriStandard) =>
    !incompleteOnly || getResponse(responses, standard.disclosureNumber).status !== 'complete';

  const universalGroups = useMemo(() => {
    const list = universalStandards.filter(visible);
    return list.reduce<Record<string, GriStandard[]>>((acc, s) => {
      (acc[s.standard] ??= []).push(s);
      return acc;
    }, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incompleteOnly, responses]);

  const topicGroups = useMemo(() => {
    const list = topicStandards.filter(visible);
    return list.reduce<Record<string, GriStandard[]>>((acc, s) => {
      const key = s.category ?? 'Other';
      (acc[key] ??= []).push(s);
      return acc;
    }, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incompleteOnly, responses]);

  const progress = useMemo(() => {
    const done = allStandards.filter(
      (s) => getResponse(responses, s.disclosureNumber).status === 'complete',
    ).length;
    return Math.round((done / allStandards.length) * 100);
  }, [responses]);

  const hasResults =
    Object.keys(universalGroups).length > 0 || Object.keys(topicGroups).length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50">
        <div className="flex justify-between text-sm font-semibold mb-1">
          <span>{t('gri.questionnaire.progress')}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={incompleteOnly}
            onChange={(e) => setIncompleteOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          {t('gri.disclosures.showIncomplete')}
        </label>
      </div>

      {!hasResults ? (
        <div className="text-center p-12 text-gray-500 bg-card dark:bg-dark-card rounded-lg border dark:border-slate-700">
          {t('gri.disclosures.empty')}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {t('gri.disclosures.universal')}
            </h2>
            {Object.keys(universalGroups).map((group) => (
              <StandardsGroup
                key={group}
                title={group}
                standards={universalGroups[group]}
                responses={responses}
                expanded={expanded}
                onToggle={onToggle}
                onSave={onSave}
              />
            ))}
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {t('gri.disclosures.topic')}
            </h2>
            {Object.keys(topicGroups).map((group) => (
              <StandardsGroup
                key={group}
                title={t(`gri.dataCollection.categories.${group}`)}
                standards={topicGroups[group]}
                responses={responses}
                expanded={expanded}
                onToggle={onToggle}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Report tab
// ---------------------------------------------------------------------------

const ReportTab: React.FC<{
  responses: Record<string, GriDisclosureResponse>;
  onDeleteReport: () => void;
  isDeleting: boolean;
}> = ({ responses, onDeleteReport, isDeleting }) => {
  const { t } = useLocalization(['gri']);
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const readiness = useMemo(() => {
    const mandatory = allStandards.filter((s) => s.required === 'Yes');
    const done = mandatory.filter(
      (s) => getResponse(responses, s.disclosureNumber).status === 'complete',
    ).length;
    return { done, total: mandatory.length };
  }, [responses]);

  const handleExport = () => {
    setIsExporting(true);
    // TODO: wire to real report generation when activated.
    window.setTimeout(() => {
      setIsExporting(false);
      toast.showSuccess(t('gri.report.exportSuccess'));
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-bold text-lg">{t('gri.report.contentIndexTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('gri.report.readiness', { done: readiness.done, total: readiness.total })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm disabled:opacity-60"
          >
            <Download size={16} />
            {isExporting ? t('gri.report.exporting') : t('gri.report.export')}
          </button>
          <button
            type="button"
            onClick={onDeleteReport}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg text-sm disabled:opacity-60"
          >
            {t('gri.activation.deleteReport')}
          </button>
        </div>
        <div className="mb-4">
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {t('gri.deferred.comingSoon')}
          </span>
        </div>
        {/* DEFERRED: needs GRI export generation service (PDF/DOCX) — see Deferred Activation Register */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 dark:text-gray-400 border-b dark:border-slate-700">
                <th className="py-2 px-3 text-start font-semibold">{t('gri.report.colNumber')}</th>
                <th className="py-2 px-3 text-start font-semibold">{t('gri.report.colTitle')}</th>
                <th className="py-2 px-3 text-start font-semibold">{t('gri.report.colRequirement')}</th>
                <th className="py-2 px-3 text-start font-semibold">{t('gri.report.colStatus')}</th>
                <th className="py-2 px-3 text-start font-semibold">{t('gri.report.colReference')}</th>
              </tr>
            </thead>
            <tbody>
              {allStandards.map((s) => {
                const response = getResponse(responses, s.disclosureNumber);
                return (
                  <tr
                    key={s.disclosureNumber}
                    className="border-b dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {disclosureLabel(s)}
                    </td>
                    <td className="py-2 px-3">{s.title}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{t(requirementKey(s.required))}</td>
                    <td className="py-2 px-3">
                      <StatusPill status={response.status} />
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {response.reference || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const GRIReportingPage: React.FC = () => {
  const { t } = useLocalization(['gri', 'common']);
  const toast = useToast();
  const { data: reports = [], isLoading, isError } = useGriReports();
  const createReport = useCreateGriReport();
  const updateReport = useUpdateGriReport();
  const deleteReport = useDeleteGriReport();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedDisclosure, setExpandedDisclosure] = useState<string | null>(null);
  const activeReport = reports[0];
  const responses = useMemo<Record<string, GriDisclosureResponse>>(() => {
    const mapped: Record<string, GriDisclosureResponse> = {};
    for (const response of activeReport?.responses ?? []) {
      mapped[response.disclosureNumber] = {
        narrative: response.narrative,
        status: response.status,
        reference: response.reference,
      };
    }
    return mapped;
  }, [activeReport]);
  const reportPeriod = activeReport?.reportPeriod || griReportMeta.reportPeriod;

  const tabs = [
    { id: 'overview', label: t('gri.tabs.overview') },
    { id: 'disclosures', label: t('gri.tabs.disclosures') },
    { id: 'report', label: t('gri.tabs.report') },
  ];

  const ensureReport = async () => {
    if (activeReport?.id) return activeReport.id;
    const created = await createReport.mutateAsync({
      reportPeriod: griReportMeta.reportPeriod,
      frameworkVersion: griReportMeta.frameworkVersion,
      materialTopics: griMaterialTopics,
      responses: [],
    });
    toast.showSuccess(t('gri.activation.createSuccess'));
    return created.id;
  };

  const handleSaveDisclosure = async (disclosureNumber: string, response: GriDisclosureResponse) => {
    try {
      const reportId = await ensureReport();
      await updateReport.mutateAsync({
        id: reportId,
        input: {
          responses: responseEntries({ ...responses, [disclosureNumber]: response }),
        },
      });
      return true;
    } catch {
      toast.showError(t('errors.generic'));
      return false;
    }
  };

  const handleSavePeriod = async (period: string) => {
    try {
      const reportId = await ensureReport();
      await updateReport.mutateAsync({
        id: reportId,
        input: { reportPeriod: period },
      });
    } catch {
      toast.showError(t('errors.generic'));
    }
  };

  const handleOpenDisclosure = (disclosureNumber: string) => {
    setExpandedDisclosure(disclosureNumber);
    setActiveTab('disclosures');
  };

  const toggleDisclosure = (disclosureNumber: string) =>
    setExpandedDisclosure((current) => (current === disclosureNumber ? null : disclosureNumber));

  const handleDeleteReport = () => {
    if (!activeReport?.id) return;
    if (!window.confirm(t('gri.activation.deleteConfirm'))) return;
    deleteReport.mutate(activeReport.id, {
      onSuccess: () => toast.showSuccess(t('gri.activation.deleteSuccess')),
      onError: () => toast.showError(t('errors.generic')),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
            <GRIReportingIcon className="w-8 h-8 text-primary dark:text-secondary" />
            {t('gri.title')}
          </h1>
        </header>
        <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('gri.activation.loading')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
            <GRIReportingIcon className="w-8 h-8 text-primary dark:text-secondary" />
            {t('gri.title')}
          </h1>
        </header>
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
          {t('gri.activation.error')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
          <GRIReportingIcon className="w-8 h-8 text-primary dark:text-secondary" />
          {t('gri.title')}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{t('gri.subtitle')}</p>
      </header>

      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            responses={responses}
            reportPeriod={reportPeriod}
            onSavePeriod={handleSavePeriod}
            onOpenDisclosure={handleOpenDisclosure}
          />
        )}
        {activeTab === 'disclosures' && (
          <DisclosuresTab
            responses={responses}
            onSave={handleSaveDisclosure}
            expanded={expandedDisclosure}
            onToggle={toggleDisclosure}
          />
        )}
        {activeTab === 'report' && (
          <ReportTab
            responses={responses}
            onDeleteReport={handleDeleteReport}
            isDeleting={deleteReport.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default GRIReportingPage;
