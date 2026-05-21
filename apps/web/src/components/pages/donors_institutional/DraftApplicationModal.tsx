
import React, { useState, useEffect } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import type { Project, InstitutionalDonor } from '../../../types';
import { XIcon, SparklesIcon, Copy, Save } from 'lucide-react';
import Spinner from '../../common/Spinner';
import { generateAiContent } from '../../../lib/ai';

interface DraftApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    donor: InstitutionalDonor;
}

const DraftApplicationModal: React.FC<DraftApplicationModalProps> = ({ isOpen, onClose, project, donor }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors', 'donors']);
    const toast = useToast();
    const [draft, setDraft] = useState('');
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const generateDraft = async () => {
                setIsGenerating(true);
                try {
                    const systemInstruction = `You are an expert grant writer for a non-profit. Your task is to write a concise, compelling, and professional initial grant proposal draft. The tone should be formal but passionate. The response MUST be only the text of the proposal, with no extra explanations. The proposal should be in ${language}.`;

                    const prompt = `
                    Write an initial grant proposal draft to "${donor.organizationName[language] || donor.organizationName.en}" for the project "${project.name[language] || project.name.en}".

                    **Key Information to Include:**
                    - **Project Goal:** ${project.goal}
                    - **Project Objectives:** ${project.objectives.join(', ')}
                    - **Target Beneficiaries:** ${project.stakeholders.targetBeneficiaries}
                    - **Donor's Focus Areas (for alignment):** ${donor.focusAreas.join(', ')}

                    **Structure the proposal as follows:**
                    1. A brief, respectful introduction acknowledging the donor's work in their focus areas.
                    2. A concise summary of the project, highlighting the problem it addresses.
                    3. A clear statement of the project's goal and objectives.
                    4. A concluding paragraph expressing hope for a partnership.
                    `;
                    
                    const text = await generateAiContent({
                        contents: prompt,
                        systemInstruction,
                    });

                    setDraft(text);

                } catch (error) {
                    console.error("Error generating draft:", error);
                    toast.showError(t('institutional_donors.opportunities.draftError'));
                    setDraft(t('institutional_donors.opportunities.draftError'));
                } finally {
                    setIsGenerating(false);
                }
            };
            generateDraft();
        }
    }, [isOpen, project, donor, language, t, toast]);

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        toast.showSuccess(t('institutional_donors.opportunities.draftCopied'));
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        {t('institutional_donors.opportunities.draftTitle')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Spinner text={t('institutional_donors.opportunities.generatingDraft')} />
                        </div>
                    ) : (
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            className="w-full h-96 p-3 border rounded-md bg-gray-50 dark:bg-slate-800/50 dark:border-slate-600 text-sm"
                            readOnly={isGenerating}
                        />
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-between items-center">
                    <p className="text-xs text-gray-500">{t('institutional_donors.opportunities.draftDisclaimer')}</p>
                    <div className="flex gap-3">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-slate-600 text-sm font-semibold">
                            <Copy size={16} /> {t('common.copy')}
                        </button>
                        <button onClick={() => toast.showInfo('Save functionality coming soon.')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark">
                            <Save size={16} /> {t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default DraftApplicationModal;
