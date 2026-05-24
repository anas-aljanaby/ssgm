

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { OPTIMISTIC_HIGHLIGHT_MS, simulateLocalPersist } from '../../lib/optimisticSubmit';
import {
    buildOptimisticStakeholder,
    isOptimisticStakeholder,
    nextStakeholderNumericId,
} from '../../lib/stakeholderOptimistic';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { MOCK_STAKEHOLDERS } from '../../data/stakeholderData';
import type { Stakeholder, StakeholderType } from '../../types';
import { formatNumber, formatDate } from '../../lib/utils';
import AddStakeholderModal from './stakeholders/AddStakeholderModal';
import StakeholderDetailPanel from './stakeholders/StakeholderDetailPanel';
import StakeholderMatrix from './stakeholders/StakeholderMatrix';
import StakeholderCard from './stakeholders/StakeholderCard';
import { Users, Activity, AlertCircle, Shield, Heart, Building2, Handshake, UserCheck, Globe, Package, Newspaper, Search, Filter, Download, Plus, RefreshCw, Eye, Edit, Trash2, Calendar, Award, Zap, List, LayoutGrid, BarChart2, DollarSign, BrainCircuit } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useTabParam } from '../../hooks/useTabParam';
import { MicrophoneIcon } from '../icons/AiIcons';

// Add SpeechRecognition type definition
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
}
declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition; };
        webkitSpeechRecognition: { new(): SpeechRecognition; };
    }
}

const STAKEHOLDER_VIEW_TABS = ['table', 'card', 'matrix'] as const;

