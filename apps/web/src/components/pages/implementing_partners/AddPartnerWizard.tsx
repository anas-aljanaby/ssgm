import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, X } from 'lucide-react';
import type { PartnerSector } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import type { PartnerCreateInput } from '../../../hooks/usePartners';

interface AddPartnerWizardProps {
    onBack: () => void;
    onSubmit: (input: PartnerCreateInput, callbacks?: { onSuccess?: () => void }) => void;
    isSubmitting?: boolean;
}

const STEPS = ['basic', 'scope', 'contact', 'documents', 'review'] as const;

const SECTOR_OPTIONS: PartnerSector[] = ['التعليم', 'الصحة', 'الإغاثة', 'التنمية', 'البيئة'];

interface WizardForm {
    organizationName: string;
    organizationNameEn: string;
    primarySector: PartnerSector;
    country: string;
    city: string;
    description: string;
    mainPhone: string;
    officialEmail: string;
    website: string;
}

interface UploadedFile {
    name: string;
    size: number;
}

const StepIndicator: React.FC<{ currentStep: number; labels: string[] }> = ({ currentStep, labels }) => (
    <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
            {labels.map((label, index) => {
                const step = index + 1;
                const completed = currentStep > step;
                const active = currentStep === step;
                return (
                    <li key={label} className={`relative ${index !== labels.length - 1 ? 'flex-1' : ''}`}>
                        {index < labels.length - 1 && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200" aria-hidden="true">
                                <div className={`h-full bg-blue-600 transition-all duration-500 ${completed || active ? 'w-full' : 'w-0'}`} />
                            </div>
                        )}
                        <div className="relative flex flex-col items-center text-center">
                            <div className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${completed ? 'bg-blue-600' : active ? 'border-2 border-blue-600 bg-white' : 'border-2 border-gray-300 bg-white'}`}>
                                {completed ? <Check className="h-5 w-5 text-white" /> : active ? <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> : <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />}
                            </div>
                            <p className={`mt-2 text-xs font-semibold ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    </nav>
);

const FormField: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const inputClass = 'w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600';

const SuccessScreen: React.FC<{ referenceNumber: string; onBack: () => void; t: (key: string) => string }> = ({ referenceNumber, onBack, t }) => (
    <div className="bg-gray-50 dark:bg-dark-background p-6 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 max-w-lg text-center"
        >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-foreground">{t('partners.wizard.successTitle')}</h1>
            <p className="mt-2 text-gray-500">{t('partners.wizard.successSubtitle')}</p>
            <div className="mt-6 bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">{t('partners.wizard.referenceNumber')}</span>
                    <span className="font-mono font-semibold">{referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">{t('partners.wizard.status')}</span>
                    <span className="font-semibold text-yellow-600">{t('partners.wizard.statusPending')}</span>
                </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">{t('partners.wizard.successNotice')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onBack} className="flex-1 px-6 py-3 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    {t('partners.wizard.backToList')}
                </button>
            </div>
        </motion.div>
    </div>
);

const AddPartnerWizard: React.FC<AddPartnerWizardProps> = ({ onBack, onSubmit, isSubmitting = false }) => {
    const { t } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [form, setForm] = useState<WizardForm>({
        organizationName: '',
        organizationNameEn: '',
        primarySector: 'التعليم',
        country: '',
        city: '',
        description: '',
        mainPhone: '',
        officialEmail: '',
        website: '',
    });

    const stepLabels = STEPS.map((s) => t(`partners.wizard.steps.${s}`));

    const update = (patch: Partial<WizardForm>) => setForm((prev) => ({ ...prev, ...patch }));

    const validateStep = (currentStep: number): boolean => {
        const next: Record<string, string> = {};
        if (currentStep === 1) {
            if (!form.organizationName.trim()) next.organizationName = t('partners.validation.required');
        }
        if (currentStep === 2) {
            if (!form.country.trim()) next.country = t('partners.validation.required');
        }
        if (currentStep === 3) {
            if (!form.officialEmail.trim()) {
                next.officialEmail = t('partners.validation.required');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) {
                next.officialEmail = t('partners.validation.invalidEmail');
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        setErrors({});
        setStep((s) => s + 1);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setUploadedFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size }))]);
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const buildCreateInput = (): PartnerCreateInput => ({
        name_ar: form.organizationName.trim(),
        name_en: form.organizationNameEn.trim(),
        sector: form.primarySector,
        status: 'قيد المراجعة',
        country: form.country.trim(),
        city: form.city.trim(),
        description: form.description.trim(),
        phone: form.mainPhone.trim() || undefined,
        email: form.officialEmail.trim(),
        website: form.website.trim() || undefined,
    });

    const handleSubmit = () => {
        if (!confirmed || isSubmitting) return;
        const ref = `P-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        onSubmit(buildCreateInput(), {
            onSuccess: () => {
                setReferenceNumber(ref);
                setSubmitted(true);
            },
        });
    };

    const handleSaveDraft = () => {
        toast.showSuccess(t('partners.wizard.draftSaved'));
    };

    if (submitted) {
        return <SuccessScreen referenceNumber={referenceNumber} onBack={onBack} t={t} />;
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-center">{t('partners.wizard.basicTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('partners.wizard.fields.organizationNameAr')} required error={errors.organizationName}>
                                <input className={inputClass} value={form.organizationName} onChange={(e) => update({ organizationName: e.target.value })} />
                            </FormField>
                            <FormField label={t('partners.wizard.fields.organizationNameEn')}>
                                <input className={inputClass} value={form.organizationNameEn} onChange={(e) => update({ organizationNameEn: e.target.value })} />
                            </FormField>
                            <FormField label={t('partners.wizard.fields.primarySector')} required>
                                <select className={inputClass} value={form.primarySector} onChange={(e) => update({ primarySector: e.target.value as PartnerSector })}>
                                    {SECTOR_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label={t('partners.wizard.fields.description')}>
                                <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => update({ description: e.target.value })} />
                            </FormField>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-center">{t('partners.wizard.steps.scope')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('partners.wizard.fields.country')} required error={errors.country}>
                                <input className={inputClass} value={form.country} onChange={(e) => update({ country: e.target.value })} />
                            </FormField>
                            <FormField label={t('partners.wizard.fields.city')}>
                                <input className={inputClass} value={form.city} onChange={(e) => update({ city: e.target.value })} />
                            </FormField>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-center">{t('partners.wizard.steps.contact')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('partners.wizard.fields.mainPhone')}>
                                <input className={inputClass} value={form.mainPhone} onChange={(e) => update({ mainPhone: e.target.value })} />
                            </FormField>
                            <FormField label={t('partners.wizard.fields.officialEmail')} required error={errors.officialEmail}>
                                <input type="email" className={inputClass} value={form.officialEmail} onChange={(e) => update({ officialEmail: e.target.value })} />
                            </FormField>
                            <FormField label={t('partners.wizard.fields.website')}>
                                <input className={inputClass} value={form.website} onChange={(e) => update({ website: e.target.value })} />
                            </FormField>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 max-w-4xl mx-auto text-center">
                        <h2 className="text-xl font-bold">{t('partners.wizard.steps.documents')}</h2>
                        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleFileUpload} />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 w-full hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <p className="text-gray-500">{t('partners.wizard.fields.dragDrop')}</p>
                            <p className="text-xs text-gray-400 mt-2">{t('partners.wizard.fields.fileTypes')}</p>
                        </button>
                        {uploadedFiles.length > 0 && (
                            <ul className="text-right space-y-2 mt-4">
                                {uploadedFiles.map((file, index) => (
                                    <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-4 py-2 text-sm">
                                        <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                                        <span className="flex items-center gap-2"><FileText size={16} /> {file.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-center">{t('partners.wizard.steps.review')}</h2>
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 space-y-3 text-sm">
                            <p><strong>{t('partners.wizard.fields.reviewOrganization')}:</strong> {form.organizationName || '—'}</p>
                            <p><strong>{t('partners.wizard.fields.reviewSector')}:</strong> {form.primarySector}</p>
                            <p><strong>{t('partners.wizard.fields.reviewCity')}:</strong> {form.city || '—'}</p>
                            <p><strong>{t('partners.wizard.fields.reviewEmail')}:</strong> {form.officialEmail || '—'}</p>
                            {uploadedFiles.length > 0 && (
                                <p><strong>{t('partners.wizard.fields.reviewDocuments')}:</strong> {uploadedFiles.length}</p>
                            )}
                        </div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm">{t('partners.wizard.confirmLabel')}</span>
                        </label>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-dark-background p-6 space-y-6">
            <div>
                <nav className="text-sm mb-2">
                    <button type="button" onClick={onBack} className="text-gray-500 hover:underline">{t('partners.breadcrumbHome')}</button>
                    {' > '}
                    <button type="button" onClick={onBack} className="text-gray-500 hover:underline">{t('partners.breadcrumbPartners')}</button>
                    {' > '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('partners.wizard.breadcrumbRegister')}</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-foreground">{t('partners.wizard.title')}</h1>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 md:p-8">
                <StepIndicator currentStep={step} labels={stepLabels} />
                <div className="mt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="mt-8 pt-6 border-t dark:border-slate-700 flex justify-between items-center">
                    <div>
                        {step === 1 ? (
                            <button type="button" onClick={onBack} className="px-6 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">{t('partners.wizard.cancel')}</button>
                        ) : (
                            <button type="button" onClick={() => { setErrors({}); setStep((s) => s - 1); }} className="px-6 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">{t('partners.wizard.prev')}</button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {step > 1 && step < 5 && (
                            <button type="button" onClick={handleSaveDraft} className="px-6 py-2 text-sm font-semibold text-gray-700 border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                {t('partners.wizard.saveDraft')}
                            </button>
                        )}
                        {step < 5 ? (
                            <button type="button" onClick={handleNext} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{t('partners.wizard.next')}</button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!confirmed || isSubmitting}
                                className="px-8 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('common.loading') : t('partners.wizard.submit')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPartnerWizard;
