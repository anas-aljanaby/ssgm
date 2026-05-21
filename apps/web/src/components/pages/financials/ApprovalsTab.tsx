import React, { useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import type { ApprovalItem, ApprovalItemType } from '../../../types/financials';
import { useApproveItem, useApprovals, useRejectItem } from '../../../hooks/useApprovals';
import ModalPortal from '../../common/ModalPortal';

const TYPE_COLORS: Record<ApprovalItemType, string> = {
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  disbursement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  purchase_requisition: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  journal_entry: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  budget_amendment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  refund: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const ApprovalsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: approvalItems = [] } = useApprovals();
  const approveItem = useApproveItem();
  const rejectItem = useRejectItem();
  const [activeAction, setActiveAction] = React.useState<'approve' | 'reject' | null>(null);
  const [activeApprovalId, setActiveApprovalId] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<ApprovalItem | null>(null);

  const pendingCount = useMemo(
    () => approvalItems.filter((item) => item.status === 'pending').length,
    [approvalItems]
  );

  const approvedCount = useMemo(
    () => approvalItems.filter((item) => item.status === 'approved').length,
    [approvalItems]
  );

  const handleApprove = async (id: string) => {
    setActiveAction('approve');
    setActiveApprovalId(id);
    try {
      await approveItem.mutateAsync({ id });
      showSuccess(t('financials.approvals.approve') + ' - ' + t('financials.status.approved'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setActiveAction(null);
      setActiveApprovalId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActiveAction('reject');
    setActiveApprovalId(id);
    try {
      await rejectItem.mutateAsync({ id });
      showSuccess(t('financials.approvals.reject') + ' - ' + t('financials.status.rejected'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setActiveAction(null);
      setActiveApprovalId(null);
    }
  };

  const isDueSoon = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 2 && diffDays >= 0;
  };

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatTypeLabel = (type: ApprovalItemType): string => {
    return t(`financials.approvalType.${type}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {pendingCount}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-300">
            {t('financials.approvals.pending')}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {approvedCount}
          </p>
          <p className="text-sm text-green-600 dark:text-green-300">
            {t('financials.approvals.approvedToday')}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {pendingCount}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            {t('financials.approvals.myPending')}
          </p>
        </div>
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        {approvalItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t('financials.approvals.noApprovals')}
          </div>
        )}

        {approvalItems.map((item) => (
          <div
            key={item.id}
            className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-5"
          >
            {/* Top row: Type badge + Priority badge + Due date */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.type]}`}
              >
                {formatTypeLabel(item.type)}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}
              >
                {t(`financials.priority.${item.priority}`)}
              </span>
              {item.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    isOverdue(item.dueDate)
                      ? 'text-red-600 dark:text-red-400'
                      : isDueSoon(item.dueDate)
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(item.dueDate, language, 'medium')}
                </span>
              )}
              {item.status !== 'pending' && (
                <span
                  className={`ms-auto inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : item.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  {t(`financials.status.${item.status}`)}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-foreground dark:text-dark-foreground mb-1">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {item.description}
            </p>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>
                {t('financials.approvals.requestedBy')}: {item.requestedBy}
              </span>
              <span>{formatDate(item.requestedDate, language, 'medium')}</span>
              <span className="font-semibold text-foreground dark:text-dark-foreground">
                {formatCurrency(item.amount, language)}
              </span>
            </div>

            {/* Workflow Progress */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: item.totalSteps }, (_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < item.currentStep
                        ? 'bg-primary'
                        : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('financials.approvals.step', {
                  current: item.currentStep,
                  total: item.totalSteps,
                })}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {item.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={approveItem.isPending || rejectItem.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {activeAction === 'approve' && activeApprovalId === item.id
                      ? t('common.loading', 'Loading...')
                      : t('financials.approvals.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={approveItem.isPending || rejectItem.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    {activeAction === 'reject' && activeApprovalId === item.id
                      ? t('common.loading', 'Loading...')
                      : t('financials.approvals.reject')}
                  </button>
                </>
              )}
              <button
                onClick={() => setViewingItem(item)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {t('financials.approvals.viewDetails')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingItem && (
      <ModalPortal isOpen={true} onClose={() => setViewingItem(null)} overlayClassName="fixed inset-0 bg-black/40 modal-overlay animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-card p-5 dark:border-slate-700/50 dark:bg-dark-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground dark:text-dark-foreground">
                  {viewingItem.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {viewingItem.description}
                </p>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                {t('common.close', 'Close')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{t('financials.approvals.requestedBy')}:</span> {viewingItem.requestedBy}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{t('financials.disbursements.date')}:</span>{' '}
                {formatDate(viewingItem.requestedDate, language, 'medium')}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{t('financials.transactions.amount')}:</span>{' '}
                {formatCurrency(viewingItem.amount, language)}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{t('financials.approvals.step', { current: viewingItem.currentStep, total: viewingItem.totalSteps })}</span>
              </p>
              {viewingItem.relatedEntityName && (
                <p className="col-span-2 text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{t('financials.transactions.relatedEntity')}:</span> {viewingItem.relatedEntityName}
                </p>
              )}
            </div>
          </div>
      </ModalPortal>
      )}
    </div>
  );
};

export default ApprovalsTab;
