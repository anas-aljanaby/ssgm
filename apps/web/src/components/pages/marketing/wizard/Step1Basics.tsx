import React, { useState, useRef, useEffect } from 'react';
import type { Campaign, CampaignObjective, Language } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { ChevronDownIcon } from '../../../icons/GenericIcons';
import { TargetIcon } from '../../../icons/MetricsIcons';
import { UserCircleIcon, DollarSignIcon } from '../../../icons/MarketingIcons';
import { CalendarIcon } from '../../../icons/ActionIcons';

interface Step1BasicsProps {
    campaignData: Partial<Campaign>;
    updateData: (data: Partial<Campaign>) => void;
    errors?: Record<string, string>;
}

const FormField: React.FC<{ label: string; helpText?: string; error?: string; children: React.ReactNode }> = ({
    label, helpText, error, children,
}) => (
    <div>
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">{label}</label>
        {helpText && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{helpText}</p>}
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const Step1Basics: React.FC<Step1BasicsProps> = ({ campaignData, updateData, errors = {} }) => {
    const { t, dir } = useLocalization(['digital_marketing', 'common']);

    const objectiveOptions: { value: CampaignObjective; label: string }[] = [
        { value: 'appeal', label: t('digital_marketing.wizard.step1.objectives.appeal') },
        { value: 'stewardship', label: t('digital_marketing.wizard.step1.objectives.stewardship') },
        { value: 'update', label: t('digital_marketing.wizard.step1.objectives.update') },
        { value: 'event', label: t('digital_marketing.wizard.step1.objectives.event') },
    ];
    const ownerOptions = [
        { value: 'Fatma Kaya', label: 'Fatma Kaya' },
        { value: 'Ali Veli', label: 'Ali Veli' },
        { value: 'John Doe', label: 'John Doe' },
    ];

    const handleNameChange = (lang: Language, value: string) => {
        updateData({
            name: {
                en: lang === 'en' ? value : (campaignData.name?.en || ''),
                ar: lang === 'ar' ? value : (campaignData.name?.ar || ''),
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'budget') {
            updateData({ budget: value === '' ? 0 : Number(value) });
        } else {
            updateData({ [name]: value });
        }
    };

    const CustomSelect: React.FC<{
        icon: React.ReactNode;
        options: { value: string; label: string }[];
        value: string;
        name: string;
        onChange: (name: string, value: string) => void;
    }> = ({ icon, options, value, name, onChange }) => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const selectedLabel = options.find(opt => opt.value === value)?.label || value;

        return (
            <div className="relative" ref={ref}>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="relative w-full flex items-center p-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-left">
                    <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                    <span className="mx-2 flex-1 truncate">{selectedLabel}</span>
                    <ChevronDownIcon />
                </button>
                {isOpen && (
                    <div className={`absolute z-10 mt-1 w-full bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 ${dir === 'rtl' ? 'right-0' : 'left-0'}`}>
                        {options.map(option => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => { onChange(name, option.value); setIsOpen(false); }}
                                className={`block w-full text-start px-4 py-2 text-sm text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-slate-700 ${value === option.value ? 'font-bold' : ''}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const objectiveToType = (objective: CampaignObjective): Campaign['type'] => {
        switch (objective) {
            case 'appeal': return 'Fundraising';
            case 'stewardship': return 'Awareness';
            case 'update': return 'Awareness';
            case 'event': return 'Event';
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{t('digital_marketing.wizard.step1.title')}</h2>
                <p className="text-gray-500">{t('digital_marketing.wizard.step1.description')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-4xl mx-auto">
                <FormField label={t('digital_marketing.wizard.step1.nameEn')} error={errors.name}>
                    <input
                        type="text"
                        value={campaignData.name?.en || ''}
                        onChange={e => handleNameChange('en', e.target.value)}
                        className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                    />
                </FormField>
                <FormField label={t('digital_marketing.wizard.step1.nameAr')}>
                    <input
                        type="text"
                        value={campaignData.name?.ar || ''}
                        onChange={e => handleNameChange('ar', e.target.value)}
                        dir="rtl"
                        className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                    />
                </FormField>

                <FormField label={t('digital_marketing.wizard.step1.objective')} helpText={t('digital_marketing.wizard.step1.objectiveHelp')} error={errors.objective}>
                    <CustomSelect
                        icon={<TargetIcon />}
                        options={objectiveOptions}
                        value={campaignData.objective || ''}
                        name="objective"
                        onChange={(_n, value) => {
                            const objective = value as CampaignObjective;
                            updateData({
                                objective,
                                type: objectiveToType(objective),
                                goal: {
                                    type: objective === 'event' ? 'Registrations' : 'Fundraising',
                                    target: campaignData.goal?.target || 0,
                                    current: 0,
                                },
                            });
                        }}
                    />
                </FormField>

                <FormField label={t('digital_marketing.wizard.step1.owner')} helpText={t('digital_marketing.wizard.step1.ownerHelp')}>
                    <CustomSelect
                        icon={<UserCircleIcon />}
                        options={ownerOptions}
                        value={campaignData.owner || 'Fatma Kaya'}
                        name="owner"
                        onChange={(_n, value) => updateData({ owner: value })}
                    />
                </FormField>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">{t('digital_marketing.wizard.step1.timeline')}</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('digital_marketing.wizard.step1.timelineHelp')}</p>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500"><CalendarIcon /></span>
                            <input
                                type="date"
                                name="startDate"
                                value={campaignData.startDate ? campaignData.startDate.split('T')[0] : ''}
                                onChange={handleChange}
                                className="w-full p-2.5 ps-10 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <span className="text-gray-400 font-semibold text-lg">→</span>
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500"><CalendarIcon /></span>
                            <input
                                type="date"
                                name="endDate"
                                value={campaignData.endDate ? campaignData.endDate.split('T')[0] : ''}
                                onChange={handleChange}
                                className="w-full p-2.5 ps-10 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>
                    {errors.dates && <p className="mt-1 text-xs text-red-600">{errors.dates}</p>}
                </div>

                <FormField label={t('digital_marketing.wizard.step1.budget')} helpText={t('digital_marketing.wizard.step1.budgetHelp')}>
                    <div className="relative">
                        <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500"><DollarSignIcon /></span>
                        <input
                            type="number"
                            name="budget"
                            min={0}
                            value={campaignData.budget ?? ''}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-full p-2.5 ps-10 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>
                </FormField>
            </div>
        </div>
    );
};

export default Step1Basics;
