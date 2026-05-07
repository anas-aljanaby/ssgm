import React, { useState } from 'react';
import type { Beneficiary, NeedsAssessment } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatDate } from '../../../lib/utils';
import { PlusCircle, FileText } from 'lucide-react';
import AssessmentModal from './AssessmentModal';

interface NeedsAssessmentTabProps {
    beneficiary: Beneficiary;
    onUpdate: (beneficiary: Beneficiary) => void;
}

const povertyScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600 dark:text-green-400';
    if (score <= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
};

const NeedsAssessmentTab: React.FC<NeedsAssessmentTabProps> = ({ beneficiary, onUpdate }) => {
    const { t, language } = useLocalization(['beneficiaries']);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveAssessment = (newAssessment: NeedsAssessment) => {
        const updatedBeneficiary: Beneficiary = {
            ...beneficiary,
            assessments: [newAssessment, ...beneficiary.assessments],
        };
        onUpdate(updatedBeneficiary);
        setIsModalOpen(false);
    };

    const assessments = beneficiary.assessments;

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground">{t('beneficiaries.assessment.title')}</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors"
                    >
                        <PlusCircle size={18} /> {t('beneficiaries.assessment.newAssessment')}
                    </button>
                </div>

                {assessments.length > 0 ? (
                    <div className="space-y-4">
                        {assessments.map(assessment => (
                            <div key={assessment.id} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-foreground dark:text-dark-foreground">
                                            {formatDate(assessment.date, language, 'long')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('beneficiaries.assessment.by')}: {assessment.assessor}
                                        </p>
                                    </div>
                                    <div className="text-end">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.assessment.povertyScore')}</p>
                                        <p className={`text-2xl font-bold ${povertyScoreColor(assessment.povertyScore)}`}>
                                            {assessment.povertyScore}/5
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p><span className="font-medium">{t('beneficiaries.assessment.foodSecurity')}:</span> {t(`beneficiaries.assessment.foodStatus.${assessment.foodSecurity}`)}</p>
                                        <p><span className="font-medium">{t('beneficiaries.assessment.housing')}:</span> {t(`beneficiaries.assessment.housingStatus.${assessment.housingStatus}`)}</p>
                                        {assessment.medicalNeeds && <p><span className="font-medium">{t('beneficiaries.assessment.medical')}:</span> {assessment.medicalNeeds}</p>}
                                        {assessment.educationalNeeds && <p><span className="font-medium">{t('beneficiaries.assessment.educational')}:</span> {assessment.educationalNeeds}</p>}
                                    </div>
                                    {assessment.suggestedPrograms && assessment.suggestedPrograms.length > 0 && (
                                        <div className="bg-primary-light/30 dark:bg-primary/10 p-3 rounded-lg">
                                            <p className="font-medium mb-1">{t('beneficiaries.assessment.suggestedPrograms')}</p>
                                            <ul className="list-disc list-inside space-y-0.5 text-sm">
                                                {assessment.suggestedPrograms.map(prog => <li key={prog}>{prog}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground mt-3">{t('beneficiaries.assessment.noAssessments')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('beneficiaries.assessment.noAssessmentsDesc')}</p>
                    </div>
                )}
            </div>
            <AssessmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAssessment}
                beneficiaryType={beneficiary.beneficiaryType}
            />
        </>
    );
};

export default NeedsAssessmentTab;
