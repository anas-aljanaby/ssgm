import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookOpen,
  CalendarClock,
  Check,
  CirclePlus,
  Coins,
  Eye,
  FileText,
  Pencil,
  Save,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';
import { useLocalization } from '../../hooks/useLocalization';
import { useTheme } from '../../hooks/useTheme';
import { useDestructiveConfirmation } from '../../hooks/useDestructiveConfirmation';
import { ShariaComplianceIcon } from '../icons/ModuleIcons';
import GaugeChart from '../common/GaugeChart';
import ModalPortal from '../common/ModalPortal';
import ConfirmationModal from '../common/ConfirmationModal';
import {
  MOCK_SHARIA_ACTIVITIES,
  MOCK_COMPLIANCE_TREND_DATA,
  MOCK_SHARIA_EXCEPTIONS,
  MOCK_SHARIA_FATWAS,
  MOCK_SHARIA_REVIEWS,
  MOCK_ZAKAT_ALLOCATION_REVIEWS,
  MOCK_ZAKAT_POLICY_RULES,
  type ExceptionStatus,
  type FatwaStatus,
  type LocalizedValue,
  type ReviewDecision,
  type ReviewStatus,
  type ReviewType,
  type ShariaActivityEvent,
  type ShariaException,
  type ShariaFatwa,
  type ShariaPriority,
  type ShariaReview,
  type ZakatAllocationReview,
  type ZakatEligibilityStatus,
} from '../../data/shariaData';
import { MOCK_SHARIA_BOARD_MEMBERS } from '../../data/shariaBoardData';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';
import type { ShariaBoardMember } from '../../types';

interface ShariaCompliancePageProps {
  setActiveModule?: (module: string) => void;
}

type ActiveTab = 'overview' | 'fatwas' | 'reviews' | 'zakat' | 'exceptions';
type NewFatwaInput = Omit<ShariaFatwa, 'id' | 'referenceNumber' | 'statusHistory'>;
type NewReviewInput = Omit<ShariaReview, 'id' | 'activityHistory'>;
type NewZakatInput = Omit<ZakatAllocationReview, 'id'>;

const TABS: ActiveTab[] = ['overview', 'fatwas', 'reviews', 'zakat', 'exceptions'];
const FATWA_STATUSES: FatwaStatus[] = ['draft', 'submitted', 'underReview', 'issued', 'archived'];
const REVIEW_STATUSES: ReviewStatus[] = ['submitted', 'underReview', 'needsClarification', 'approved', 'approvedWithConditions', 'rejected'];
const REVIEW_TYPES: ReviewType[] = ['contract', 'policy', 'investmentProposal', 'grantAgreement', 'procurementContract', 'financialProduct'];
const REVIEW_DECISIONS: ReviewDecision[] = ['approved', 'approvedWithConditions', 'rejected', 'needsClarification'];
const ZAKAT_ELIGIBILITY_STATUSES: ZakatEligibilityStatus[] = ['eligible', 'ineligible', 'needsReview', 'certified'];
const EXCEPTION_STATUSES: ExceptionStatus[] = ['open', 'inReview', 'resolved', 'closed'];
const PRIORITIES: ShariaPriority[] = ['low', 'medium', 'high', 'critical'];
const MODULE_ROUTE_MAP: Record<string, string> = {
  financials: 'financials',
  projects: 'projects',
  donors: 'donors',
};

const todayInput = () => new Date().toISOString().slice(0, 10);
const localized = (en: string, ar: string): LocalizedValue => ({ en: en.trim(), ar: ar.trim() || en.trim() });
const emptyLocalized: LocalizedValue = { en: '', ar: '' };

const simulateStaticDelete = () => new Promise<void>((resolve) => window.setTimeout(resolve, 180));

const getPriorityWeight = (priority: ShariaPriority) => {
  const weights: Record<ShariaPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return weights[priority];
};

