import React, { useEffect, useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import type {
  DonationMethod,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
} from '../../../types/financials';

interface TransactionFormData {
  date: string;
  description_en: string;
  description_ar: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  category: TransactionCategory;
  status: TransactionStatus;
  reference: string;
  related_entity_type: string;
  related_entity_name: string;
  notes: string;
  receipt: File | null;
  donation_method: DonationMethod;
  designation: string;
  is_recurring: boolean;
  recurring_frequency: '' | 'monthly' | 'quarterly' | 'annually';
}

const INITIAL_FORM: TransactionFormData = {
  date: new Date().toISOString().slice(0, 10),
  description_en: '',
  description_ar: '',
  amount: 0,
  currency: 'USD',
  direction: 'inflow',
  category: 'donation',
  status: 'draft',
  reference: '',
  related_entity_type: '',
  related_entity_name: '',
  notes: '',
  receipt: null,
  donation_method: 'bank_transfer',
  designation: '',
  is_recurring: false,
  recurring_frequency: '',
};

const DONATION_INITIAL: TransactionFormData = {
  ...INITIAL_FORM,
  direction: 'inflow',
  category: 'donation',
  related_entity_type: 'donor',
};

const CATEGORIES: { value: TransactionCategory; direction: TransactionDirection }[] = [
  { value: 'donation', direction: 'inflow' },
  { value: 'grant_income', direction: 'inflow' },
  { value: 'sponsorship_income', direction: 'inflow' },
  { value: 'investment_income', direction: 'inflow' },
  { value: 'other_income', direction: 'inflow' },
  { value: 'project_expense', direction: 'outflow' },
  { value: 'operational_expense', direction: 'outflow' },
  { value: 'disbursement', direction: 'outflow' },
  { value: 'payroll', direction: 'outflow' },
  { value: 'procurement', direction: 'outflow' },
  { value: 'refund', direction: 'outflow' },
];

const DONATION_METHODS: DonationMethod[] = [
  'bank_transfer',
  'credit_card',
  'cash',
  'check',
  'online_gateway',
  'in_kind',
];

const STATUSES: TransactionStatus[] = ['draft', 'pending', 'approved', 'posted'];

const ENTITY_TYPES = ['donor', 'project', 'beneficiary', 'institutional_donor', 'vendor'] as const;

export type TransactionModalPreset = 'default' | 'donation';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  preset?: TransactionModalPreset;
}

