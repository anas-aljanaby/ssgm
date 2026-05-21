
import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Project, Language, ProjectKPI } from '../../../types';
import ModalPortal from '../../common/ModalPortal';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import WizardStepper from './wizard/WizardStepper';
import Step1_ProjectInfo from './wizard/Step1_ProjectInfo';
import Step2_Stakeholders from './wizard/Step2_Stakeholders';
import Step3_GoalsAndOutcomes from './wizard/Step3_GoalsAndOutcomes';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id'>) => void;
}

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ isOpen, onClose, onCreateProject }) => {
    const { t, dir } = useLocalization();
    const [currentStep, setCurrentStep] = useState(1);

    const [projectData, setProjectData] = useState<Partial<Omit<Project, 'id'>>>({
        name: { en: '', ar: '' },
        type: 'humanitarian',
        stage: 'design',
        plannedStartDate: '',
        plannedEndDate: '',
        location: { country: 'Turkey', city: '' },
        stakeholders: { donor: '', targetBeneficiaries: '', primaryContact: '' },
        goal: '',
        objectives: [''],
        expectedOutcomes: [''],
        kpis: [{ id: `kpi-${Date.now()}`, name: '', unit: 'number', target: '' }],
        progress: 0,
        budget: 0,
        spent: 0,
    });

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const updateData = (update: Partial<Omit<Project, 'id'>>) => {
        setProjectData(prev => ({ ...prev, ...update }));
    };

    const handleCreate = () => {
        onCreateProject(projectData as Omit<Project, 'id'>);
    };

    if (!isOpen) return null;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1_ProjectInfo data={projectData} updateData={updateData} />;
            case 2: return <Step2_Stakeholders data={projectData} updateData={updateData} />;
            case 3: return <Step3_GoalsAndOutcomes data={projectData} updateData={updateData} setProjectData={setProjectData} />;
            default: return null;
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh] border border-gray-200 dark:border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 shrink-0">
                    <h2 className="text-lg font-bold text-foreground dark:text-dark-foreground">{t('projects.wizard.title')}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('common.close')}>
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800 shrink-0">
                    <WizardStepper currentStep={currentStep} />
                </div>

                <div className="px-6 py-6 overflow-y-auto flex-grow">
                    {renderStepContent()}
                </div>

                <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-800/50 rounded-b-xl flex justify-between items-center shrink-0 border-t border-gray-100 dark:border-slate-700/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                        {t('common.cancel')}
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft size={14} className={dir === 'rtl' ? 'rotate-180' : undefined} />
                            {t('projects.wizard.back')}
                        </button>
                        {currentStep < 3 ? (
                            <button onClick={handleNext} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm">
                                {t('projects.wizard.next')}
                                <ArrowRight size={14} className={dir === 'rtl' ? 'rotate-180' : undefined} />
                            </button>
                        ) : (
                            <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary-dark transition-colors shadow-sm">
                                <Check size={14} />
                                {t('projects.wizard.finish')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default CreateProjectWizard;
