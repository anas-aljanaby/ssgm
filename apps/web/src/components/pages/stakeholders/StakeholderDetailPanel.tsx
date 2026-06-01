
import React, { useEffect, useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Stakeholder, StakeholderCategoryKey, StakeholderType } from '../../../types';
import {
    X, Mail, Phone, Zap, MessageSquare, Briefcase, Info, Shield, CheckCircle, Pencil, Trash2,
    MapPin, Award, Globe, Heart, UserCheck, Handshake, Users, Building2, Package, Newspaper,
    DollarSign, BrainCircuit, Calendar,
} from 'lucide-react';
import Spinner from '../../common/Spinner';
import { generateAiContent, parseAiJson } from '../../../lib/ai';
import { formatDate } from '../../../lib/utils';

interface StakeholderDetailPanelProps {
    stakeholder: Stakeholder | null;
    onClose: () => void;
    onSave: (stakeholderId: Stakeholder['id'], updates: Partial<Stakeholder>) => Promise<void>;
    onDelete: (stakeholderId: Stakeholder['id']) => Promise<void>;
}

interface AiSuggestion {
    suggestion: string;
    rationale: string;
}

const TYPE_ICONS: Record<StakeholderType, React.ElementType> = {
    donor: Heart,
    beneficiary: UserCheck,
    partner: Handshake,
    volunteer: Users,
    mentor: UserCheck,
    expert: BrainCircuit,
    investor: DollarSign,
    board_member: Shield,
    government: Building2,
    supplier: Package,
    community: Globe,
    media: Newspaper,
};

const Gauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const size = 64;
    const stroke = 6;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const ringColor = value >= 80 ? 'stroke-green-500' : value >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
    const textColor = value >= 80
        ? 'text-green-600 dark:text-green-400'
        : value >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        className="text-gray-200 dark:text-slate-700"
                        strokeWidth={stroke}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={`transition-all duration-700 ${ringColor}`}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${textColor}`}>{value}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</span>
        </div>
    );
};

const ContactRow: React.FC<{ icon: React.ReactNode; value: string }> = ({ icon, value }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700/60 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {icon}
        </div>
        <span className="text-foreground dark:text-dark-foreground break-all">{value || 'N/A'}</span>
    </div>
);

const StatChip: React.FC<{ icon: React.ReactNode; label: string; value: string; valueClass?: string }> = ({ icon, label, value, valueClass = 'text-foreground dark:text-dark-foreground' }) => (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-slate-800/60 px-2 py-3 text-center">
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
        <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
    </div>
);

const ContactHistoryItem: React.FC<{ icon: React.ReactNode; title: string; date: string }> = ({ icon, title, date }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center text-primary dark:text-secondary">{icon}</div>
        <div>
            <p className="font-semibold text-sm text-foreground dark:text-dark-foreground">{title}</p>
            <p className="text-xs text-gray-500">{date}</p>
        </div>
    </div>
);

const StakeholderDetailPanel: React.FC<StakeholderDetailPanelProps> = ({ stakeholder, onClose, onSave, onDelete }) => {
    const { t, language, dir } = useLocalization();
    const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [draft, setDraft] = useState<{
        name: { en: string; ar: string };
        type: StakeholderType;
        category: StakeholderCategoryKey;
        status: Stakeholder['status'];
        classification: Stakeholder['classification'];
        email: string;
        phone: string;
        country: string;
    }>({
        name: { en: '', ar: '' },
        type: 'donor',
        category: 'foundation',
        status: 'active',
        classification: 'primary',
        email: '',
        phone: '',
        country: '',
    });

    useEffect(() => {
        if (!stakeholder) return;
        setDraft({
            name: stakeholder.name,
            type: stakeholder.type,
            category: stakeholder.category,
            status: stakeholder.status,
            classification: stakeholder.classification,
            email: stakeholder.email,
            phone: stakeholder.phone,
            country: stakeholder.country,
        });
        setIsEditing(false);
        setAiSuggestions([]);
        setError(null);
    }, [stakeholder]);

    const handleGenerateSuggestions = async () => {
        if (!stakeholder) return;
        setIsLoading(true);
        setError(null);
        setAiSuggestions([]);

        try {
            const systemInstruction = `You are a professional non-profit relationship manager. Based on the stakeholder data provided, generate 2-3 concise, actionable next steps to improve or maintain the relationship. Respond in the language of the user's request, which is ${language}. Your response MUST be a valid JSON object with a single key 'suggestions' which is an array of objects. Each object in the array must have two keys: 'suggestion' (a string) and 'rationale' (a string). Do not include any text outside of the JSON object, including markdown fences.`;

            const prompt = `User's language: ${language}. Stakeholder Data: ${JSON.stringify({
                name: stakeholder.name[language], type: stakeholder.type, healthScore: stakeholder.healthScore, riskLevel: stakeholder.riskLevel, lastContact: stakeholder.lastContact, engagementScore: stakeholder.engagementScore
            })}`;

            const responseText = await generateAiContent({
                contents: prompt,
                systemInstruction,
                responseMimeType: "application/json",
            });

            const result = parseAiJson<{ suggestions?: AiSuggestion[] }>(responseText);
            setAiSuggestions(result.suggestions || []);

        } catch (err) {
            console.error("Error generating suggestions:", err);
            setError(t('stakeholder_management.detailPanel.suggestionsError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!stakeholder) return;
        if (!draft.name.en && !draft.name.ar) return;

        setIsSaving(true);
        try {
            await onSave(stakeholder.id, {
                name: {
                    en: draft.name.en || draft.name.ar,
                    ar: draft.name.ar || draft.name.en,
                },
                type: draft.type,
                category: draft.category,
                status: draft.status,
                classification: draft.classification,
                email: draft.email,
                phone: draft.phone,
                country: draft.country,
            });
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!stakeholder) return;
        setIsDeleting(true);
        try {
            await onDelete(stakeholder.id);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!stakeholder) {
        return <ModalPortal isOpen={false} onClose={onClose} dir={dir}>{null}</ModalPortal>;
    }

    const TypeIcon = TYPE_ICONS[stakeholder.type] || Users;
    const secondaryLang = language === 'ar' ? 'en' : 'ar';
    const secondaryName = stakeholder.name[secondaryLang];
    const primaryName = stakeholder.name[language] || stakeholder.name.en || stakeholder.name.ar;

    const statusConfig: Record<Stakeholder['status'], { dot: string }> = {
        active: { dot: 'bg-green-400' },
        pending: { dot: 'bg-amber-400' },
        inactive: { dot: 'bg-gray-400' },
    };

    const riskProfileConfig = {
        supporter: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: t('stakeholder_management.riskProfile.supporter'), valueClass: 'text-green-600 dark:text-green-400' },
        neutral: { icon: <Info className="w-4 h-4 text-gray-500" />, text: t('stakeholder_management.riskProfile.neutral'), valueClass: 'text-gray-600 dark:text-gray-300' },
        blocker: { icon: <Shield className="w-4 h-4 text-red-500" />, text: t('stakeholder_management.riskProfile.blocker'), valueClass: 'text-red-600 dark:text-red-400' },
    };

    const riskLevelClass = stakeholder.riskLevel === 'high'
        ? 'text-red-600 dark:text-red-400'
        : stakeholder.riskLevel === 'medium'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

    const levelClass = stakeholder.relationshipLevel === 'strategic'
        ? 'text-purple-600 dark:text-purple-400'
        : stakeholder.relationshipLevel === 'core'
        ? 'text-primary dark:text-secondary'
        : 'text-gray-600 dark:text-gray-300';

    const sectionTitle = 'text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3';

    return (
        <ModalPortal isOpen={!!stakeholder} onClose={onClose} dir={dir}>
            <div
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero header */}
                <header className="relative flex-shrink-0 bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                                <TypeIcon className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold leading-tight line-clamp-2">{primaryName}</h2>
                                {secondaryName && secondaryName !== primaryName && (
                                    <p className="text-sm text-white/70 truncate" dir={secondaryLang === 'ar' ? 'rtl' : 'ltr'}>{secondaryName}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15">
                                        {t(`stakeholder_management.types.${stakeholder.type}`)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[stakeholder.status].dot}`} />
                                        {t(`stakeholder_management.statuses.${stakeholder.status}`)}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15">
                                        {t(`stakeholder_management.classification.${stakeholder.classification}`)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setDraft({
                                                name: stakeholder.name,
                                                type: stakeholder.type,
                                                category: stakeholder.category,
                                                status: stakeholder.status,
                                                classification: stakeholder.classification,
                                                email: stakeholder.email,
                                                phone: stakeholder.phone,
                                                country: stakeholder.country,
                                            });
                                            setIsEditing(false);
                                        }}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-primary hover:bg-white/90 disabled:opacity-60 transition-colors"
                                    >
                                        {isSaving ? t('common.saving') : t('stakeholder_management.actions.saveChanges')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                        title={t('stakeholder_management.actions.edit')}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/80 transition-colors disabled:opacity-60"
                                        title={t('stakeholder_management.actions.delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title={t('common.cancel')}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {isEditing ? (
                        <section>
                            <h3 className={sectionTitle}>{t('stakeholder_management.detailPanel.summary')}</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.name_ar')}</label>
                                    <input
                                        dir="rtl"
                                        value={draft.name.ar}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, name: { ...prev.name, ar: e.target.value } }))}
                                        className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.name_en')}</label>
                                    <input
                                        value={draft.name.en}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, name: { ...prev.name, en: e.target.value } }))}
                                        className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.type')}</label>
                                        <select
                                            value={draft.type}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as StakeholderType }))}
                                            className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                        >
                                            <option value="donor">{t('stakeholder_management.types.donor')}</option>
                                            <option value="beneficiary">{t('stakeholder_management.types.beneficiary')}</option>
                                            <option value="partner">{t('stakeholder_management.types.partner')}</option>
                                            <option value="volunteer">{t('stakeholder_management.types.volunteer')}</option>
                                            <option value="mentor">{t('stakeholder_management.types.mentor')}</option>
                                            <option value="expert">{t('stakeholder_management.types.expert')}</option>
                                            <option value="investor">{t('stakeholder_management.types.investor')}</option>
                                            <option value="board_member">{t('stakeholder_management.types.board_member')}</option>
                                            <option value="government">{t('stakeholder_management.types.government')}</option>
                                            <option value="supplier">{t('stakeholder_management.types.supplier')}</option>
                                            <option value="community">{t('stakeholder_management.types.community')}</option>
                                            <option value="media">{t('stakeholder_management.types.media')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.category')}</label>
                                        <select
                                            value={draft.category}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value as StakeholderCategoryKey }))}
                                            className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                        >
                                            <option value="foundation">{t('stakeholder_management.add_modal.categories.foundation')}</option>
                                            <option value="family">{t('stakeholder_management.add_modal.categories.family')}</option>
                                            <option value="company">{t('stakeholder_management.add_modal.categories.company')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.detailPanel.status')}</label>
                                        <select
                                            value={draft.status}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as Stakeholder['status'] }))}
                                            className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                        >
                                            <option value="active">{t('stakeholder_management.statuses.active')}</option>
                                            <option value="inactive">{t('stakeholder_management.statuses.inactive')}</option>
                                            <option value="pending">{t('stakeholder_management.statuses.pending')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.classificationLabel')}</label>
                                        <select
                                            value={draft.classification}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, classification: e.target.value as Stakeholder['classification'] }))}
                                            className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                        >
                                            <option value="primary">{t('stakeholder_management.classification.primary')}</option>
                                            <option value="secondary">{t('stakeholder_management.classification.secondary')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.email')}</label>
                                    <input
                                        type="email"
                                        value={draft.email}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.phone')}</label>
                                    <input
                                        value={draft.phone}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('stakeholder_management.add_modal.country')}</label>
                                    <input
                                        value={draft.country}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, country: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-200 p-2 dark:bg-slate-800 dark:border-slate-700 focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </section>
                    ) : (
                        <>
                            {/* Contact information */}
                            <section>
                                <h3 className={sectionTitle}>{t('stakeholder_management.detailPanel.summary')}</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <ContactRow icon={<Mail size={16} />} value={stakeholder.email} />
                                    <ContactRow icon={<Phone size={16} />} value={stakeholder.phone} />
                                    <ContactRow icon={<MapPin size={16} />} value={stakeholder.country} />
                                    <ContactRow icon={<Calendar size={16} />} value={`${t('stakeholder_management.table.lastContact')}: ${formatDate(stakeholder.lastContact, language)}`} />
                                </div>
                            </section>

                            {/* Relationship metrics */}
                            <section>
                                <h3 className={sectionTitle}>{t('stakeholder_management.detailPanel.metrics')}</h3>
                                <div className="grid grid-cols-4 gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                                    <Gauge value={stakeholder.healthScore} label={t('stakeholder_management.card.health')} />
                                    <Gauge value={stakeholder.engagementScore} label={t('stakeholder_management.card.engagement')} />
                                    <Gauge value={stakeholder.power} label={t('stakeholder_management.card.power')} />
                                    <Gauge value={stakeholder.interest} label={t('stakeholder_management.card.interest')} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    <StatChip
                                        icon={<Award size={18} />}
                                        label={t('stakeholder_management.table.level')}
                                        value={t(`stakeholder_management.relationshipLevels.${stakeholder.relationshipLevel}`)}
                                        valueClass={levelClass}
                                    />
                                    <StatChip
                                        icon={<Shield size={18} />}
                                        label={t('stakeholder_management.table.risks')}
                                        value={t(`stakeholder_management.risks.${stakeholder.riskLevel}`)}
                                        valueClass={riskLevelClass}
                                    />
                                    <StatChip
                                        icon={riskProfileConfig[stakeholder.riskProfile].icon}
                                        label={t('stakeholder_management.riskProfileLabel')}
                                        value={riskProfileConfig[stakeholder.riskProfile].text}
                                        valueClass={riskProfileConfig[stakeholder.riskProfile].valueClass}
                                    />
                                </div>
                            </section>

                            {/* Needs */}
                            {stakeholder.needs.length > 0 && (
                                <section>
                                    <h3 className={sectionTitle}>{t('stakeholder_management.card.needs')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {stakeholder.needs.map(need => (
                                            <span key={need} className="text-xs px-3 py-1 bg-primary-light text-primary-dark dark:bg-primary/20 dark:text-secondary-light rounded-full font-medium">
                                                {need}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Contact history */}
                            <section>
                                <h3 className={sectionTitle}>{t('stakeholder_management.detailPanel.contactHistory')}</h3>
                                <div className="space-y-3">
                                    <ContactHistoryItem icon={<MessageSquare size={16} />} title={t('stakeholder_management.detailPanel.contact_types.email')} date={t('stakeholder_management.timeAgo.twoWeeks')} />
                                    <ContactHistoryItem icon={<Briefcase size={16} />} title={t('stakeholder_management.detailPanel.contact_types.meeting')} date={t('stakeholder_management.timeAgo.oneMonth')} />
                                    <ContactHistoryItem icon={<Phone size={16} />} title={t('stakeholder_management.detailPanel.contact_types.call')} date={t('stakeholder_management.timeAgo.threeMonths')} />
                                </div>
                            </section>

                            {/* AI action center */}
                            <section>
                                <h3 className={sectionTitle}>{t('stakeholder_management.detailPanel.aiActionCenter')}</h3>
                                <div className="bg-primary-light/40 dark:bg-primary/10 p-4 rounded-xl text-center space-y-3">
                                    {!isLoading && aiSuggestions.length === 0 && !error && (
                                        <button onClick={handleGenerateSuggestions} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"><Zap size={16} /> {t('stakeholder_management.detailPanel.generateSuggestions')}</button>
                                    )}
                                    {isLoading && <Spinner text={t('stakeholder_management.detailPanel.generating')} />}
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    {aiSuggestions.length > 0 && (
                                        <div className="space-y-3 text-start">
                                            {aiSuggestions.map((s, i) => (
                                                <div key={i} className="bg-card dark:bg-dark-card p-3 rounded-lg border border-gray-100 dark:border-slate-700/50">
                                                    <p className="font-semibold text-sm text-foreground dark:text-dark-foreground">{s.suggestion}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{s.rationale}</p>
                                                </div>
                                            ))}
                                            <button onClick={handleGenerateSuggestions} className="w-full text-xs font-semibold text-primary mt-1">{t('smart_messaging.preview.regenerate')}</button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default StakeholderDetailPanel;
