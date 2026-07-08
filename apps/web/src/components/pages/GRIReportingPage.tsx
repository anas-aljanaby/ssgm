import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  FileUp,
  Settings,
  X,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GRIReportingIcon } from '../icons/ModuleIcons';
import ProgressRing from '../common/ProgressRing';
import Spinner from '../common/Spinner';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { topicStandards, universalStandards, type GriStandard } from '../../data/griData';
import { sampleGRIQuestions, type GRIQuestion } from '../../data/griQuestionnaireData';

type GriView = 'dashboard' | 'dataCollection' | 'gapAnalysis' | 'questionnaire';

const DASHBOARD_STATS = {
  overallCompletion: 25,
  universalStandards: 40,
  topicStandards: 15,
  sectorStandards: 0,
  statusBreakdown: [
    { name: 'completed', value: 5 },
    { name: 'partial', value: 8 },
    { name: 'missing', value: 32 },
  ],
  materialTopics: [
    'GRI 2-1: تفاصيل المنظمة',
    'GRI 2-7: الموظفون',
    'GRI 201-1: القيمة الاقتصادية المباشرة',
    'GRI 404-1: متوسط ساعات التدريب',
  ],
};

const GAP_ANALYSIS = {
  criticalGaps: [
    { disclosure: '2-1', title: 'تفاصيل المنظمة', missingData: ['الاسم القانوني', 'رقم التسجيل'] },
    { disclosure: '2-7', title: 'الموظفون', missingData: ['عدد الموظفين', 'التوزيع حسب الجنس'] },
    { disclosure: '201-1', title: 'القيمة الاقتصادية المباشرة', missingData: ['الإيرادات', 'المصروفات'] },
    { disclosure: '404-1', title: 'متوسط ساعات التدريب', missingData: ['متوسط ساعات التدريب'] },
  ],
  questions: [
    { disclosureId: '2-1', disclosureTitle: 'تفاصيل المنظمة', questionText: 'ما هو الاسم القانوني الكامل للمنظمة؟', category: 'organizational' },
    { disclosureId: '2-7', disclosureTitle: 'الموظفون', questionText: 'ما هو توزيع الموظفين في المنظمة؟', category: 'organizational' },
    { disclosureId: '201-1', disclosureTitle: 'القيمة الاقتصادية المباشرة', questionText: 'ما هو إجمالي الإيرادات للسنة المالية الأخيرة؟', category: 'economic' },
    { disclosureId: '404-1', disclosureTitle: 'متوسط ساعات التدريب', questionText: 'ما هو إجمالي عدد ساعات التدريب المقدمة للموظفين؟', category: 'social' },
  ],
};

const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex flex-col items-center text-center">
    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 h-10">{title}</h3>
    {children}
  </div>
);

const GriSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLocalization(['gri']);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-card dark:bg-dark-card rounded-xl shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold">{t('gri.settings.title')}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
            <X />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-center text-gray-500">{t('gri.placeholder.underConstruction')}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold">
            {t('gri.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const GriDashboard: React.FC<{ onNavigate: (view: GriView) => void }> = ({ onNavigate }) => {
  const { t } = useLocalization(['gri']);
  const chartColors = ['#22c55e', '#f59e0b', '#ef4444'];
  const chartData = DASHBOARD_STATS.statusBreakdown.map((item) => ({
    ...item,
    name: t(`gri.statuses.${item.name}`),
  }));

  return (
    <div className="space-y-8">
      <header className="text-center">
        <div className="inline-block p-4 bg-primary-light dark:bg-primary/20 rounded-full mb-4">
          <GRIReportingIcon className="w-12 h-12 text-primary dark:text-secondary" />
        </div>
        <h1 className="text-4xl font-bold">{t('gri.title')}</h1>
        <p className="mt-2 max-w-2xl mx-auto text-gray-500 dark:text-gray-400">{t('gri.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('gri.overallCompletion')}>
          <ProgressRing
            percentage={DASHBOARD_STATS.overallCompletion}
            color="hsl(210, 40%, 50%)"
            label={`${DASHBOARD_STATS.overallCompletion}%`}
            size={120}
          />
        </StatCard>
        <StatCard title={t('gri.universalStandards')}>
          <ProgressRing
            percentage={DASHBOARD_STATS.universalStandards}
            color="#3B82F6"
            label={`${DASHBOARD_STATS.universalStandards}%`}
            size={120}
          />
        </StatCard>
        <StatCard title={t('gri.topicStandards')}>
          <ProgressRing
            percentage={DASHBOARD_STATS.topicStandards}
            color="#F59E0B"
            label={`${DASHBOARD_STATS.topicStandards}%`}
            size={120}
          />
        </StatCard>
        <StatCard title={t('gri.sectorStandards')}>
          <ProgressRing
            percentage={DASHBOARD_STATS.sectorStandards}
            color="#10B981"
            label={`${DASHBOARD_STATS.sectorStandards}%`}
            size={120}
          />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="font-bold text-lg mb-4 text-center">{t('gri.statusBreakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h3 className="font-bold text-lg mb-4">{t('gri.materialTopics')}</h3>
          <div className="space-y-3">
            {DASHBOARD_STATS.materialTopics.map((topic) => (
              <div
                key={topic}
                className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg"
              >
                <span className="text-yellow-500 font-bold text-xl">⚠️</span>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50 text-center">
        <h3 className="font-bold text-xl mb-2">{t('gri.nextSteps')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-2xl mx-auto">{t('gri.nextStepsDesc')}</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('dataCollection')}
            className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors"
          >
            {t('gri.startDataCollection')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('gapAnalysis')}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
          >
            {t('gri.gapAnalysis.runAnalysis')}
          </button>
        </div>
      </div>
    </div>
  );
};

const StandardRow: React.FC<{ standard: GriStandard; isExpanded: boolean; onToggle: () => void }> = ({
  standard,
  isExpanded,
  onToggle,
}) => {
  const { t } = useLocalization(['gri']);
  const [status, setStatus] = useState(t('gri.dataCollection.statusNotStarted'));

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
            {standard.standard}-{standard.disclosureNumber}
          </span>
          <span className="font-semibold truncate">{standard.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <span>{status}</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown size={16} />
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
                <label className="block text-sm font-semibold mb-1">{t('gri.dataCollection.narrativeResponse')}</label>
                <textarea
                  rows={5}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                  placeholder={standard.description}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('gri.dataCollection.supportingEvidence')}</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
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
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('gri.dataCollection.status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                  >
                    <option>{t('gri.dataCollection.statusNotStarted')}</option>
                    <option>{t('gri.dataCollection.statusInProgress')}</option>
                    <option>{t('gri.dataCollection.statusComplete')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm">
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

const StandardsList: React.FC<{ groupedStandards: Record<string, GriStandard[]> }> = ({ groupedStandards }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {Object.keys(groupedStandards).map((group) => (
        <div
          key={group}
          className="bg-card dark:bg-dark-card rounded-lg shadow-sm overflow-hidden border dark:border-slate-700"
        >
          <div className="w-full p-4 text-start bg-gray-50 dark:bg-dark-card/50">
            <h3 className="font-bold text-lg">{group}</h3>
          </div>
          <div className="p-2 space-y-px">
            {groupedStandards[group].map((standard) => (
              <StandardRow
                key={standard.disclosureNumber}
                standard={standard}
                isExpanded={expanded === standard.disclosureNumber}
                onToggle={() =>
                  setExpanded((current) =>
                    current === standard.disclosureNumber ? null : standard.disclosureNumber,
                  )
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const GriDataCollection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLocalization(['gri']);
  const [activeTab, setActiveTab] = useState<'universal' | 'topic' | 'sector'>('universal');

  const universalGrouped = useMemo(
    () =>
      universalStandards.reduce<Record<string, GriStandard[]>>((acc, standard) => {
        if (!acc[standard.standard]) acc[standard.standard] = [];
        acc[standard.standard].push(standard);
        return acc;
      }, {}),
    [],
  );

  const topicGrouped = useMemo(
    () =>
      topicStandards.reduce<Record<string, GriStandard[]>>((acc, standard) => {
        const key = standard.category ? t(`gri.dataCollection.categories.${standard.category}`) : standard.standard;
        if (!acc[key]) acc[key] = [];
        acc[key].push(standard);
        return acc;
      }, {}),
    [t],
  );

  const tabs = [
    { id: 'universal' as const, label: t('gri.dataCollection.universal') },
    { id: 'topic' as const, label: t('gri.dataCollection.topic') },
    { id: 'sector' as const, label: t('gri.dataCollection.sector') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">{t('gri.dataCollection.title')}</h1>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('gri.dataCollection.backToDashboard')}
        </button>
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'border-primary text-primary dark:border-secondary dark:text-secondary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'universal' && <StandardsList groupedStandards={universalGrouped} />}
        {activeTab === 'topic' && <StandardsList groupedStandards={topicGrouped} />}
        {activeTab === 'sector' && (
          <div className="text-center p-8 text-gray-500 bg-card dark:bg-dark-card rounded-lg border dark:border-slate-700">
            {t('gri.dataCollection.sectorPlaceholder')}
          </div>
        )}
      </div>
    </div>
  );
};

const GriGapAnalysis: React.FC<{ onBack: () => void; onStartQuestionnaire: () => void }> = ({
  onBack,
  onStartQuestionnaire,
}) => {
  const { t } = useLocalization(['gri']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const groupedQuestions = useMemo(
    () =>
      GAP_ANALYSIS.questions.reduce<Record<string, typeof GAP_ANALYSIS.questions>>((acc, question) => {
        if (!acc[question.category]) acc[question.category] = [];
        acc[question.category].push(question);
        return acc;
      }, {}),
    [],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Spinner />
        <p className="mt-4 text-gray-500">{t('gri.gapAnalysis.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('gri.gapAnalysis.backToDashboard')}
      </button>

      <h1 className="text-3xl font-bold">{t('gri.gapAnalysis.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h2 className="text-xl font-bold mb-4">{t('gri.gapAnalysis.criticalGapsTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('gri.gapAnalysis.criticalGapsDesc')}</p>
          <div className="space-y-3">
            {GAP_ANALYSIS.criticalGaps.map((gap) => (
              <div key={gap.disclosure} className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <p className="font-bold text-yellow-800 dark:text-yellow-200">
                  {gap.disclosure}: {gap.title}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {t('gri.gapAnalysis.missingData')}: {gap.missingData.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
          <h2 className="text-xl font-bold mb-4">{t('gri.gapAnalysis.aiQuestionsTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('gri.gapAnalysis.aiQuestionsDesc')}</p>
          <div className="space-y-4 max-h-96 overflow-y-auto pe-2">
            {Object.keys(groupedQuestions).map((category) => (
              <div key={category}>
                <h3 className="font-semibold text-primary dark:text-secondary capitalize">
                  {t('gri.gapAnalysis.category')}: {t(`gri.questionnaire.category.${category}`)}
                </h3>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  {groupedQuestions[category].map((question, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-semibold">
                        {t('gri.gapAnalysis.questionFor')} {question.disclosureId}:
                      </span>{' '}
                      {question.questionText}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onStartQuestionnaire}
          className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors"
        >
          🚀 {t('gri.startDataCollection')}
        </button>
      </div>
    </div>
  );
};

const QuestionField: React.FC<{
  question: GRIQuestion;
  answer?: { value: string; skipped: boolean };
  onAnswerChange: (questionId: string, value: string) => void;
  onSkip: (questionId: string) => void;
}> = ({ question, answer, onAnswerChange, onSkip }) => {
  const { t } = useLocalization(['gri']);
  const value = answer?.value ?? '';
  const skipped = answer?.skipped ?? false;

  const input = () => {
    if (question.questionType === 'currency' || question.questionType === 'number') {
      return (
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => onAnswerChange(question.questionId, e.target.value)}
            placeholder={t('gri.questionnaire.answerHere')}
            className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
          />
          {question.questionType === 'currency' && (
            <span className="absolute rtl:right-3 ltr:left-3 top-2.5 text-gray-400">SAR</span>
          )}
        </div>
      );
    }

    return (
      <textarea
        value={value}
        onChange={(e) => onAnswerChange(question.questionId, e.target.value)}
        placeholder={t('gri.questionnaire.answerHere')}
        rows={4}
        className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
      />
    );
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        skipped ? 'bg-gray-100 dark:bg-slate-800/50 opacity-70' : 'bg-gray-50 dark:bg-slate-800/30'
      }`}
    >
      <label className="block font-semibold mb-1">
        {question.questionText}
        {question.required && <span className="text-red-500 ms-1">*</span>}
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{question.helpText}</p>
      {input()}
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={() => onSkip(question.questionId)}
          className="text-xs font-semibold text-gray-500 hover:text-red-500"
        >
          {t('gri.questionnaire.skip')}
        </button>
      </div>
    </div>
  );
};

const GriQuestionnaire: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLocalization(['gri']);
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, { value: string; skipped: boolean }>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>('organizational');

  const grouped = useMemo(
    () =>
      sampleGRIQuestions.reduce<Record<string, GRIQuestion[]>>((acc, question) => {
        if (!acc[question.category]) acc[question.category] = [];
        acc[question.category].push(question);
        return acc;
      }, {}),
    [],
  );

  const categories = ['organizational', 'economic', 'social'] as const;

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value, skipped: false } }));
  }, []);

  const handleSkip = useCallback((questionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value: '', skipped: true } }));
  }, []);

  const progress =
    (Object.keys(answers).filter((key) => {
      const answer = answers[key];
      return answer && !answer.skipped && answer.value;
    }).length /
      sampleGRIQuestions.length) *
    100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">{t('gri.questionnaire.title')}</h1>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('gri.questionnaire.backToAnalysis')}
        </button>
      </div>

      <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50">
        <div className="flex justify-between text-sm font-semibold mb-1">
          <span>{t('gri.questionnaire.progress')}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const questions = grouped[category];
          if (!questions?.length) return null;

          return (
            <div
              key={category}
              className="bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedCategory((current) => (current === category ? null : category))}
                className="w-full flex justify-between items-center p-4 text-start bg-gray-50 dark:bg-dark-card/50"
              >
                <h3 className="font-bold text-lg">{t(`gri.questionnaire.category.${category}`)}</h3>
                <motion.div animate={{ rotate: expandedCategory === category ? 180 : 0 }}>
                  <ChevronDown />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedCategory === category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      {questions.map((question) => (
                        <QuestionField
                          key={question.questionId}
                          question={question}
                          answer={answers[question.questionId]}
                          onAnswerChange={handleAnswer}
                          onSkip={handleSkip}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => toast.showSuccess(t('gri.questionnaire.saveSuccess'))}
          className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors"
        >
          {t('gri.questionnaire.saveAnswers')}
        </button>
      </div>
    </div>
  );
};

const GRIReportingPage: React.FC = () => {
  const [view, setView] = useState<GriView>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const renderView = () => {
    switch (view) {
      case 'dataCollection':
        return <GriDataCollection onBack={() => setView('dashboard')} />;
      case 'gapAnalysis':
        return (
          <GriGapAnalysis
            onBack={() => setView('dashboard')}
            onStartQuestionnaire={() => setView('questionnaire')}
          />
        );
      case 'questionnaire':
        return <GriQuestionnaire onBack={() => setView('dashboard')} />;
      default:
        return <GriDashboard onNavigate={setView} />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <GriSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {view === 'dashboard' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
            aria-label="Settings"
          >
            <Settings />
          </button>
        </div>
      )}
      {renderView()}
    </div>
  );
};

export default GRIReportingPage;