const rowStateClass = (pending: boolean, exiting: boolean) =>
  `transition-all duration-200 ${
    exiting
      ? 'opacity-0 -translate-x-2 scale-[0.98]'
      : pending
        ? 'bg-red-50/70 opacity-80 dark:bg-red-900/15'
        : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
  }`;

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-gray-200 bg-card shadow-soft dark:border-slate-700/60 dark:bg-dark-card ${className}`}>
    {children}
  </section>
);

const SectionHeader: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
    {action}
  </div>
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ icon, children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  >
    {icon}
    {children}
  </button>
);

const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ icon, children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800 ${className}`}
  >
    {icon}
    {children}
  </button>
);

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }> = ({
  label,
  tone = 'default',
  className = '',
  children,
  ...props
}) => (
  <button
    {...props}
    aria-label={label}
    title={label}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
      tone === 'danger'
        ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
    } ${className}`}
  >
    {children}
  </button>
);

const StatusBadge: React.FC<{ label: string; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' }> = ({ label, tone = 'slate' }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800',
    red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>
      {label}
    </span>
  );
};

const getFatwaTone = (status: FatwaStatus) => {
  const tones: Record<FatwaStatus, React.ComponentProps<typeof StatusBadge>['tone']> = {
    draft: 'slate',
    submitted: 'blue',
    underReview: 'amber',
    issued: 'green',
    archived: 'purple',
  };
  return tones[status];
};

const getReviewTone = (status: ReviewStatus) => {
  const tones: Record<ReviewStatus, React.ComponentProps<typeof StatusBadge>['tone']> = {
    submitted: 'blue',
    underReview: 'amber',
    needsClarification: 'red',
    approved: 'green',
    approvedWithConditions: 'purple',
    rejected: 'red',
  };
  return tones[status];
};

const getEligibilityTone = (status: ZakatEligibilityStatus) => {
  const tones: Record<ZakatEligibilityStatus, React.ComponentProps<typeof StatusBadge>['tone']> = {
    eligible: 'green',
    ineligible: 'red',
    needsReview: 'amber',
    certified: 'blue',
  };
  return tones[status];
};

const getExceptionTone = (status: ExceptionStatus) => {
  const tones: Record<ExceptionStatus, React.ComponentProps<typeof StatusBadge>['tone']> = {
    open: 'red',
    inReview: 'amber',
    resolved: 'green',
    closed: 'slate',
  };
  return tones[status];
};

const getPriorityTone = (priority: ShariaPriority) => {
  const tones: Record<ShariaPriority, React.ComponentProps<typeof StatusBadge>['tone']> = {
    low: 'slate',
    medium: 'blue',
    high: 'amber',
    critical: 'red',
  };
  return tones[priority];
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-slate-700">
    <p className="font-bold text-foreground dark:text-dark-foreground">{title}</p>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const DeletingBadge: React.FC<{ label: string }> = ({ label }) => (
  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300/40 border-t-red-600 dark:border-red-700/40 dark:border-t-red-300" aria-hidden="true" />
    {label}
  </span>
);

const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
}> = ({ label, value, onChange, type = 'text', required = false, dir }) => (
  <label className="block">
    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
      {label}
      {required ? ' *' : ''}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir={dir}
      required={required}
      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground"
    />
  </label>
);

const TextAreaInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
}> = ({ label, value, onChange, required = false, dir }) => (
  <label className="block">
    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
      {label}
      {required ? ' *' : ''}
    </span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir={dir}
      required={required}
      rows={3}
      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground"
    />
  </label>
);

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, value, onChange, children, required = false }) => (
  <label className="block">
    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
      {label}
      {required ? ' *' : ''}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground"
    >
      {children}
    </select>
  </label>
);

const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  labelledBy: string;
}> = ({ isOpen, onClose, title, children, labelledBy }) => {
  const { t, dir } = useLocalization(['common', 'sharia']);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} dir={dir} labelledBy={labelledBy}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-xl dark:bg-dark-card" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4 dark:border-slate-700">
          <h2 id={labelledBy} className="text-xl font-bold text-foreground dark:text-dark-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-slate-800" aria-label={t('common.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-73px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </ModalPortal>
  );
};

interface ReviewerProps {
  reviewers: ShariaBoardMember[];
  reviewerId: string;
  fallback: string;
  pickLocalized: (value: any) => string;
}

const ReviewerName: React.FC<ReviewerProps> = ({ reviewers, reviewerId, fallback, pickLocalized }) => {
  const reviewer = reviewers.find((item) => item.id === reviewerId);
  return <>{reviewer ? pickLocalized(reviewer.name) : fallback}</>;
};

const FatwaRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewFatwaInput) => void;
  reviewers: ShariaBoardMember[];
}> = ({ isOpen, onClose, onSubmit, reviewers }) => {
  const { t, pickLocalized } = useLocalization(['common', 'sharia']);
  const [topicEn, setTopicEn] = useState('');
  const [topicAr, setTopicAr] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [questionAr, setQuestionAr] = useState('');
  const [requester, setRequester] = useState('');
  const [relatedModule, setRelatedModule] = useState('projects');
  const [relatedRecord, setRelatedRecord] = useState('');
  const [priority, setPriority] = useState<ShariaPriority>('medium');
  const [assignedReviewerId, setAssignedReviewerId] = useState(reviewers[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(todayInput());
  const [attachmentsCount, setAttachmentsCount] = useState('0');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTopicEn('');
    setTopicAr('');
    setQuestionEn('');
    setQuestionAr('');
    setRequester('');
    setRelatedModule('projects');
    setRelatedRecord('');
    setPriority('medium');
    setAssignedReviewerId(reviewers[0]?.id ?? '');
    setDueDate(todayInput());
    setAttachmentsCount('0');
    setError('');
  }, [isOpen, reviewers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ((!topicEn.trim() && !topicAr.trim()) || (!questionEn.trim() && !questionAr.trim()) || !requester.trim() || !assignedReviewerId || !dueDate) {
      setError(t('sharia.validation.required'));
      return;
    }
    setIsSubmitting(true);
    await Promise.resolve(onSubmit({
      topic: localized(topicEn, topicAr),
      question: localized(questionEn, questionAr),
      requester: requester.trim(),
      relatedModule,
      relatedRecord: relatedRecord.trim(),
      status: 'submitted',
      priority,
      assignedReviewerId,
      requestedDate: todayInput(),
      dueDate,
      rulingSummary: emptyLocalized,
      reviewNotes: emptyLocalized,
      attachmentsCount: Math.max(0, Number.parseInt(attachmentsCount, 10) || 0),
    }));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={t('sharia.fatwas.new')} labelledBy="new-fatwa-title">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label={t('sharia.forms.titleEn')} value={topicEn} onChange={setTopicEn} required />
            <TextInput label={t('sharia.forms.titleAr')} value={topicAr} onChange={setTopicAr} dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextAreaInput label={t('sharia.fatwas.form.questionEn')} value={questionEn} onChange={setQuestionEn} required />
            <TextAreaInput label={t('sharia.fatwas.form.questionAr')} value={questionAr} onChange={setQuestionAr} dir="rtl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextInput label={t('sharia.fatwas.form.requester')} value={requester} onChange={setRequester} required />
            <SelectInput label={t('sharia.forms.priority')} value={priority} onChange={(value) => setPriority(value as ShariaPriority)}>
              {PRIORITIES.map((item) => <option key={item} value={item}>{t(`sharia.priority.${item}`)}</option>)}
            </SelectInput>
            <SelectInput label={t('sharia.forms.assignedReviewer')} value={assignedReviewerId} onChange={setAssignedReviewerId} required>
              {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{pickLocalized(reviewer.name)}</option>)}
            </SelectInput>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <SelectInput label={t('sharia.forms.relatedModule')} value={relatedModule} onChange={setRelatedModule}>
              {['projects', 'financials', 'donors'].map((module) => <option key={module} value={module}>{t(`sharia.sourceModules.${module}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.forms.relatedRecord')} value={relatedRecord} onChange={setRelatedRecord} />
            <TextInput label={t('sharia.forms.dueDate')} value={dueDate} onChange={setDueDate} type="date" required />
            <TextInput label={t('sharia.forms.attachments')} value={attachmentsCount} onChange={setAttachmentsCount} type="number" />
          </div>
          {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <SecondaryButton type="button" onClick={onClose}>{t('common.cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} icon={isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}>
            {isSubmitting ? t('common.saving') : t('sharia.fatwas.save')}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
};

const FatwaDetailModal: React.FC<{
  fatwa: ShariaFatwa | null;
  onClose: () => void;
  onUpdate: (fatwa: ShariaFatwa) => void;
  reviewers: ShariaBoardMember[];
}> = ({ fatwa, onClose, onUpdate, reviewers }) => {
  const { t, language, pickLocalized } = useLocalization(['common', 'sharia']);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<FatwaStatus>('submitted');
  const [issuedDate, setIssuedDate] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryAr, setSummaryAr] = useState('');

  useEffect(() => {
    if (!fatwa) return;
    setIsEditing(false);
    setStatus(fatwa.status);
    setIssuedDate(fatwa.issuedDate ?? '');
    setNotesEn(fatwa.reviewNotes.en);
    setNotesAr(fatwa.reviewNotes.ar);
    setSummaryEn(fatwa.rulingSummary.en);
    setSummaryAr(fatwa.rulingSummary.ar);
  }, [fatwa]);

  if (!fatwa) return null;

  const handleSave = () => {
    onUpdate({
      ...fatwa,
      status,
      issuedDate: issuedDate || undefined,
      reviewNotes: localized(notesEn, notesAr),
      rulingSummary: localized(summaryEn, summaryAr),
    });
    setIsEditing(false);
  };

  return (
    <ModalShell isOpen={!!fatwa} onClose={onClose} title={`${fatwa.referenceNumber} · ${pickLocalized(fatwa.topic)}`} labelledBy="fatwa-detail-title">
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-3">
          <StatusBadge label={t(`sharia.fatwas.statuses.${fatwa.status}`)} tone={getFatwaTone(fatwa.status)} />
          <StatusBadge label={t(`sharia.priority.${fatwa.priority}`)} tone={getPriorityTone(fatwa.priority)} />
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.forms.dueDate')}: {formatDate(fatwa.dueDate, language)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.forms.attachments')}: {formatNumber(fatwa.attachmentsCount, language)}</div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.fatwas.detail.question')}</h3>
          <p className="mt-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-slate-900/50">{pickLocalized(fatwa.question)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.fatwas.detail.requester')}</h3>
            <p className="mt-1 text-sm font-semibold">{fatwa.requester}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.forms.assignedReviewer')}</h3>
            <p className="mt-1 text-sm font-semibold"><ReviewerName reviewers={reviewers} reviewerId={fatwa.assignedReviewerId} fallback={t('common.unassigned')} pickLocalized={pickLocalized} /></p>
          </div>
        </div>
        {isEditing ? (
          <div className="space-y-4 rounded-xl border p-4 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label={t('sharia.forms.status')} value={status} onChange={(value) => setStatus(value as FatwaStatus)}>
                {FATWA_STATUSES.map((item) => <option key={item} value={item}>{t(`sharia.fatwas.statuses.${item}`)}</option>)}
              </SelectInput>
              <TextInput label={t('sharia.fatwas.detail.issuedDate')} value={issuedDate} onChange={setIssuedDate} type="date" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextAreaInput label={t('sharia.fatwas.detail.reviewNotesEn')} value={notesEn} onChange={setNotesEn} />
              <TextAreaInput label={t('sharia.fatwas.detail.reviewNotesAr')} value={notesAr} onChange={setNotesAr} dir="rtl" />
              <TextAreaInput label={t('sharia.fatwas.detail.rulingSummaryEn')} value={summaryEn} onChange={setSummaryEn} />
              <TextAreaInput label={t('sharia.fatwas.detail.rulingSummaryAr')} value={summaryAr} onChange={setSummaryAr} dir="rtl" />
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setIsEditing(false)}>{t('common.cancel')}</SecondaryButton>
              <PrimaryButton onClick={handleSave} icon={<Check className="h-4 w-4" />}>{t('common.save')}</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.fatwas.detail.reviewNotes')}</h3>
              <p className="mt-2 text-sm">{pickLocalized(fatwa.reviewNotes) || t('sharia.common.notSet')}</p>
            </div>
            <div className="rounded-xl border p-4 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.fatwas.detail.rulingSummary')}</h3>
              <p className="mt-2 text-sm">{pickLocalized(fatwa.rulingSummary) || t('sharia.common.notSet')}</p>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.common.statusHistory')}</h3>
          <div className="mt-3 space-y-2">
            {fatwa.statusHistory.map((item) => (
              <div key={`${item.status}-${item.date}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-slate-900/50">
                <span>{t(`sharia.fatwas.statuses.${item.status}`, item.status)} · {item.actor}</span>
                <span className="text-gray-500">{formatDate(item.date, language)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          {!isEditing && <PrimaryButton onClick={() => setIsEditing(true)} icon={<Pencil className="h-4 w-4" />}>{t('common.edit')}</PrimaryButton>}
        </div>
      </div>
    </ModalShell>
  );
};

const ReviewSubmissionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewReviewInput) => void;
  reviewers: ShariaBoardMember[];
}> = ({ isOpen, onClose, onSubmit, reviewers }) => {
  const { t, pickLocalized } = useLocalization(['common', 'sharia']);
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [type, setType] = useState<ReviewType>('contract');
  const [sourceModule, setSourceModule] = useState('financials');
  const [sourceRecord, setSourceRecord] = useState('');
  const [counterpartyOrProject, setCounterpartyOrProject] = useState('');
  const [priority, setPriority] = useState<ShariaPriority>('medium');
  const [assignedReviewerId, setAssignedReviewerId] = useState(reviewers[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(todayInput());
  const [attachmentsCount, setAttachmentsCount] = useState('0');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitleEn('');
    setTitleAr('');
    setDescriptionEn('');
    setDescriptionAr('');
    setType('contract');
    setSourceModule('financials');
    setSourceRecord('');
    setCounterpartyOrProject('');
    setPriority('medium');
    setAssignedReviewerId(reviewers[0]?.id ?? '');
    setDueDate(todayInput());
    setAttachmentsCount('0');
    setError('');
  }, [isOpen, reviewers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ((!titleEn.trim() && !titleAr.trim()) || (!descriptionEn.trim() && !descriptionAr.trim()) || !counterpartyOrProject.trim() || !assignedReviewerId || !dueDate) {
      setError(t('sharia.validation.required'));
      return;
    }
    setIsSubmitting(true);
    await Promise.resolve(onSubmit({
      title: localized(titleEn, titleAr),
      type,
      description: localized(descriptionEn, descriptionAr),
      sourceModule,
      sourceRecord: sourceRecord.trim(),
      counterpartyOrProject: counterpartyOrProject.trim(),
      status: 'submitted',
      riskFlag: priority,
      priority,
      assignedReviewerId,
      dueDate,
      submittedDate: todayInput(),
      conditions: emptyLocalized,
      reviewNotes: emptyLocalized,
      attachmentsCount: Math.max(0, Number.parseInt(attachmentsCount, 10) || 0),
    }));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={t('sharia.reviews.submit')} labelledBy="submit-review-title">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label={t('sharia.forms.titleEn')} value={titleEn} onChange={setTitleEn} required />
            <TextInput label={t('sharia.forms.titleAr')} value={titleAr} onChange={setTitleAr} dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextAreaInput label={t('sharia.forms.descriptionEn')} value={descriptionEn} onChange={setDescriptionEn} required />
            <TextAreaInput label={t('sharia.forms.descriptionAr')} value={descriptionAr} onChange={setDescriptionAr} dir="rtl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SelectInput label={t('sharia.reviews.table.type')} value={type} onChange={(value) => setType(value as ReviewType)}>
              {REVIEW_TYPES.map((item) => <option key={item} value={item}>{t(`sharia.reviews.types.${item}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.reviews.form.counterparty')} value={counterpartyOrProject} onChange={setCounterpartyOrProject} required />
            <SelectInput label={t('sharia.forms.assignedReviewer')} value={assignedReviewerId} onChange={setAssignedReviewerId} required>
              {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{pickLocalized(reviewer.name)}</option>)}
            </SelectInput>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <SelectInput label={t('sharia.forms.relatedModule')} value={sourceModule} onChange={setSourceModule}>
              {['financials', 'projects', 'donors'].map((module) => <option key={module} value={module}>{t(`sharia.sourceModules.${module}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.forms.relatedRecord')} value={sourceRecord} onChange={setSourceRecord} />
            <TextInput label={t('sharia.forms.dueDate')} value={dueDate} onChange={setDueDate} type="date" required />
            <TextInput label={t('sharia.forms.attachments')} value={attachmentsCount} onChange={setAttachmentsCount} type="number" />
          </div>
          <SelectInput label={t('sharia.forms.priority')} value={priority} onChange={(value) => setPriority(value as ShariaPriority)}>
            {PRIORITIES.map((item) => <option key={item} value={item}>{t(`sharia.priority.${item}`)}</option>)}
          </SelectInput>
          {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <SecondaryButton type="button" onClick={onClose}>{t('common.cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} icon={isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}>
            {isSubmitting ? t('common.saving') : t('sharia.reviews.save')}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
};

const ReviewDetailModal: React.FC<{
  review: ShariaReview | null;
  onClose: () => void;
  onUpdate: (review: ShariaReview) => void;
  reviewers: ShariaBoardMember[];
}> = ({ review, onClose, onUpdate, reviewers }) => {
  const { t, language, pickLocalized } = useLocalization(['common', 'sharia']);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<ReviewStatus>('submitted');
  const [decision, setDecision] = useState<ReviewDecision>('approved');
  const [conditionsEn, setConditionsEn] = useState('');
  const [conditionsAr, setConditionsAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesAr, setNotesAr] = useState('');

  useEffect(() => {
    if (!review) return;
    setIsEditing(false);
    setStatus(review.status);
    setDecision(review.decision ?? 'approved');
    setConditionsEn(review.conditions.en);
    setConditionsAr(review.conditions.ar);
    setNotesEn(review.reviewNotes.en);
    setNotesAr(review.reviewNotes.ar);
  }, [review]);

  if (!review) return null;

  const handleSave = () => {
    onUpdate({
      ...review,
      status,
      decision,
      conditions: localized(conditionsEn, conditionsAr),
      reviewNotes: localized(notesEn, notesAr),
    });
    setIsEditing(false);
  };

  return (
    <ModalShell isOpen={!!review} onClose={onClose} title={pickLocalized(review.title)} labelledBy="review-detail-title">
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-3">
          <StatusBadge label={t(`sharia.reviews.statuses.${review.status}`)} tone={getReviewTone(review.status)} />
          <StatusBadge label={t(`sharia.priority.${review.riskFlag}`)} tone={getPriorityTone(review.riskFlag)} />
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.forms.dueDate')}: {formatDate(review.dueDate, language)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.forms.attachments')}: {formatNumber(review.attachmentsCount, language)}</div>
        </div>
        <p className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-slate-900/50">{pickLocalized(review.description)}</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.reviews.table.type')}</h3>
            <p className="mt-1 text-sm font-semibold">{t(`sharia.reviews.types.${review.type}`)}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.reviews.form.counterparty')}</h3>
            <p className="mt-1 text-sm font-semibold">{review.counterpartyOrProject}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.forms.assignedReviewer')}</h3>
            <p className="mt-1 text-sm font-semibold"><ReviewerName reviewers={reviewers} reviewerId={review.assignedReviewerId} fallback={t('common.unassigned')} pickLocalized={pickLocalized} /></p>
          </div>
        </div>
        {isEditing ? (
          <div className="space-y-4 rounded-xl border p-4 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label={t('sharia.forms.status')} value={status} onChange={(value) => setStatus(value as ReviewStatus)}>
                {REVIEW_STATUSES.map((item) => <option key={item} value={item}>{t(`sharia.reviews.statuses.${item}`)}</option>)}
              </SelectInput>
              <SelectInput label={t('sharia.reviews.detail.decision')} value={decision} onChange={(value) => setDecision(value as ReviewDecision)}>
                {REVIEW_DECISIONS.map((item) => <option key={item} value={item}>{t(`sharia.reviews.decisions.${item}`)}</option>)}
              </SelectInput>
              <TextAreaInput label={t('sharia.reviews.detail.conditionsEn')} value={conditionsEn} onChange={setConditionsEn} />
              <TextAreaInput label={t('sharia.reviews.detail.conditionsAr')} value={conditionsAr} onChange={setConditionsAr} dir="rtl" />
              <TextAreaInput label={t('sharia.reviews.detail.notesEn')} value={notesEn} onChange={setNotesEn} />
              <TextAreaInput label={t('sharia.reviews.detail.notesAr')} value={notesAr} onChange={setNotesAr} dir="rtl" />
            </div>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setIsEditing(false)}>{t('common.cancel')}</SecondaryButton>
              <PrimaryButton onClick={handleSave} icon={<Check className="h-4 w-4" />}>{t('common.save')}</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.reviews.detail.conditions')}</h3>
              <p className="mt-2 text-sm">{pickLocalized(review.conditions) || t('sharia.common.notSet')}</p>
            </div>
            <div className="rounded-xl border p-4 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.reviews.detail.notes')}</h3>
              <p className="mt-2 text-sm">{pickLocalized(review.reviewNotes) || t('sharia.common.notSet')}</p>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('sharia.common.statusHistory')}</h3>
          <div className="mt-3 space-y-2">
            {review.activityHistory.map((item) => (
              <div key={`${item.status}-${item.date}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-slate-900/50">
                <span>{t(`sharia.reviews.statuses.${item.status}`, item.status)} · {item.actor}</span>
                <span className="text-gray-500">{formatDate(item.date, language)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          {!isEditing && <PrimaryButton onClick={() => setIsEditing(true)} icon={<Pencil className="h-4 w-4" />}>{t('common.edit')}</PrimaryButton>}
        </div>
      </div>
    </ModalShell>
  );
};

const ZakatReviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewZakatInput, editingId?: string) => void;
  reviewers: ShariaBoardMember[];
  review?: ZakatAllocationReview | null;
}> = ({ isOpen, onClose, onSubmit, reviewers, review }) => {
  const { t, pickLocalized } = useLocalization(['common', 'sharia']);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState('poorNeedy');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInput());
  const [eligibilityStatus, setEligibilityStatus] = useState<ZakatEligibilityStatus>('needsReview');
  const [financialTransaction, setFinancialTransaction] = useState('');
  const [reviewerId, setReviewerId] = useState(reviewers[0]?.id ?? '');
  const [notesEn, setNotesEn] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNameEn(review?.beneficiaryOrProgram.en ?? '');
    setNameAr(review?.beneficiaryOrProgram.ar ?? '');
    setCategory(review?.category ?? 'poorNeedy');
    setAmount(review ? String(review.amount) : '');
    setDate(review?.date ?? todayInput());
    setEligibilityStatus(review?.eligibilityStatus ?? 'needsReview');
    setFinancialTransaction(review?.financialTransaction ?? '');
    setReviewerId(review?.reviewerId ?? reviewers[0]?.id ?? '');
    setNotesEn(review?.notes.en ?? '');
    setNotesAr(review?.notes.ar ?? '');
    setError('');
  }, [isOpen, review, reviewers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number.parseFloat(amount);
    if ((!nameEn.trim() && !nameAr.trim()) || !category || !date || !reviewerId || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError(t('sharia.validation.required'));
      return;
    }
    setIsSubmitting(true);
    await Promise.resolve(onSubmit({
      beneficiaryOrProgram: localized(nameEn, nameAr),
      category,
      amount: numericAmount,
      date,
      eligibilityStatus,
      financialTransaction: financialTransaction.trim(),
      reviewerId,
      notes: localized(notesEn, notesAr),
    }, review?.id));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={review ? t('sharia.zakat.editReview') : t('sharia.zakat.logReview')} labelledBy="zakat-review-title">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label={t('sharia.zakat.form.programEn')} value={nameEn} onChange={setNameEn} required />
            <TextInput label={t('sharia.zakat.form.programAr')} value={nameAr} onChange={setNameAr} dir="rtl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SelectInput label={t('sharia.zakat.table.category')} value={category} onChange={setCategory}>
              {['poorNeedy', 'debtRelief', 'education', 'operations'].map((item) => <option key={item} value={item}>{t(`sharia.zakat.categories.${item}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.zakat.table.amount')} value={amount} onChange={setAmount} type="number" required />
            <TextInput label={t('sharia.zakat.table.date')} value={date} onChange={setDate} type="date" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SelectInput label={t('sharia.zakat.table.eligibility')} value={eligibilityStatus} onChange={(value) => setEligibilityStatus(value as ZakatEligibilityStatus)}>
              {ZAKAT_ELIGIBILITY_STATUSES.map((item) => <option key={item} value={item}>{t(`sharia.zakat.eligibility.${item}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.zakat.table.transaction')} value={financialTransaction} onChange={setFinancialTransaction} />
            <SelectInput label={t('sharia.zakat.table.reviewer')} value={reviewerId} onChange={setReviewerId} required>
              {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{pickLocalized(reviewer.name)}</option>)}
            </SelectInput>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextAreaInput label={t('sharia.zakat.form.notesEn')} value={notesEn} onChange={setNotesEn} />
            <TextAreaInput label={t('sharia.zakat.form.notesAr')} value={notesAr} onChange={setNotesAr} dir="rtl" />
          </div>
          {error && <p className="text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <SecondaryButton type="button" onClick={onClose}>{t('common.cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} icon={isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
};

const ResolveExceptionModal: React.FC<{
  exception: ShariaException | null;
  onClose: () => void;
  onSubmit: (exception: ShariaException) => void;
}> = ({ exception, onClose, onSubmit }) => {
  const { t } = useLocalization(['common', 'sharia']);
  const [status, setStatus] = useState<ExceptionStatus>('inReview');
  const [owner, setOwner] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!exception) return;
    setStatus(exception.status);
    setOwner(exception.owner);
    setNotesEn(exception.resolutionNotes.en);
    setNotesAr(exception.resolutionNotes.ar);
    setFollowUpDate(exception.followUpDate ?? '');
  }, [exception]);

  if (!exception) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    await Promise.resolve(onSubmit({
      ...exception,
      status,
      owner: owner.trim(),
      resolutionNotes: localized(notesEn, notesAr),
      followUpDate: followUpDate || undefined,
    }));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalShell isOpen={!!exception} onClose={onClose} title={t('sharia.exceptions.resolve')} labelledBy="resolve-exception-title">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <SelectInput label={t('sharia.forms.status')} value={status} onChange={(value) => setStatus(value as ExceptionStatus)}>
              {EXCEPTION_STATUSES.map((item) => <option key={item} value={item}>{t(`sharia.exceptions.statuses.${item}`)}</option>)}
            </SelectInput>
            <TextInput label={t('sharia.exceptions.table.owner')} value={owner} onChange={setOwner} />
            <TextInput label={t('sharia.exceptions.form.followUpDate')} value={followUpDate} onChange={setFollowUpDate} type="date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextAreaInput label={t('sharia.exceptions.form.resolutionEn')} value={notesEn} onChange={setNotesEn} />
            <TextAreaInput label={t('sharia.exceptions.form.resolutionAr')} value={notesAr} onChange={setNotesAr} dir="rtl" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <SecondaryButton type="button" onClick={onClose}>{t('common.cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} icon={isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}>
            {isSubmitting ? t('common.saving') : t('sharia.exceptions.saveResolution')}
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
};

const ShariaCompliancePage: React.FC<ShariaCompliancePageProps> = ({ setActiveModule }) => {
  const { t, language, dir, pickLocalized } = useLocalization(['common', 'sharia', 'sidebar']);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reviewers = MOCK_SHARIA_BOARD_MEMBERS;

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [fatwas, setFatwas] = useState<ShariaFatwa[]>(MOCK_SHARIA_FATWAS);
  const [reviews, setReviews] = useState<ShariaReview[]>(MOCK_SHARIA_REVIEWS);
  const [zakatReviews, setZakatReviews] = useState<ZakatAllocationReview[]>(MOCK_ZAKAT_ALLOCATION_REVIEWS);
  const [exceptions, setExceptions] = useState<ShariaException[]>(MOCK_SHARIA_EXCEPTIONS);
  const [activities, setActivities] = useState<ShariaActivityEvent[]>(MOCK_SHARIA_ACTIVITIES);
  const [isFatwaModalOpen, setIsFatwaModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isZakatModalOpen, setIsZakatModalOpen] = useState(false);
  const [selectedFatwa, setSelectedFatwa] = useState<ShariaFatwa | null>(null);
  const [selectedReview, setSelectedReview] = useState<ShariaReview | null>(null);
  const [selectedZakatReview, setSelectedZakatReview] = useState<ZakatAllocationReview | null>(null);
  const [selectedException, setSelectedException] = useState<ShariaException | null>(null);

  const fatwaDeletion = useDestructiveConfirmation<ShariaFatwa>({ getRowId: (item) => item.id });
  const reviewDeletion = useDestructiveConfirmation<ShariaReview>({ getRowId: (item) => item.id });
  const zakatDeletion = useDestructiveConfirmation<ZakatAllocationReview>({ getRowId: (item) => item.id });
  const exceptionDeletion = useDestructiveConfirmation<ShariaException>({ getRowId: (item) => item.id });

  const zakatTarget = 250000;
  const zakatDistributed = zakatReviews.reduce((sum, item) => sum + item.amount, 0);
  const zakatRemaining = Math.max(0, zakatTarget - zakatDistributed);
  const zakatProgress = Math.min(100, Math.round((zakatDistributed / zakatTarget) * 100));
  const pendingFatwas = fatwas.filter((item) => !['issued', 'archived'].includes(item.status)).length;
  const reviewsUnderReview = reviews.filter((item) => ['submitted', 'underReview', 'needsClarification'].includes(item.status)).length;
  const activeExceptions = exceptions.filter((item) => !['resolved', 'closed'].includes(item.status)).length;
  const ineligibleZakat = zakatReviews.filter((item) => item.eligibilityStatus === 'ineligible').length;
  const criticalExceptions = exceptions.filter((item) => item.status !== 'closed' && item.severity === 'critical').length;
  const complianceScore = Math.max(
    82,
    Math.round((100 - pendingFatwas * 1.3 - reviewsUnderReview * 1.1 - activeExceptions * 1.5 - criticalExceptions * 3 - ineligibleZakat * 2) * 10) / 10,
  );

  const trendData = useMemo(
    () => MOCK_COMPLIANCE_TREND_DATA.map((point) => ({ ...point, name: t(`sharia.months.${point.month}`) })),
    [t],
  );

  const priorityQueue = useMemo(() => {
    const fatwaItems = fatwas
      .filter((item) => !['issued', 'archived'].includes(item.status))
      .map((item) => ({
        id: item.id,
        title: pickLocalized(item.topic),
        type: t('sharia.overview.priorityQueue.types.fatwa'),
        dueDate: item.dueDate,
        priority: item.priority,
        onClick: () => {
          setActiveTab('fatwas');
          setSelectedFatwa(item);
        },
      }));
    const reviewItems = reviews
      .filter((item) => ['submitted', 'underReview', 'needsClarification'].includes(item.status))
      .map((item) => ({
        id: item.id,
        title: pickLocalized(item.title),
        type: t('sharia.overview.priorityQueue.types.review'),
        dueDate: item.dueDate,
        priority: item.priority,
        onClick: () => {
          setActiveTab('reviews');
          setSelectedReview(item);
        },
      }));
    const exceptionItems = exceptions
      .filter((item) => !['resolved', 'closed'].includes(item.status))
      .map((item) => ({
        id: item.id,
        title: pickLocalized(item.title),
        type: t('sharia.overview.priorityQueue.types.exception'),
        dueDate: item.followUpDate ?? item.createdDate,
        priority: item.severity as ShariaPriority,
        onClick: () => {
          setActiveTab('exceptions');
          setSelectedException(item);
        },
      }));
    return [...fatwaItems, ...reviewItems, ...exceptionItems]
      .sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority) || a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [exceptions, fatwas, pickLocalized, reviews, t]);

  const navigateToModule = (module: string) => {
    const target = MODULE_ROUTE_MAP[module] ?? module;
    setActiveModule?.(target);
  };

  const addActivity = (event: Omit<ShariaActivityEvent, 'id' | 'timestamp'>) => {
    setActivities((current) => [
      { ...event, id: `activity-${Date.now()}`, timestamp: new Date().toISOString() },
      ...current,
    ]);
  };

  const handleAddFatwa = (input: NewFatwaInput) => {
    const newFatwa: ShariaFatwa = {
      ...input,
      id: `fatwa-${Date.now()}`,
      referenceNumber: `FTW-2026-${String(fatwas.length + 15).padStart(3, '0')}`,
      statusHistory: [{ status: 'submitted', actor: input.requester, date: todayInput() }],
    };
    setFatwas((current) => [newFatwa, ...current]);
    addActivity({
      eventType: 'fatwaRequested',
      actor: input.requester,
      linkedRecord: newFatwa.referenceNumber,
      description: localized(`Requested ruling for ${input.topic.en}.`, `تم طلب حكم حول ${input.topic.ar}.`),
    });
  };

  const handleAddReview = (input: NewReviewInput) => {
    const newReview: ShariaReview = {
      ...input,
      id: `review-${Date.now()}`,
      activityHistory: [{ status: 'submitted', actor: input.sourceModule, date: todayInput() }],
    };
    setReviews((current) => [newReview, ...current]);
    addActivity({
      eventType: 'reviewSubmitted',
      actor: input.sourceModule,
      linkedRecord: input.sourceRecord || input.counterpartyOrProject,
      description: localized(`Submitted ${input.title.en} for Sharia review.`, `تم تقديم ${input.title.ar} للمراجعة الشرعية.`),
    });
  };

  const handleSaveZakatReview = (input: NewZakatInput, editingId?: string) => {
    if (editingId) {
      setZakatReviews((current) => current.map((item) => (item.id === editingId ? { ...input, id: editingId } : item)));
      return;
    }
    const newReview: ZakatAllocationReview = { ...input, id: `zakat-${Date.now()}` };
    setZakatReviews((current) => [newReview, ...current]);
    addActivity({
      eventType: 'zakatReviewLogged',
      actor: input.reviewerId,
      linkedRecord: input.financialTransaction || input.category,
      description: localized(`Logged zakat review for ${input.beneficiaryOrProgram.en}.`, `تم تسجيل مراجعة زكاة لـ ${input.beneficiaryOrProgram.ar}.`),
    });
  };

  const confirmFatwaDelete = async () => {
    const removed = await fatwaDeletion.confirm(simulateStaticDelete);
    if (removed) setFatwas((current) => current.filter((item) => item.id !== removed.id));
  };

  const confirmReviewDelete = async () => {
    const removed = await reviewDeletion.confirm(simulateStaticDelete);
    if (removed) setReviews((current) => current.filter((item) => item.id !== removed.id));
  };

  const confirmZakatDelete = async () => {
    const removed = await zakatDeletion.confirm(simulateStaticDelete);
    if (removed) setZakatReviews((current) => current.filter((item) => item.id !== removed.id));
  };

  const confirmExceptionDelete = async () => {
    const removed = await exceptionDeletion.confirm(simulateStaticDelete);
    if (removed) setExceptions((current) => current.filter((item) => item.id !== removed.id));
  };

  const renderLinkedButton = (module: string, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (module === 'reviews' || module === 'zakat') {
          setActiveTab(module);
          return;
        }
        navigateToModule(module);
      }}
      className="font-semibold text-primary hover:underline"
    >
      {label || t('sharia.common.notSet')}
    </button>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-5 p-6">
          <div className="flex items-center justify-center">
            <GaugeChart value={complianceScore} size={280} label={t('sharia.overview.scoreTitle')} />
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('sharia.overview.scoreExplanation')}</p>
        </Card>
        <div className="col-span-7 grid grid-cols-2 gap-4">
          {[
            { title: t('sharia.overview.kpi.pendingFatwas'), value: pendingFatwas, icon: <BookOpen className="h-5 w-5" />, tab: 'fatwas' as ActiveTab },
            { title: t('sharia.overview.kpi.reviewsUnderReview'), value: reviewsUnderReview, icon: <FileText className="h-5 w-5" />, tab: 'reviews' as ActiveTab },
            { title: t('sharia.overview.kpi.activeExceptions'), value: activeExceptions, icon: <TriangleAlert className="h-5 w-5" />, tab: 'exceptions' as ActiveTab },
            { title: t('sharia.overview.kpi.zakatProgress'), value: `${zakatProgress}%`, icon: <Coins className="h-5 w-5" />, tab: 'zakat' as ActiveTab },
          ].map((item) => (
            <button key={item.title} onClick={() => setActiveTab(item.tab)} className="rounded-2xl border border-gray-200 bg-card p-5 text-start shadow-soft transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:bg-dark-card">
              <span className="inline-flex rounded-xl bg-primary/10 p-2 text-primary">{item.icon}</span>
              <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{item.title}</p>
              <p className="mt-1 text-3xl font-bold text-foreground dark:text-dark-foreground">{item.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8 p-6">
          <SectionHeader title={t('sharia.overview.breakdownTitle')} description={t('sharia.overview.breakdownDescription')} />
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: t('sharia.overview.breakdown.fatwaBacklog'), value: pendingFatwas },
              { label: t('sharia.overview.breakdown.reviewBacklog'), value: reviewsUnderReview },
              { label: t('sharia.overview.breakdown.zakatExceptions'), value: ineligibleZakat },
              { label: t('sharia.overview.breakdown.unresolvedExceptions'), value: activeExceptions },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 p-4 dark:bg-slate-900/50">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{formatNumber(item.value, language)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="col-span-4 p-6">
          <SectionHeader title={t('sharia.overview.boardLink.title')} description={t('sharia.overview.boardLink.description')} />
          <p className="mt-5 text-3xl font-bold">{formatNumber(reviewers.length, language)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.overview.boardLink.members')}</p>
          <SecondaryButton className="mt-5 w-full" onClick={() => setActiveModule?.('sharia_board')} icon={<Users className="h-4 w-4" />}>
            {t('sharia.overview.boardLink.action')}
          </SecondaryButton>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-7 p-6">
          <SectionHeader title={t('sharia.overview.trend.title')} description={t('sharia.overview.trend.description')} />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="shariaComplianceTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f9f6e" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0f9f6e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#CBD5E1' : '#475569' }} />
                <YAxis domain={[90, 100]} tick={{ fill: isDark ? '#CBD5E1' : '#475569' }} />
                <Tooltip />
                <Area type="monotone" dataKey="compliance" stroke="#0f9f6e" strokeWidth={3} fill="url(#shariaComplianceTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="col-span-5 p-6">
          <SectionHeader title={t('sharia.overview.priorityQueue.title')} description={t('sharia.overview.priorityQueue.description')} />
          <div className="mt-5 space-y-3">
            {priorityQueue.map((item) => (
              <button key={item.id} onClick={item.onClick} className="w-full rounded-xl border border-gray-200 p-3 text-start transition hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{item.title}</p>
                  <StatusBadge label={t(`sharia.priority.${item.priority}`)} tone={getPriorityTone(item.priority)} />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.type} · {formatDate(item.dueDate, language)}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader title={t('sharia.overview.activityPreview.title')} description={t('sharia.overview.activityPreview.description')} />
        <ActivityTrail rows={activities.slice(0, 5)} />
      </Card>
    </div>
  );

  const renderFatwas = () => (
    <Card className="p-6">
      <SectionHeader title={t('sharia.fatwas.title')} description={t('sharia.fatwas.subtitle')} action={<PrimaryButton onClick={() => setIsFatwaModalOpen(true)} icon={<CirclePlus className="h-4 w-4" />}>{t('sharia.fatwas.new')}</PrimaryButton>} />
      <div className="mt-5 overflow-hidden rounded-xl border dark:border-slate-700">
        {fatwas.length === 0 ? (
          <EmptyState title={t('sharia.fatwas.emptyTitle')} description={t('sharia.fatwas.emptyDescription')} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-gray-400">
              <tr>
                {['reference', 'topic', 'requester', 'status', 'priority', 'reviewer', 'dueDate', 'actions'].map((key) => (
                  <th key={key} className="px-4 py-3 text-start">{t(`sharia.fatwas.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {fatwas.map((fatwa) => {
                const pending = fatwaDeletion.isRowPending(fatwa.id);
                return (
                  <tr key={fatwa.id} className={rowStateClass(pending, fatwaDeletion.isRowExiting(fatwa.id))}>
                    <td className="px-4 py-3 font-bold">{fatwa.referenceNumber}{pending && <DeletingBadge label={t('common.deleting')} />}</td>
                    <td className="px-4 py-3">{pickLocalized(fatwa.topic)}</td>
                    <td className="px-4 py-3">{fatwa.requester}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.fatwas.statuses.${fatwa.status}`)} tone={getFatwaTone(fatwa.status)} /></td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.priority.${fatwa.priority}`)} tone={getPriorityTone(fatwa.priority)} /></td>
                    <td className="px-4 py-3"><ReviewerName reviewers={reviewers} reviewerId={fatwa.assignedReviewerId} fallback={t('common.unassigned')} pickLocalized={pickLocalized} /></td>
                    <td className="px-4 py-3">{formatDate(fatwa.dueDate, language)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton label={t('common.open')} onClick={() => setSelectedFatwa(fatwa)}><Eye className="h-4 w-4" /></IconButton>
                        <IconButton label={t('common.delete')} tone="danger" disabled={fatwaDeletion.isRowBusy(fatwa.id)} onClick={() => fatwaDeletion.open(fatwa)}><Trash2 className="h-4 w-4" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );

  const renderReviews = () => (
    <Card className="p-6">
      <SectionHeader title={t('sharia.reviews.title')} description={t('sharia.reviews.subtitle')} action={<PrimaryButton onClick={() => setIsReviewModalOpen(true)} icon={<CirclePlus className="h-4 w-4" />}>{t('sharia.reviews.submit')}</PrimaryButton>} />
      <div className="mt-5 overflow-hidden rounded-xl border dark:border-slate-700">
        {reviews.length === 0 ? (
          <EmptyState title={t('sharia.reviews.emptyTitle')} description={t('sharia.reviews.emptyDescription')} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-gray-400">
              <tr>
                {['item', 'type', 'source', 'status', 'risk', 'reviewer', 'dueDate', 'actions'].map((key) => (
                  <th key={key} className="px-4 py-3 text-start">{t(`sharia.reviews.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {reviews.map((review) => {
                const pending = reviewDeletion.isRowPending(review.id);
                return (
                  <tr key={review.id} className={rowStateClass(pending, reviewDeletion.isRowExiting(review.id))}>
                    <td className="px-4 py-3 font-bold">{pickLocalized(review.title)}{pending && <DeletingBadge label={t('common.deleting')} />}</td>
                    <td className="px-4 py-3">{t(`sharia.reviews.types.${review.type}`)}</td>
                    <td className="px-4 py-3">{renderLinkedButton(review.sourceModule, review.sourceRecord || review.counterpartyOrProject)}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.reviews.statuses.${review.status}`)} tone={getReviewTone(review.status)} /></td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.priority.${review.riskFlag}`)} tone={getPriorityTone(review.riskFlag)} /></td>
                    <td className="px-4 py-3"><ReviewerName reviewers={reviewers} reviewerId={review.assignedReviewerId} fallback={t('common.unassigned')} pickLocalized={pickLocalized} /></td>
                    <td className="px-4 py-3">{formatDate(review.dueDate, language)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton label={t('common.open')} onClick={() => setSelectedReview(review)}><Eye className="h-4 w-4" /></IconButton>
                        <IconButton label={t('common.delete')} tone="danger" disabled={reviewDeletion.isRowBusy(review.id)} onClick={() => reviewDeletion.open(review)}><Trash2 className="h-4 w-4" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );

  const renderZakat = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-5 p-6">
          <SectionHeader title={t('sharia.zakat.summary.title')} description={t('sharia.zakat.summary.description')} />
          <div className="mt-6 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('sharia.zakat.summary.distributed')}</p>
                <p className="text-3xl font-bold">{formatCurrency(zakatDistributed, language)}</p>
              </div>
              <p className="text-sm font-bold text-primary">{zakatProgress}%</p>
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-slate-800">
              <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${zakatProgress}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-900/50">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('sharia.zakat.summary.target')}</p>
                <p className="mt-1 font-bold">{formatCurrency(zakatTarget, language)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-900/50">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('sharia.zakat.summary.remaining')}</p>
                <p className="mt-1 font-bold">{formatCurrency(zakatRemaining, language)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="col-span-7 p-6">
          <SectionHeader title={t('sharia.zakat.rules.title')} description={t('sharia.zakat.rules.description')} />
          <div className="mt-4 overflow-hidden rounded-xl border dark:border-slate-700">
            <table className="w-full text-sm">
              <tbody className="divide-y dark:divide-slate-700">
                {MOCK_ZAKAT_POLICY_RULES.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-4 py-3 font-bold">{t(`sharia.zakat.categories.${rule.category}`)}</td>
                    <td className="px-4 py-3">{pickLocalized(rule.rule)}</td>
                    <td className="px-4 py-3">{rule.threshold}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.zakat.policyStatuses.${rule.status}`)} tone={rule.status === 'active' ? 'green' : 'amber'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <SectionHeader title={t('sharia.zakat.tableTitle')} description={t('sharia.zakat.tableDescription')} action={<PrimaryButton onClick={() => { setSelectedZakatReview(null); setIsZakatModalOpen(true); }} icon={<CirclePlus className="h-4 w-4" />}>{t('sharia.zakat.logReview')}</PrimaryButton>} />
        <div className="mt-5 overflow-hidden rounded-xl border dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-gray-400">
              <tr>
                {['program', 'category', 'amount', 'date', 'eligibility', 'transaction', 'reviewer', 'actions'].map((key) => (
                  <th key={key} className="px-4 py-3 text-start">{t(`sharia.zakat.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {zakatReviews.map((review) => {
                const pending = zakatDeletion.isRowPending(review.id);
                return (
                  <tr key={review.id} className={rowStateClass(pending, zakatDeletion.isRowExiting(review.id))}>
                    <td className="px-4 py-3 font-bold">{pickLocalized(review.beneficiaryOrProgram)}{pending && <DeletingBadge label={t('common.deleting')} />}</td>
                    <td className="px-4 py-3">{t(`sharia.zakat.categories.${review.category}`)}</td>
                    <td className="px-4 py-3">{formatCurrency(review.amount, language)}</td>
                    <td className="px-4 py-3">{formatDate(review.date, language)}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.zakat.eligibility.${review.eligibilityStatus}`)} tone={getEligibilityTone(review.eligibilityStatus)} /></td>
                    <td className="px-4 py-3">{renderLinkedButton('financials', review.financialTransaction)}</td>
                    <td className="px-4 py-3"><ReviewerName reviewers={reviewers} reviewerId={review.reviewerId} fallback={t('common.unassigned')} pickLocalized={pickLocalized} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton label={t('common.edit')} onClick={() => { setSelectedZakatReview(review); setIsZakatModalOpen(true); }}><Pencil className="h-4 w-4" /></IconButton>
                        <IconButton label={t('common.delete')} tone="danger" disabled={zakatDeletion.isRowBusy(review.id)} onClick={() => zakatDeletion.open(review)}><Trash2 className="h-4 w-4" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderExceptions = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader title={t('sharia.exceptions.title')} description={t('sharia.exceptions.subtitle')} />
        <div className="mt-5 overflow-hidden rounded-xl border dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-gray-400">
              <tr>
                {['exception', 'severity', 'source', 'owner', 'status', 'created', 'actions'].map((key) => (
                  <th key={key} className="px-4 py-3 text-start">{t(`sharia.exceptions.table.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {exceptions.map((exception) => {
                const pending = exceptionDeletion.isRowPending(exception.id);
                return (
                  <tr key={exception.id} className={rowStateClass(pending, exceptionDeletion.isRowExiting(exception.id))}>
                    <td className="px-4 py-3 font-bold">{pickLocalized(exception.title)}{pending && <DeletingBadge label={t('common.deleting')} />}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.priority.${exception.severity}`)} tone={getPriorityTone(exception.severity as ShariaPriority)} /></td>
                    <td className="px-4 py-3">{renderLinkedButton(exception.source, exception.linkedRecord)}</td>
                    <td className="px-4 py-3">{exception.owner}</td>
                    <td className="px-4 py-3"><StatusBadge label={t(`sharia.exceptions.statuses.${exception.status}`)} tone={getExceptionTone(exception.status)} /></td>
                    <td className="px-4 py-3">{formatDate(exception.createdDate, language)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton label={t('sharia.exceptions.resolve')} onClick={() => setSelectedException(exception)}><Check className="h-4 w-4" /></IconButton>
                        <IconButton label={t('common.delete')} tone="danger" disabled={exceptionDeletion.isRowBusy(exception.id)} onClick={() => exceptionDeletion.open(exception)}><Trash2 className="h-4 w-4" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-6">
        <SectionHeader title={t('sharia.exceptions.activity.title')} description={t('sharia.exceptions.activity.description')} />
        <ActivityTrail rows={activities} />
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground dark:text-dark-foreground">
            <ShariaComplianceIcon className="h-8 w-8" />
            {t('sidebar.sharia_compliance')}
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">{t('sharia.header.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2 rounded-2xl border border-gray-200 bg-card p-2 shadow-soft dark:border-slate-700/60 dark:bg-dark-card" role="tablist" aria-label={t('common.tabs')}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
            }`}
          >
            {t(`sharia.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'fatwas' && renderFatwas()}
      {activeTab === 'reviews' && renderReviews()}
      {activeTab === 'zakat' && renderZakat()}
      {activeTab === 'exceptions' && renderExceptions()}

      <FatwaRequestModal isOpen={isFatwaModalOpen} onClose={() => setIsFatwaModalOpen(false)} onSubmit={handleAddFatwa} reviewers={reviewers} />
      <ReviewSubmissionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleAddReview} reviewers={reviewers} />
      <ZakatReviewModal isOpen={isZakatModalOpen} onClose={() => setIsZakatModalOpen(false)} onSubmit={handleSaveZakatReview} reviewers={reviewers} review={selectedZakatReview} />
      <FatwaDetailModal fatwa={selectedFatwa} onClose={() => setSelectedFatwa(null)} onUpdate={(updated) => { setFatwas((current) => current.map((item) => (item.id === updated.id ? updated : item))); setSelectedFatwa(updated); }} reviewers={reviewers} />
      <ReviewDetailModal review={selectedReview} onClose={() => setSelectedReview(null)} onUpdate={(updated) => { setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item))); setSelectedReview(updated); }} reviewers={reviewers} />
      <ResolveExceptionModal exception={selectedException} onClose={() => setSelectedException(null)} onSubmit={(updated) => setExceptions((current) => current.map((item) => (item.id === updated.id ? updated : item)))} />

      <ConfirmationModal
        isOpen={fatwaDeletion.isOpen}
        onClose={fatwaDeletion.close}
        onConfirm={confirmFatwaDelete}
        isConfirming={fatwaDeletion.isPending}
        title={t('sharia.fatwas.deleteTitle')}
        message={t('sharia.fatwas.deleteConfirm', { name: fatwaDeletion.target ? pickLocalized(fatwaDeletion.target.topic) : '' })}
        confirmLabel={t('common.delete')}
        confirmingLabel={t('common.deleting')}
      />
      <ConfirmationModal
        isOpen={reviewDeletion.isOpen}
        onClose={reviewDeletion.close}
        onConfirm={confirmReviewDelete}
        isConfirming={reviewDeletion.isPending}
        title={t('sharia.reviews.deleteTitle')}
        message={t('sharia.reviews.deleteConfirm', { name: reviewDeletion.target ? pickLocalized(reviewDeletion.target.title) : '' })}
        confirmLabel={t('common.delete')}
        confirmingLabel={t('common.deleting')}
      />
      <ConfirmationModal
        isOpen={zakatDeletion.isOpen}
        onClose={zakatDeletion.close}
        onConfirm={confirmZakatDelete}
        isConfirming={zakatDeletion.isPending}
        title={t('sharia.zakat.deleteTitle')}
        message={t('sharia.zakat.deleteConfirm', { name: zakatDeletion.target ? pickLocalized(zakatDeletion.target.beneficiaryOrProgram) : '' })}
        confirmLabel={t('common.delete')}
        confirmingLabel={t('common.deleting')}
      />
      <ConfirmationModal
        isOpen={exceptionDeletion.isOpen}
        onClose={exceptionDeletion.close}
        onConfirm={confirmExceptionDelete}
        isConfirming={exceptionDeletion.isPending}
        title={t('sharia.exceptions.deleteTitle')}
        message={t('sharia.exceptions.deleteConfirm', { name: exceptionDeletion.target ? pickLocalized(exceptionDeletion.target.title) : '' })}
        confirmLabel={t('common.delete')}
        confirmingLabel={t('common.deleting')}
      />
    </div>
  );
};

const ActivityTrail: React.FC<{ rows: ShariaActivityEvent[] }> = ({ rows }) => {
  const { t, language, pickLocalized } = useLocalization(['sharia']);

  if (rows.length === 0) {
    return <EmptyState title={t('sharia.exceptions.activity.emptyTitle')} description={t('sharia.exceptions.activity.emptyDescription')} />;
  }

  return (
    <div className="mt-5 space-y-3">
      {rows.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-900/50">
          <span className="mt-0.5 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{t(`sharia.eventTypes.${activity.eventType}`)}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.timestamp, language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{pickLocalized(activity.description)}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.actor} · {activity.linkedRecord}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShariaCompliancePage;
