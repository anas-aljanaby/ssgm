import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Campaign, CampaignStatus } from '../../../types';
import { XIcon } from '../../icons/GenericIcons';
import WizardStepper from './wizard/WizardStepper';
import Step1Basics from './wizard/Step1Basics';
import Step2Audience from './wizard/Step2Audience';
import Step3ChannelContent from './wizard/Step3ChannelContent';
import Step4Review from './wizard/Step4Review';
import Spinner from '../../common/Spinner';

interface CreateCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaign: Campaign) => void;
}

const TOTAL_STEPS = 4;

const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [launchStatus, setLaunchStatus] = useState<'Draft' | 'Scheduled' | 'Active'>('Draft');
    const [campaignData, setCampaignData] = useState<Partial<Campaign>>({
        name: { en: '', ar: '' },
        owner: 'Fatma Kaya',
        budget: 0,
        channels: ['Email'],
        objective: undefined,
        contentDraft: { language: 'en', subject: '', body: '' },
        audience: undefined,
        goal: { type: 'Fundraising', target: 0, current: 0 },
    });

    const resetAndClose = () => {
        setCurrentStep(1);
        setErrors({});
        setIsSubmitting(false);
        setLaunchStatus('Draft');
        setCampaignData({
            name: { en: '', ar: '' },
            owner: 'Fatma Kaya',
            budget: 0,
            channels: ['Email'],
            objective: undefined,
            contentDraft: { language: 'en', subject: '', body: '' },
            audience: undefined,
            goal: { type: 'Fundraising', target: 0, current: 0 },
        });
        onClose();
    };

    const updateCampaignData = (update: Partial<Campaign>) => {
        setCampaignData(prev => ({ ...prev, ...update }));
    };

    const validateStep = (step: number): boolean => {
        const nextErrors: Record<string, string> = {};
        if (step === 1) {
            if (!campaignData.name?.en?.trim()) {
                nextErrors.name = t('digital_marketing.wizard.validation.nameRequired');
            }
            if (!campaignData.objective) {
                nextErrors.objective = t('digital_marketing.wizard.validation.objectiveRequired');
            }
            if (!campaignData.startDate || !campaignData.endDate) {
                nextErrors.dates = t('digital_marketing.wizard.validation.datesRequired');
            }
        }
        if (step === 2) {
            if (!campaignData.audience?.name) {
                nextErrors.audience = t('digital_marketing.wizard.validation.audienceRequired');
            }
        }
        if (step === 3) {
            if (!campaignData.channels?.length) {
                nextErrors.channel = t('digital_marketing.wizard.validation.channelRequired');
            }
            const ch = campaignData.channels?.[0];
            if ((ch === 'Email' || ch === 'Social') && !campaignData.contentDraft?.subject?.trim()) {
                nextErrors.subject = t('digital_marketing.wizard.validation.subjectRequired');
            }
            if (!campaignData.contentDraft?.body?.trim()) {
                nextErrors.body = t('digital_marketing.wizard.validation.bodyRequired');
            }
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleFinish = async () => {
        if (!validateStep(3) && currentStep === 4) {
            // re-check content briefly
        }
        if (!campaignData.name?.en?.trim() || !campaignData.objective || !campaignData.audience) return;

        setIsSubmitting(true);
        // Simulate async submit for ACTIVATE wiring later
        await new Promise(r => setTimeout(r, 600));

        const status: CampaignStatus = launchStatus;
        const campaign: Campaign = {
            id: `CAMP-${Date.now()}`,
            name: {
                en: campaignData.name.en,
                ar: campaignData.name.ar || campaignData.name.en,
            },
            type: campaignData.type || 'Fundraising',
            objective: campaignData.objective,
            status,
            startDate: campaignData.startDate || new Date().toISOString(),
            endDate: campaignData.endDate || new Date().toISOString(),
            channels: campaignData.channels || ['Email'],
            contentDraft: campaignData.contentDraft,
            budget: campaignData.budget || 0,
            spent: 0,
            audience: campaignData.audience,
            goal: campaignData.goal || { type: 'Fundraising', target: 0, current: 0 },
            owner: campaignData.owner || 'Current User',
            createdAt: new Date().toISOString(),
            messagesSent: 0,
        };

        onSubmit(campaign);
        setIsSubmitting(false);
        resetAndClose();
    };

    if (!isOpen) return null;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1Basics campaignData={campaignData} updateData={updateCampaignData} errors={errors} />;
            case 2:
                return <Step2Audience campaignData={campaignData} updateData={updateCampaignData} errors={errors} />;
            case 3:
                return <Step3ChannelContent campaignData={campaignData} updateData={updateCampaignData} errors={errors} />;
            case 4:
                return (
                    <Step4Review
                        campaignData={campaignData}
                        launchStatus={launchStatus}
                        onLaunchStatusChange={setLaunchStatus}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
            onClick={resetAndClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[95vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                        {t('digital_marketing.wizard.title')}
                    </h2>
                    <button type="button" onClick={resetAndClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 border-b dark:border-slate-700 flex-shrink-0">
                    <WizardStepper currentStep={currentStep} />
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {renderStepContent()}
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
                    <button
                        type="button"
                        onClick={resetAndClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold"
                    >
                        {t('common.cancel')}
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 1 || isSubmitting}
                            className="px-4 py-2 rounded-lg border dark:border-slate-600 text-sm font-semibold disabled:opacity-50"
                        >
                            ← {t('digital_marketing.wizard.back')}
                        </button>
                        {currentStep < TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
                            >
                                {t('digital_marketing.wizard.next')} →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <Spinner />}
                                {t('digital_marketing.wizard.finishLaunch')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCampaignWizard;
