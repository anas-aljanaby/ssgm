import React from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { CheckCircleIcon } from '../../../icons/UtilityIcons';

interface WizardStepperProps {
  currentStep: number;
}

const WizardStepper: React.FC<WizardStepperProps> = ({ currentStep }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);
    const steps = ['basics', 'audience', 'channel', 'review'] as const;

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((stepKey, stepIdx) => {
                    const stepNumber = stepIdx + 1;
                    const isCompleted = currentStep > stepNumber;
                    const isCurrent = currentStep === stepNumber;

                    return (
                        <li key={stepKey} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                            {stepIdx !== 0 && (
                                <div
                                    className={`absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-full h-0.5 ${isCompleted || isCurrent ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-700'}`}
                                    aria-hidden="true"
                                />
                            )}

                            <div className="flex flex-col items-center text-center">
                                <div className="relative flex h-8 w-8 items-center justify-center">
                                    {isCompleted ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                                            <CheckCircleIcon className="text-white w-full h-full" />
                                        </div>
                                    ) : (
                                        <div className={`rounded-full border-2 ${isCurrent ? 'border-primary' : 'border-gray-300 dark:border-slate-600'} flex h-8 w-8 items-center justify-center`}>
                                            <span className={isCurrent ? 'text-primary' : 'text-gray-500'}>{stepNumber}</span>
                                        </div>
                                    )}
                                </div>
                                <p className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                    {t(`digital_marketing.wizard.steps.${stepKey}`)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default WizardStepper;
