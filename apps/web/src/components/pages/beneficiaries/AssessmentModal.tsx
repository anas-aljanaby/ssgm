import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import type { BeneficiaryType, NeedsAssessment } from '../../../types';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';
import Spinner from '../../common/Spinner';
import { generateAiContent, parseAiJson } from '../../../lib/ai';

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (assessment: NeedsAssessment) => void;
    beneficiaryType: BeneficiaryType;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, onClose, onSave, beneficiaryType }) => {
    const { t } = useLocalization(['common', 'beneficiaries']);
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        povertyScore: 3,
        foodSecurity: 'secure' as NeedsAssessment['foodSecurity'],
        housingStatus: 'stable' as NeedsAssessment['housingStatus'],
        medicalNeeds: '',
        educationalNeeds: '',
        notes: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Mock available programs
            const programs = [
                { id: 'PROGRAM_FOOD_AID', description: 'Provides monthly food packages.' },
                { id: 'PROGRAM_HOUSING_SUPPORT', description: 'Assists with rent or finding shelter.' },
                { id: 'PROGRAM_HEALTH_CARE', description: 'Covers basic medical check-ups and treatments.' },
                { id: 'PROGRAM_EDU_SUPPORT', description: 'Provides scholarships or school supplies.' },
                { id: 'PROGRAM_TECH_GRANT', description: 'Grants for educational technology like laptops.' },
            ];
            
            const systemInstruction = `You are an expert social worker AI. Based on a needs assessment for a beneficiary, suggest a list of relevant program IDs from the provided list. Your response must be a JSON object with a single key 'suggestedProgramIds' which is an array of strings.`;
            
            const prompt = `
            Beneficiary Assessment Data: ${JSON.stringify(formData)}
            Available Programs: ${JSON.stringify(programs)}
            
            Analyze the data and suggest the most relevant program IDs.
            `;
            
            const responseText = await generateAiContent({
                contents: prompt,
                systemInstruction,
                responseMimeType: "application/json",
            });
            
            const result = parseAiJson<{ suggestedProgramIds?: string[] }>(responseText);

            const newAssessment: NeedsAssessment = {
                ...formData,
                id: `asm-${Date.now()}`,
                date: new Date().toISOString(),
                assessor: 'System User', // Should be dynamic in a real app
                suggestedPrograms: result.suggestedProgramIds || [],
            };
            
            onSave(newAssessment);
            toast.showSuccess(t('beneficiaries.assessment.toasts.savedWithSuggestions'));

        } catch (error) {
            console.error('AI suggestion failed:', error);
            toast.showError(t('beneficiaries.assessment.toasts.savedWithoutSuggestions'));
            // Save anyway without suggestions
            const newAssessment: NeedsAssessment = {
                ...formData,
                id: `asm-${Date.now()}`,
                date: new Date().toISOString(),
                assessor: 'System User',
                suggestedPrograms: [],
            };
            onSave(newAssessment);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('beneficiaries.assessment.newAssessment')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium">{t('beneficiaries.assessment.povertyScore')} ({formData.povertyScore})</label>
                            <input type="range" name="povertyScore" min="1" max="5" value={formData.povertyScore} onChange={handleInputChange} className="w-full mt-1" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('beneficiaries.assessment.foodSecurity')}</label>
                                <select name="foodSecurity" value={formData.foodSecurity} onChange={handleInputChange} className="w-full p-2 mt-1 border rounded-md">
                                    <option value="secure">{t('beneficiaries.assessment.foodStatus.secure')}</option>
                                    <option value="at_risk">{t('beneficiaries.assessment.foodStatus.at_risk')}</option>
                                    <option value="insecure">{t('beneficiaries.assessment.foodStatus.insecure')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('beneficiaries.assessment.housing')}</label>
                                <select name="housingStatus" value={formData.housingStatus} onChange={handleInputChange} className="w-full p-2 mt-1 border rounded-md">
                                    <option value="stable">{t('beneficiaries.assessment.housingStatus.stable')}</option>
                                    <option value="unstable">{t('beneficiaries.assessment.housingStatus.unstable')}</option>
                                </select>
                            </div>
                        </div>
                        {beneficiaryType !== 'family' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium">{t('beneficiaries.assessment.educational')}</label>
                                    <textarea name="educationalNeeds" value={formData.educationalNeeds} onChange={handleInputChange} rows={2} className="w-full p-2 mt-1 border rounded-md"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium">{t('beneficiaries.assessment.medical')}</label>
                                    <textarea name="medicalNeeds" value={formData.medicalNeeds} onChange={handleInputChange} rows={2} className="w-full p-2 mt-1 border rounded-md"/>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium">{t('beneficiaries.assessment.notes')}</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full p-2 mt-1 border rounded-md"/>
                        </div>
                    </div>
                     <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold flex items-center gap-2">
                            {isLoading ? <Spinner size="w-4 h-4"/> : null}
                            {isLoading ? t('beneficiaries.assessment.actions.analyzing') : t('beneficiaries.assessment.actions.saveWithSuggestions')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AssessmentModal;
