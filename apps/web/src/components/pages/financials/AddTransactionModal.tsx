import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import type {
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

const STATUSES: TransactionStatus[] = ['draft', 'pending', 'approved', 'posted'];

const ENTITY_TYPES = ['donor', 'project', 'beneficiary', 'institutional_donor', 'vendor'] as const;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization(['common', 'financials']);
  const [form, setForm] = useState<TransactionFormData>({ ...INITIAL_FORM });

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description_en || form.amount <= 0) return;
    onSubmit(form);
    setForm({ ...INITIAL_FORM });
    onClose();
  };

  const inputClass =
    'mt-1 block w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600 text-sm text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-transaction-title"
    >
      <div
        className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 shrink-0">
          <h2
            id="add-transaction-title"
            className="text-lg font-bold text-foreground dark:text-dark-foreground"
          >
            {t('financials.addTransaction.title', 'Add Transaction')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Direction toggle */}
            <div>
              <label className={labelClass}>
                {t('financials.transactions.direction', 'Direction')}
              </label>
              <div className="mt-1 flex rounded-lg border dark:border-slate-600 overflow-hidden">
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
            </div>

            {/* Row: Date + Amount + Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="txn-date" className={labelClass}>
                  {t('financials.transactions.date', 'Date')}
                </label>
                <input
                  type="date"
                  id="txn-date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="txn-amount" className={labelClass}>
                  {t('financials.transactions.amount', 'Amount')}
                </label>
                <input
                  type="number"
                  id="txn-amount"
                  value={form.amount || ''}
                  onChange={(e) => set('amount', Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="txn-currency" className={labelClass}>
                  {t('financials.common.currency', 'Currency')}
                </label>
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
              </div>
            </div>

            {/* Row: Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="txn-category" className={labelClass}>
                  {t('financials.transactions.category', 'Category')}
                </label>
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
              </div>
              <div>
                <label htmlFor="txn-status" className={labelClass}>
                  {t('financials.transactions.status', 'Status')}
                </label>
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
              </div>
            </div>

            {/* Description EN */}
            <div>
              <label htmlFor="txn-desc-en" className={labelClass}>
                {t('financials.transactions.description', 'Description')} (EN)
              </label>
              <input
                type="text"
                id="txn-desc-en"
                value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                required
                placeholder={t('financials.addTransaction.descPlaceholder', 'e.g. Monthly donation from...')}
                className={inputClass}
              />
            </div>

            {/* Description AR */}
            <div>
              <label htmlFor="txn-desc-ar" className={labelClass}>
                {t('financials.transactions.description', 'Description')} (AR)
              </label>
              <input
                type="text"
                id="txn-desc-ar"
                value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
                dir="rtl"
                placeholder={t('financials.addTransaction.descPlaceholderAr', 'الوصف بالعربية...')}
                className={inputClass}
              />
            </div>

            {/* Reference */}
            <div>
              <label htmlFor="txn-reference" className={labelClass}>
                {t('financials.transactions.reference', 'Reference')}
              </label>
              <input
                type="text"
                id="txn-reference"
                value={form.reference}
                onChange={(e) => set('reference', e.target.value)}
                placeholder={t('financials.addTransaction.refPlaceholder', 'e.g. INV-2024-001')}
                className={inputClass}
              />
            </div>

            {/* Related Entity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="txn-entity-type" className={labelClass}>
                  {t('financials.transactions.relatedEntity', 'Related Entity')}
                </label>
                <select
                  id="txn-entity-type"
                  value={form.related_entity_type}
                  onChange={(e) => set('related_entity_type', e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t('financials.addTransaction.noEntity', 'None')}</option>
                  {ENTITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split('_')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </option>
                  ))}
                </select>
              </div>
              {form.related_entity_type && (
                <div>
                  <label htmlFor="txn-entity-name" className={labelClass}>
                    {t('financials.addTransaction.entityName', 'Entity Name')}
                  </label>
                  <input
                    type="text"
                    id="txn-entity-name"
                    value={form.related_entity_name}
                    onChange={(e) => set('related_entity_name', e.target.value)}
                    placeholder={t('financials.addTransaction.entityNamePlaceholder', 'Name...')}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="txn-notes" className={labelClass}>
                {t('financials.addTransaction.notes', 'Notes')}
              </label>
              <textarea
                id="txn-notes"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Receipt upload */}
            <div>
              <label className={labelClass}>
                {t('financials.addTransaction.receipt', 'Receipt / Document')}
              </label>
              {form.receipt ? (
                <div className="mt-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border dark:border-slate-600">
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
                <label className="mt-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800">
                  <Upload className="w-6 h-6 text-gray-400" />
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
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3 border-t dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold text-foreground dark:text-dark-foreground hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors"
            >
              {t('financials.addTransaction.save', 'Save Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { TransactionFormData };
export default AddTransactionModal;