const StakeholderManagement: React.FC = () => {
    const { t, language } = useLocalization(['common', 'stakeholders', 'misc']);
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>(MOCK_STAKEHOLDERS);
    const [selectedCategory, setSelectedCategory] = useState<StakeholderType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
    const [view, setView] = useTabParam('tab', 'card', STAKEHOLDER_VIEW_TABS);
    const [highlightedId, setHighlightedId] = useState<Stakeholder['id'] | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Voice Search State
    const toast = useToast();
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Speech Recognition Setup Effect
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError(t('stakeholder_management.voice.notSupported'));
            return;
        }
        
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                const errorMsg = t('stakeholder_management.voice.permissionDenied');
                setMicError(errorMsg);
                toast.showError(errorMsg);
            }
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setSearchQuery(transcript);
        };
        
        recognitionRef.current = recognition;
    }, [toast, t]);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: Stakeholder['id']) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    const handleListen = useCallback(() => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }
        setMicError(null); // Reset error on new attempt
        const langCode = { en: 'en-US', ar: 'ar-SA' }[language] || 'en-US';
        recognitionRef.current.lang = langCode;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Speech recognition start error:", e);
            const errorMsg = t('stakeholder_management.voice.startError');
            setMicError(errorMsg);
            toast.showError(errorMsg);
        }
    }, [isListening, language, toast]);


    const stakeholderTypes = useMemo(() => [
        { id: 'all', icon: Users },
        { id: 'donor', icon: Heart },
        { id: 'beneficiary', icon: UserCheck },
        { id: 'partner', icon: Handshake },
        { id: 'volunteer', icon: Users },
        { id: 'mentor', icon: UserCheck },
        { id: 'expert', icon: BrainCircuit },
        { id: 'investor', icon: DollarSign },
        { id: 'board_member', icon: Shield },
        { id: 'government', icon: Building2 },
        { id: 'supplier', icon: Package },
        { id: 'community', icon: Globe },
        { id: 'media', icon: Newspaper }
    ] as const, []);

    const stats = useMemo(() => {
        const avgHealthScore = stakeholders.reduce((sum, s) => sum + s.healthScore, 0) / (stakeholders.length || 1);
        const needsAttention = stakeholders.filter(s => s.healthScore < 80).length;
        const highRisk = stakeholders.filter(s => s.riskLevel === 'high').length;
        return { total: stakeholders.length, avgHealthScore, needsAttention, highRisk };
    }, [stakeholders]);

    const filteredStakeholders = useMemo(() => {
        const optimistic = stakeholders.filter((s) => isOptimisticStakeholder(s.id));
        const rest = stakeholders.filter((s) => !isOptimisticStakeholder(s.id));
        const filtered = rest.filter(s => {
            const matchesCategory = selectedCategory === 'all' || s.type === selectedCategory;
            const name = s.name[language] || s.name.en;
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        return [...optimistic, ...filtered];
    }, [stakeholders, selectedCategory, searchQuery, language]);
    
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'yellow';
        return 'red';
    };

    const getRiskColor = (level: string) => {
        if (level === 'low') return 'green';
        if (level === 'medium') return 'yellow';
        return 'red';
    };

    const handleAddStakeholder = (data: Pick<Stakeholder, 'name' | 'type' | 'category' | 'country' | 'email' | 'phone'>) => {
        const optimistic = buildOptimisticStakeholder(data);
        setStakeholders(prev => [optimistic, ...prev]);

        void simulateLocalPersist((): Stakeholder => ({
            ...optimistic,
            id: nextStakeholderNumericId(stakeholders),
        })).then((created) => {
            setStakeholders(prev => prev.map(s => (s.id === optimistic.id ? created : s)));
            flashHighlight(created.id);
            toast.showSuccess(t('stakeholder_management.add_modal.success', 'Stakeholder added'));
        }).catch(() => {
            setStakeholders(prev => prev.filter(s => s.id !== optimistic.id));
            toast.showError(t('common.error', 'Error'));
        });
    };
    
    const ViewButton: React.FC<{ viewType: 'table' | 'card' | 'matrix'; icon: React.ReactNode; }> = ({ viewType, icon }) => (
        <button onClick={() => setView(viewType)} title={t(`stakeholder_management.view.${viewType}`)} className={`p-1.5 rounded-md ${view === viewType ? 'bg-white dark:bg-slate-800 shadow' : 'hover:bg-gray-200/50'}`}>
            {icon}
        </button>
    );

    return (
        <>
            <AddStakeholderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddStakeholder} />
            <StakeholderDetailPanel stakeholder={selectedStakeholder} onClose={() => setSelectedStakeholder(null)} />

            <div className="min-h-full bg-gray-50 dark:bg-dark-background p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-3 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-foreground">{t('stakeholder_management.title')}</h1>
                            <p className="text-sm text-gray-500">{t('stakeholder_management.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button className="px-4 py-2 bg-card dark:bg-dark-card border dark:border-slate-600 text-foreground dark:text-dark-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"><Download className="w-4 h-4" /><span>{t('stakeholder_management.export')}</span></button>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"><Plus className="w-4 h-4" /><span>{t('stakeholder_management.addNew')}</span></button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title={t('stakeholder_management.totalStakeholders')} value={stats.total} icon={<Users />} borderColor="border-blue-500" />
                    <StatCard title={t('stakeholder_management.avgRelationshipHealth')} value={`${stats.avgHealthScore.toFixed(0)}%`} icon={<Activity />} borderColor="border-green-500" />
                    <StatCard title={t('stakeholder_management.needsAttention')} value={stats.needsAttention} icon={<AlertCircle />} borderColor="border-yellow-500" />
                    <StatCard title={t('stakeholder_management.highRisks')} value={stats.highRisk} icon={<Shield />} borderColor="border-red-500" />
                </div>

                {/* Category Tabs */}
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft p-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {stakeholderTypes.map(type => {
                            const Icon = type.icon;
                            const isActive = selectedCategory === type.id;
                            const count = type.id === 'all' ? stats.total : stakeholders.filter(s => s.type === type.id).length;
                            return (
                                <button key={type.id} onClick={() => setSelectedCategory(type.id)} className={`flex items-center gap-2 px-4 py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold">{t(`stakeholder_management.types.${type.id}`)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white bg-opacity-20' : 'bg-gray-200 dark:bg-slate-700'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={isListening ? t('common.listening') : t('stakeholder_management.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2 pl-10 pr-10 border-2 border-gray-200 dark:border-slate-700 rounded-lg focus:border-primary focus:outline-none bg-white dark:bg-slate-800"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                <button
                                    onClick={handleListen}
                                    disabled={!!micError}
                                    title={micError || t('common.voiceSearch')}
                                    className={`p-2 rounded-full transition-colors disabled:text-gray-400 disabled:cursor-not-allowed ${
                                        isListening
                                            ? 'text-red-500 bg-red-100 dark:bg-red-900/50 animate-pulse'
                                            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-1 bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center">
                            <ViewButton viewType="table" icon={<List />} />
                            <ViewButton viewType="card" icon={<LayoutGrid />} />
                            <ViewButton viewType="matrix" icon={<BarChart2 />} />
                        </div>
                        <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-foreground dark:text-dark-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center gap-2"><Filter className="w-5 h-5" /><span>{t('stakeholder_management.filter')}</span></button>
                    </div>
                </div>

                {/* Content Area */}
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {view === 'table' && (
                            <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-700">
                                            <tr>
                                                {['name', 'type', 'relationshipHealth', 'level', 'risks', 'lastContact', 'aiInsights', 'actions'].map(header => (
                                                    <th key={header} className="px-6 py-4 text-start text-sm font-bold text-gray-700 dark:text-gray-300">{t(`stakeholder_management.table.${header}`)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {filteredStakeholders.map((stakeholder) => {
                                                const typeInfo = stakeholderTypes.find(t => t.id === stakeholder.type);
                                                const TypeIcon = typeInfo?.icon || Users;
                                                const healthColor = getHealthColor(stakeholder.healthScore);
                                                const riskColor = getRiskColor(stakeholder.riskLevel);
                                                const optimistic = isOptimisticStakeholder(stakeholder.id);
                                                const highlighted = highlightedId === stakeholder.id;
                                                return (
                                                    <tr
                                                        key={stakeholder.id}
                                                        className={`hover:bg-primary-light/20 dark:hover:bg-primary/10 ${
                                                            optimistic
                                                                ? 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30'
                                                                : highlighted
                                                                  ? 'bg-emerald-50 dark:bg-emerald-950/40'
                                                                  : ''
                                                        }`}
                                                    >
                                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`bg-primary/20 p-2 rounded-lg`}><TypeIcon className="w-5 h-5 text-primary" /></div><div><p className="font-semibold text-gray-800 dark:text-dark-foreground">{stakeholder.name[language]}</p><p className="text-xs text-gray-500">{optimistic ? t('common.saving') : stakeholder.name.en}</p></div></div></td>
                                                        <td className="px-6 py-4"><span className={`px-3 py-1 bg-primary-light text-primary-dark rounded-full text-xs font-semibold`}>{t(`stakeholder_management.types.${stakeholder.type}`)}</span></td>
                                                        <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 max-w-24"><div className={`h-full bg-${healthColor}-500 rounded-full`} style={{ width: `${stakeholder.healthScore}%` }} /></div><span className={`font-bold text-sm text-${healthColor}-600`}>{stakeholder.healthScore}%</span></div></td>
                                                        <td className="px-6 py-4"><Award className={`w-5 h-5 ${stakeholder.relationshipLevel === 'strategic' ? 'text-purple-600' : stakeholder.relationshipLevel === 'core' ? 'text-primary' : 'text-gray-600'}`} title={t(`stakeholder_management.relationshipLevels.${stakeholder.relationshipLevel}`)} /></td>
                                                        <td className="px-6 py-4"><span className={`px-2 py-1 bg-${riskColor}-100 text-${riskColor}-800 rounded text-xs font-semibold`}>{t(`stakeholder_management.risks.${stakeholder.riskLevel}`)}</span></td>
                                                        <td className="px-6 py-4 text-sm text-gray-600"><div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{formatDate(stakeholder.lastContact, language)}</span></div></td>
                                                        <td className="px-6 py-4"><div className="flex items-start gap-2 max-w-xs"><Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-gray-600 dark:text-gray-400">{optimistic ? t('common.saving') : t(stakeholder.aiInsights)}</p></div></td>
                                                        <td className="px-6 py-4">{optimistic ? <span className="text-xs text-gray-400">—</span> : (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setSelectedStakeholder(stakeholder)} className="p-2 hover:bg-primary-light rounded-lg"><Eye className="w-4 h-4 text-primary" /></button>
                                                            <button className="p-2 hover:bg-green-100 rounded-lg"><Edit className="w-4 h-4 text-green-600" /></button>
                                                            <button className="p-2 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                                                        </div>)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {view === 'card' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredStakeholders.map(stakeholder => (
                                    <StakeholderCard
                                        key={stakeholder.id}
                                        stakeholder={stakeholder}
                                        highlighted={highlightedId === stakeholder.id}
                                        onClick={() => {
                                            if (isOptimisticStakeholder(stakeholder.id)) return;
                                            setSelectedStakeholder(stakeholder);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {view === 'matrix' && (
                            <StakeholderMatrix stakeholders={filteredStakeholders} onSelect={setSelectedStakeholder} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; borderColor: string; }> = ({ title, value, icon, borderColor }) => (
    <div className={`bg-card dark:bg-dark-card rounded-xl shadow-soft p-5 border-r-4 ${borderColor}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-dark-foreground mt-1">{value}</p>
            </div>
            <div className="p-3 rounded-lg">
                {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8 text-gray-500" })}
            </div>
        </div>
    </div>
);

export default StakeholderManagement;
