
import React, { useState } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project, Language, ProjectType, ProjectLifecycleStageId } from '../../../../types';

interface Step1Props {
    data: Partial<Omit<Project, 'id'>>;
    updateData: (update: Partial<Omit<Project, 'id'>>) => void;
}

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
const selectClass = `${inputClass} appearance-auto`;

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
        {children}
    </div>
);

const Step1_ProjectInfo: React.FC<Step1Props> = ({ data, updateData }) => {
    const { t } = useLocalization();
    const [activeLang, setActiveLang] = useState<Language>('en');

    const handleNameChange = (lang: Language, value: string) => {
        updateData({ name: { ...data.name, [lang]: value } as Record<Language, string> });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const locKey = name.split('.')[1];
            updateData({ location: { ...data.location, [locKey]: value } as Project['location'] });
        } else {
            updateData({ [name]: value });
        }
    };

    const projectTypes: ProjectType[] = ['humanitarian', 'development', 'health', 'education', 'infrastructure'];
    const projectStages: ProjectLifecycleStageId[] = ['design', 'planning', 'implementation', 'monitoring', 'closure'];

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <FormField label={t('projects.wizard.form.name')}>
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div className="flex border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        {(['en', 'ar'] as Language[]).map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setActiveLang(lang)}
                                className={`px-4 py-1.5 text-xs font-semibold uppercase transition-colors ${activeLang === lang ? 'text-primary border-b-2 border-primary bg-white dark:bg-slate-800' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={data.name?.[activeLang] || ''}
                        onChange={e => handleNameChange(activeLang, e.target.value)}
                        placeholder={activeLang === 'en' ? 'Enter project name' : 'أدخل اسم المشروع'}
                        className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border-0 focus:ring-0"
                        dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                    />
                </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t('projects.wizard.form.type')}>
                    <select name="type" value={data.type} onChange={handleInputChange} className={selectClass}>
                        {projectTypes.map(type => <option key={type} value={type}>{t(`projects.types.${type}`)}</option>)}
                    </select>
                </FormField>
                <FormField label={t('projects.wizard.form.stage')}>
                    <select name="stage" value={data.stage} onChange={handleInputChange} className={selectClass}>
                        {projectStages.map(stage => <option key={stage} value={stage}>{t(`projects.stages.${stage}`)}</option>)}
                    </select>
                </FormField>
                <FormField label={t('projects.wizard.form.startDate')}>
                    <input type="date" name="plannedStartDate" value={data.plannedStartDate} onChange={handleInputChange} className={inputClass} />
                </FormField>
                <FormField label={t('projects.wizard.form.endDate')}>
                    <input type="date" name="plannedEndDate" value={data.plannedEndDate} onChange={handleInputChange} className={inputClass} />
                </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('projects.wizard.form.country')}>
                    <select name="location.country" value={data.location?.country} onChange={handleInputChange} className={selectClass}>
                        <option value="Turkey">{t('projects.countries.turkey')}</option>
                        <option value="Syria">{t('projects.countries.syria')}</option>
                        <option value="Lebanon">{t('projects.countries.lebanon')}</option>
                        <option value="Uganda">{t('projects.countries.uganda')}</option>
                    </select>
                </FormField>
                <FormField label={t('projects.wizard.form.city')}>
                    <input type="text" name="location.city" value={data.location?.city} onChange={handleInputChange} placeholder="City name" className={inputClass} />
                </FormField>
                <FormField label={t('projects.wizard.form.region')}>
                    <input type="text" name="location.region" value={data.location?.region || ''} onChange={handleInputChange} placeholder="Region (optional)" className={inputClass} />
                </FormField>
            </div>
        </div>
    );
};

export default Step1_ProjectInfo;