const Field: React.FC<{
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, children, className = '' }) => (
  <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    {htmlFor ? (
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground dark:text-dark-foreground text-start"
      >
        {label}
      </label>
    ) : (
      <span className="text-sm font-medium text-foreground dark:text-dark-foreground text-start">
        {label}
      </span>
    )}
    {children}
  </div>
);

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preset = 'default',
}) => {
  const { t, dir } = useLocalization(['common', 'financials']);
  const isDonationPreset = preset === 'donation';
  const [form, setForm] = useState<TransactionFormData>({ ...INITIAL_FORM });

  useEffect(() => {
    if (isOpen) {
      setForm(isDonationPreset ? { ...DONATION_INITIAL } : { ...INITIAL_FORM });
    }
  }, [isOpen, isDonationPreset]);

  const set = <K extends keyof TransactionFormData>(key: K, value: TransactionFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const filteredCategories = CATEGORIES.filter((c) => c.direction === form.direction);

  const handleCategoryChange = (category: TransactionCategory) => {
    set('category', category);
  };

  const handleDirectionChange = (direction: TransactionDirection) => {
    setForm((prev) => {
      const validCategories = CATEGORIES.filter((c) => c.direction === direction);
      const currentValid = validCategories.some((c) => c.value === prev.category);
      return {
        ...prev,
        direction,
        category: currentValid ? prev.category : validCategories[0].value,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    set('receipt', file);
  };

  const removeFile = () => set('receipt', null);

  const hasDescription =
    Boolean(form.description_en.trim()) || Boolean(form.description_ar.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDescription || form.amount <= 0) return;
    onSubmit(form);
    setForm(isDonationPreset ? { ...DONATION_INITIAL } : { ...INITIAL_FORM });
    onClose();
  };

  const inputClass =
    'block w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600 text-sm text-foreground dark:text-dark-foreground text-start focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400';
  const amountInputClass = `${inputClass} text-end tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
  const selectClass = `${inputClass} appearance-none`;

  const modalTitle = isDonationPreset
    ? t('financials.addDonation.title', 'Add Donation')
    : t('financials.addTransaction.title', 'Add Transaction');
  const saveLabel = isDonationPreset
    ? t('financials.addDonation.save', 'Save Donation')
    : t('financials.addTransaction.save', 'Save Transaction');
  const canSubmit = hasDescription && form.amount > 0;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy="add-transaction-title" dir={dir}>
      <div
          className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          dir={dir}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 shrink-0">
          <h2
            id="add-transaction-title"
            className="text-lg font-bold text-foreground dark:text-dark-foreground"
          >
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {!isDonationPreset ? (
              <Field label={t('financials.transactions.direction', 'Direction')}>
                <div className="flex rounded-lg border dark:border-slate-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('inflow')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                      form.direction === 'inflow'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t('financials.transactions.inflow', 'Inflow')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('outflow')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                      form.direction === 'outflow'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t('financials.transactions.outflow', 'Outflow')}
                  </button>
                </div>
              </Field>
            ) : null}

            <div
              data-testid="txn-form-grid"
              className="grid grid-cols-1 sm:grid-cols-6 gap-4"
            >
              <Field
                label={t('financials.transactions.date', 'Date')}
                htmlFor="txn-date"
                className="sm:col-span-2"
              >
                <input
                  type="date"
                  id="txn-date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field
                label={t('financials.transactions.amount', 'Amount')}
                htmlFor="txn-amount"
                className="sm:col-span-2"
              >
                <input
                  type="number"
                  id="txn-amount"
                  value={form.amount > 0 ? form.amount : ''}
                  onChange={(e) =>
                    set('amount', e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  min="0.01"
                  step="0.01"
                  required
                  placeholder={t('financials.addTransaction.amountPlaceholder', '0.00')}
                  className={amountInputClass}
                />
              </Field>
              <Field
                label={t('financials.common.currency', 'Currency')}
                htmlFor="txn-currency"
                className="sm:col-span-2"
              >
                <select
                  id="txn-currency"
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className={selectClass}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                  <option value="QAR">QAR</option>
                  <option value="TRY">TRY</option>
                </select>
              </Field>
              {!isDonationPreset ? (
                <Field
                  label={t('financials.transactions.category', 'Category')}
                  htmlFor="txn-category"
                  className="sm:col-span-2"
                >
                  <select
                    id="txn-category"
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value as TransactionCategory)}
                    className={selectClass}
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {t(`financials.category.${c.value}`, c.value)}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field
                  label={t('financials.donations.method', 'Method')}
                  htmlFor="donation-method"
                  className="sm:col-span-2"
                >
                  <select
                    id="donation-method"
                    value={form.donation_method}
                    onChange={(e) => set('donation_method', e.target.value as DonationMethod)}
                    className={selectClass}
                  >
                    {DONATION_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {t(`financials.method.${m}`, m)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field
                label={t('financials.transactions.status', 'Status')}
                htmlFor="txn-status"
                className="sm:col-span-2"
              >
                <select
                  id="txn-status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as TransactionStatus)}
                  className={selectClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`financials.status.${s}`, s)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="hidden sm:block sm:col-span-2" aria-hidden="true" />
            </div>

            {isDonationPreset ? (
              <Field
                label={t('financials.donations.designation', 'Designation')}
                htmlFor="donation-designation"
              >
                <input
                  type="text"
                  id="donation-designation"
                  value={form.designation}
                  onChange={(e) => set('designation', e.target.value)}
                  placeholder={t(
                    'financials.addDonation.designationPlaceholder',
                    'e.g. Education Fund'
                  )}
                  className={inputClass}
                />
              </Field>
            ) : null}

            <Field
              label={`${t('financials.transactions.description', 'Description')} (EN)`}
              htmlFor="txn-desc-en"
            >
              <input
                type="text"
                id="txn-desc-en"
                value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                placeholder={
                  isDonationPreset
                    ? t('financials.addDonation.descPlaceholder', 'e.g. Monthly donation from...')
                    : t('financials.addTransaction.descPlaceholder', 'e.g. Monthly donation from...')
                }
                className={inputClass}
              />
            </Field>

            <Field
              label={`${t('financials.transactions.description', 'Description')} (AR)`}
              htmlFor="txn-desc-ar"
            >
              <input
                type="text"
                id="txn-desc-ar"
                value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
                dir="rtl"
                placeholder={t('financials.addTransaction.descPlaceholderAr', 'الوصف بالعربية...')}
                className={inputClass}
              />
            </Field>

            <Field label={t('financials.transactions.reference', 'Reference')} htmlFor="txn-reference">
              <input
                type="text"
                id="txn-reference"
                value={form.reference}
                onChange={(e) => set('reference', e.target.value)}
                placeholder={t('financials.addTransaction.refPlaceholder', 'e.g. INV-2024-001')}
                className={inputClass}
              />
            </Field>

            <Field
              label={t('financials.transactions.relatedEntity', 'Related Entity')}
              htmlFor="txn-entity-type"
            >
              <select
                id="txn-entity-type"
                value={form.related_entity_type}
                onChange={(e) => set('related_entity_type', e.target.value)}
                className={selectClass}
                disabled={isDonationPreset}
              >
                <option value="">{t('financials.addTransaction.noEntity', 'None')}</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`financials.entityType.${type}`, type.replace(/_/g, ' '))}
                  </option>
                ))}
              </select>
            </Field>

            {form.related_entity_type ? (
              <Field
                label={t('financials.addTransaction.entityName', 'Entity Name')}
                htmlFor="txn-entity-name"
              >
                <input
                  type="text"
                  id="txn-entity-name"
                  value={form.related_entity_name}
                  onChange={(e) => set('related_entity_name', e.target.value)}
                  placeholder={t('financials.addTransaction.entityNamePlaceholder', 'Name...')}
                  className={inputClass}
                />
              </Field>
            ) : null}

            {isDonationPreset ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('financials.donations.recurring', 'Recurring')}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_recurring}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          is_recurring: checked,
                          recurring_frequency: checked ? prev.recurring_frequency || 'monthly' : '',
                        }));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('financials.addDonation.isRecurring', 'Recurring donation')}
                    </span>
                  </label>
                </Field>
                {form.is_recurring ? (
                  <Field
                    label={t('financials.addDonation.frequency', 'Frequency')}
                    htmlFor="donation-frequency"
                  >
                    <select
                      id="donation-frequency"
                      value={form.recurring_frequency}
                      onChange={(e) =>
                        set(
                          'recurring_frequency',
                          e.target.value as TransactionFormData['recurring_frequency']
                        )
                      }
                      className={selectClass}
                    >
                      <option value="monthly">{t('financials.addDonation.monthly', 'Monthly')}</option>
                      <option value="quarterly">
                        {t('financials.addDonation.quarterly', 'Quarterly')}
                      </option>
                      <option value="annually">
                        {t('financials.addDonation.annually', 'Annually')}
                      </option>
                    </select>
                  </Field>
                ) : null}
              </div>
            ) : null}

            <Field label={t('financials.addTransaction.notes', 'Notes')} htmlFor="txn-notes">
              <textarea
                id="txn-notes"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field label={t('financials.addTransaction.receipt', 'Receipt / Document')}>
              {form.receipt ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border dark:border-slate-600">
                  <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground dark:text-dark-foreground truncate">
                      {form.receipt.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(form.receipt.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-1.5 p-3 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('financials.addTransaction.uploadReceipt', 'Click to upload receipt')}
                  </span>
                  <span className="text-xs text-gray-400">PDF, JPG, PNG (max 10MB)</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                  />
                </label>
              )}
            </Field>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-between gap-3 border-t dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold text-foreground dark:text-dark-foreground hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
          </div>
        </form>
        </div>
    </ModalPortal>
  );
};

export type { TransactionFormData };
export default AddTransactionModal;
