import React, { useState } from 'react';
import { CirclePlus, ClipboardCheck, Pencil, Trash2 } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import {
  useCreateGrcAssessment,
  useCreateGrcRequirement,
  useDeleteGrcRequirement,
  useUpdateGrcRequirement,
} from '../../../hooks/useGrc';
import { formatDate } from '../../../lib/utils';
import type { Assessment, ComplianceRequirement, ComplianceStatus } from '../../../types';
import AiCard from '../ai/AiCard';
import RequirementModal, { type RequirementPayload } from './RequirementModal';
import AssessmentModal, { type AssessmentPayload } from './AssessmentModal';

interface ComplianceTabProps {
  requirements: ComplianceRequirement[];
  assessments: Assessment[];
}

const ComplianceStatusBadge: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
  const { t } = useLocalization(['grc']);
  const styles: Record<ComplianceStatus, string> = {
    compliant: 'bg-green-100 text-green-800',
    'partially-compliant': 'bg-yellow-100 text-yellow-800',
    'non-compliant': 'bg-red-100 text-red-800',
    'not-assessed': 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {t(`grc.compliance.statuses.${status.replace('-', '_')}`)}
    </span>
  );
};

const ComplianceTab: React.FC<ComplianceTabProps> = ({ requirements, assessments }) => {
  const { t, language } = useLocalization(['common', 'grc']);
  const toast = useToast();
  const createRequirement = useCreateGrcRequirement();
  const updateRequirement = useUpdateGrcRequirement();
  const deleteRequirement = useDeleteGrcRequirement();
  const createAssessment = useCreateGrcAssessment();

  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null);
  const [assessingRequirement, setAssessingRequirement] = useState<ComplianceRequirement | null>(
    null,
  );

  const latestAssessmentFor = (requirementId: string): Assessment | undefined =>
    assessments
      .filter((a) => a.requirementId === requirementId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const openAddRequirement = () => {
    setEditingRequirement(null);
    setIsRequirementModalOpen(true);
  };

  const openEditRequirement = (requirement: ComplianceRequirement) => {
    setEditingRequirement(requirement);
    setIsRequirementModalOpen(true);
  };

  const handleSubmitRequirement = async (payload: RequirementPayload) => {
    try {
      if (editingRequirement) {
        await updateRequirement.mutateAsync({ id: editingRequirement.id, ...payload });
        toast.showSuccess(t('grc.compliance.toasts.requirementUpdated'));
      } else {
        await createRequirement.mutateAsync(payload);
        toast.showSuccess(t('grc.compliance.toasts.requirementAdded'));
      }
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleDeleteRequirement = async (requirement: ComplianceRequirement) => {
    try {
      await deleteRequirement.mutateAsync(requirement.id);
      toast.showSuccess(t('grc.compliance.toasts.requirementDeleted'));
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleSubmitAssessment = async (payload: AssessmentPayload) => {
    if (!assessingRequirement) return;
    try {
      await createAssessment.mutateAsync({
        requirementId: assessingRequirement.id,
        payload,
      });
      toast.showSuccess(t('grc.compliance.toasts.assessmentLogged'));
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <>
      <AiCard title={t('grc.compliance.title')}>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={openAddRequirement}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"
          >
            <CirclePlus size={16} />
            {t('grc.compliance.newRequirement')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-2">{t('grc.compliance.table.requirement')}</th>
                <th className="p-2">{t('grc.compliance.table.source')}</th>
                <th className="p-2">{t('grc.compliance.table.status')}</th>
                <th className="p-2">{t('grc.compliance.table.lastAssessed')}</th>
                <th className="p-2">{t('grc.compliance.table.nextDue')}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => {
                const latestAssessment = latestAssessmentFor(req.id);
                return (
                  <tr key={req.id} className="border-t dark:border-slate-700 group">
                    <td className="p-2 font-semibold max-w-sm text-foreground dark:text-dark-foreground">
                      {req.title[language]}
                    </td>
                    <td className="p-2 text-foreground dark:text-dark-foreground">
                      {req.sourceName[language]}
                    </td>
                    <td className="p-2">
                      <ComplianceStatusBadge status={latestAssessment?.status ?? 'not-assessed'} />
                    </td>
                    <td className="p-2 text-foreground dark:text-dark-foreground">
                      {latestAssessment ? formatDate(latestAssessment.date, language) : t('common.notAvailable')}
                    </td>
                    <td className="p-2 text-foreground dark:text-dark-foreground">
                      {formatDate(req.nextDueDate, language)}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setAssessingRequirement(req)}
                          title={t('grc.compliance.logAssessment')}
                          className="p-1.5 text-gray-400 hover:text-primary rounded"
                        >
                          <ClipboardCheck size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditRequirement(req)}
                          title={t('grc.compliance.editRequirement')}
                          className="p-1.5 text-gray-400 hover:text-primary rounded"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequirement(req)}
                          title={t('grc.compliance.deleteRequirement')}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {requirements.length === 0 && (
            <p className="text-center py-8 text-gray-500">{t('grc.compliance.noRequirements')}</p>
          )}
        </div>
      </AiCard>

      {isRequirementModalOpen && (
        <RequirementModal
          requirement={editingRequirement ?? undefined}
          onClose={() => setIsRequirementModalOpen(false)}
          onSubmit={handleSubmitRequirement}
        />
      )}
      {assessingRequirement && (
        <AssessmentModal
          requirement={assessingRequirement}
          latestAssessment={latestAssessmentFor(assessingRequirement.id)}
          onClose={() => setAssessingRequirement(null)}
          onSubmit={handleSubmitAssessment}
        />
      )}
    </>
  );
};

export default ComplianceTab;
