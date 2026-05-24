
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { OPTIMISTIC_HIGHLIGHT_MS, simulateLocalPersist } from '../../lib/optimisticSubmit';
import { buildOptimisticInstitution, isOptimisticInstitution } from '../../lib/institutionOptimistic';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { MOCK_INSTITUTIONAL_DONORS } from '../../data/institutionalDonorsData';
import type { InstitutionalDonor, SortDirection, InstitutionType } from '../../types';
import InstitutionalDonorsControls from './donors_institutional/InstitutionalDonorsControls';
import AdvancedFilterPanelInstitutional, {
    DEFAULT_INSTITUTIONAL_DONOR_FILTERS,
    type InstitutionalDonorFilters,
} from './donors_institutional/AdvancedFilterPanelInstitutional';
import InstitutionalDonorsTable from './donors_institutional/InstitutionalDonorsTable';
import InstitutionalDonorCard from './donors_institutional/InstitutionalDonorCard';
import InstitutionalDonorDetailView from './donors_institutional/InstitutionalDonorDetailView';
import AddInstitutionModal from './donors_institutional/AddInstitutionModal';
import { InstitutionalDonorsMap } from './donors_institutional/InstitutionalDonorsMap';
import { useCountUp } from '../../hooks/useCountUp';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { DollarSign, Filter, AlertTriangle, CalendarClock } from 'lucide-react';
import PartnershipOpportunitiesTab from './donors_institutional/PartnershipOpportunitiesTab';
import { clearDonorDocumentsCache } from './donors_institutional/DocumentsTab';

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


const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; }> = ({ title, value, icon, subtext }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex items-center gap-4">
        <div className="p-3 bg-primary-light dark:bg-primary/20 text-primary dark:text-secondary rounded-lg">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h4>
            <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
    </div>
);

const SmartAnalyticsDashboard: React.FC<{donors: InstitutionalDonor[]}> = ({donors}) => {
    const { t, language } = useLocalization(['common', 'donors', 'institutional_donors', 'misc']);

    const stats = useMemo(() => {
        const totalFunding = donors.reduce((sum, d) => sum + d.totalGrantsAwarded, 0);
        const pipelineValue = donors
            .filter(d => d.relationshipStatus === 'Prospect' || d.relationshipStatus === 'Cultivating')
            .reduce((sum, d) => sum + d.totalGrantsAwarded, 0);
        const highPriorityCount = donors.filter(d => d.priority === 'High').length;
        
        const now = new Date();
        const ninetyDaysFromNow = new Date(new Date().setDate(now.getDate() + 90));
        const upcomingDeadlines = donors.filter(d => d.nextDeadline && new Date(d.nextDeadline) <= ninetyDaysFromNow).length;

        return { totalFunding, pipelineValue, highPriorityCount, upcomingDeadlines };
    }, [donors]);

    const animatedFunding = useCountUp(stats.totalFunding);
    const animatedPipeline = useCountUp(stats.pipelineValue);
    const animatedHighPriority = useCountUp(stats.highPriorityCount);
    const animatedDeadlines = useCountUp(stats.upcomingDeadlines);
    
    return (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
                title={t('institutional_donors.analytics.totalFunding')}
                value={formatCurrency(animatedFunding, language)}
                icon={<DollarSign />}
            />
            <KpiCard 
                title={t('institutional_donors.analytics.pipelineValue')}
                value={formatCurrency(animatedPipeline, language)}
                icon={<Filter />}
            />
            <KpiCard 
                title={t('institutional_donors.analytics.highPriority')}
                value={formatNumber(animatedHighPriority, language)}
                icon={<AlertTriangle />}
            />
            <KpiCard 
                title={t('institutional_donors.analytics.upcomingDeadlines')}
                value={formatNumber(animatedDeadlines, language)}
                subtext={t('institutional_donors.analytics.next90days')}
                icon={<CalendarClock />}
            />
        </div>
    );
};


const InstitutionalDonors: React.FC = () => {
    const { t, language } = useLocalization(['common', 'donors', 'institutional_donors', 'misc']);
    const toast = useToast();
    const [donors, setDonors] = useState<InstitutionalDonor[]>(MOCK_INSTITUTIONAL_DONORS);
    const [view, setView] = useState<'list' | 'card' | 'map' | 'opportunities'>('list');
    const [selectedDonor, setSelectedDonor] = useState<InstitutionalDonor | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterDraft, setFilterDraft] = useState<InstitutionalDonorFilters>(DEFAULT_INSTITUTIONAL_DONOR_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<InstitutionalDonorFilters>(DEFAULT_INSTITUTIONAL_DONOR_FILTERS);
    const [sortColumn, setSortColumn] = useState<keyof InstitutionalDonor | null>('nextDeadline');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Voice Search State
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Speech Recognition Setup Effect
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError(t('institutional_donors.errors.speechNotSupported'));
            return;
        }
        
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                const errorMsg = t('institutional_donors.errors.micDenied');
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
            setSearchTerm(transcript);
        };
        
        recognitionRef.current = recognition;
    }, [toast, language, t]);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: string) => {
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
        const langCode = { en: 'en-US', ar: 'ar-SA' }[language];
        recognitionRef.current.lang = langCode;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Speech recognition start error:", e);
            const errorMsg = t('institutional_donors.errors.speechStartFailed');
            setMicError(errorMsg);
            toast.showError(errorMsg);
        }
    }, [isListening, language, toast, t]);
    
    const getSortPriority = (type: InstitutionType) => {
        if (type === 'Multilateral') return 1;
        if (type === 'Government') return 2;
        return 3;
    };

    const existingCountries = useMemo(
        () => Array.from(new Set(donors.map((d) => d.country).filter(Boolean))).sort(),
        [donors],
    );

    const filteredAndSortedDonors = useMemo(() => {
        const optimistic = donors.filter((d) => isOptimisticInstitution(d.id));
        const rest = donors.filter((d) => !isOptimisticInstitution(d.id));

        const focusQuery = appliedFilters.grantFocusArea.trim().toLowerCase();

        let filtered = rest.filter(donor => {
            const searchLower = searchTerm.toLowerCase();
            const orgName = donor.organizationName[language] || donor.organizationName.en;
            const matchesSearch = orgName.toLowerCase().includes(searchLower) ||
                   donor.primaryContact.name.toLowerCase().includes(searchLower) ||
                   donor.focusAreas.some(area => area.toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;

            if (appliedFilters.institutionType !== 'all' && donor.type !== appliedFilters.institutionType) {
                return false;
            }
            if (appliedFilters.relationshipStatus !== 'all' && donor.relationshipStatus !== appliedFilters.relationshipStatus) {
                return false;
            }
            if (appliedFilters.priority !== 'all' && donor.priority !== appliedFilters.priority) {
                return false;
            }
            if (focusQuery && !donor.focusAreas.some((area) => area.toLowerCase().includes(focusQuery))) {
                return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            const priorityA = getSortPriority(a.type);
            const priorityB = getSortPriority(b.type);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            if (sortColumn) {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }
                
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                     if (sortColumn === 'nextDeadline' || sortColumn === 'lastContactDate' || sortColumn === 'createdDate') {
                         if (!aVal) return 1;
                         if (!bVal) return -1;
                        return sortDirection === 'asc' ? new Date(aVal).getTime() - new Date(bVal).getTime() : new Date(bVal).getTime() - new Date(aVal).getTime();
                    }
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                if (sortColumn === 'organizationName') {
                     const aName = a.organizationName[language] || a.organizationName.en;
                     const bName = b.organizationName[language] || b.organizationName.en;
                     return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }
            }
            
            return 0;
        });

        return [...optimistic, ...filtered];
    }, [donors, searchTerm, appliedFilters, sortColumn, sortDirection, language]);

    const handleSort = useCallback((column: keyof InstitutionalDonor) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    const handleAddInstitution = async (newDonorData: Omit<InstitutionalDonor, 'id' | 'logo' | 'totalGrantsAwarded' | 'activeGrants' | 'nextDeadline' | 'lastContactDate' | 'assignedManager' | 'createdDate'>) => {
        const optimistic = buildOptimisticInstitution(newDonorData);
        const realCount = donors.filter((d) => !isOptimisticInstitution(d.id)).length;
        setDonors(prev => [optimistic, ...prev]);

        try {
            const created = await simulateLocalPersist((): InstitutionalDonor => ({
                ...optimistic,
                id: `G-${String(realCount + 1).padStart(5, '0')}`,
            }));
            setDonors(prev => prev.map(d => (d.id === optimistic.id ? created : d)));
            flashHighlight(created.id);
            toast.showSuccess(t('institutional_donors.addInstitutionSuccess'));
        } catch {
            setDonors(prev => prev.filter(d => d.id !== optimistic.id));
            toast.showError(t('institutional_donors.errors.generic'));
            throw new Error('add institution failed');
        }
    };

    const handleDonorUpdated = useCallback((updated: InstitutionalDonor) => {
        setDonors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setSelectedDonor(updated);
    }, []);

    const handleDeleteInstitution = useCallback((donor: InstitutionalDonor) => {
        if (isOptimisticInstitution(donor.id)) return;
        const orgName = donor.organizationName[language] || donor.organizationName.en;
        if (!window.confirm(t('institutional_donors.deleteInstitutionConfirm', { name: orgName }))) {
            return;
        }
        setDonors((prev) => prev.filter((d) => d.id !== donor.id));
        clearDonorDocumentsCache(donor.id);
        if (selectedDonor?.id === donor.id) {
            setSelectedDonor(null);
        }
        toast.showInfo(t('institutional_donors.institutionDeleted'));
    }, [language, selectedDonor?.id, t, toast]);

    if (selectedDonor) {
        return (
            <InstitutionalDonorDetailView
                donor={selectedDonor}
                onBack={() => setSelectedDonor(null)}
                onDonorUpdated={handleDonorUpdated}
                existingCountries={existingCountries}
            />
        );
    }

    return (
        <>
            <AddInstitutionModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddInstitution}
                existingCountries={existingCountries}
            />
            <div className="flex flex-col h-full animate-fade-in">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-4">
                    {t('institutional_donors.title')}
                </h1>

                <SmartAnalyticsDashboard donors={donors} />
                
                <InstitutionalDonorsControls
                    view={view}
                    onViewChange={setView}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAddInstitution={() => setIsAddModalOpen(true)}
                    onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
                    isListening={isListening}
                    handleListen={handleListen}
                    micError={micError}
                />

                <AdvancedFilterPanelInstitutional
                    isOpen={filtersOpen}
                    filters={filterDraft}
                    onFiltersChange={setFilterDraft}
                    onApply={() => setAppliedFilters(filterDraft)}
                    onClear={() => {
                        setFilterDraft(DEFAULT_INSTITUTIONAL_DONOR_FILTERS);
                        setAppliedFilters(DEFAULT_INSTITUTIONAL_DONOR_FILTERS);
                    }}
                />

                <div className="flex-grow overflow-auto">
                     {view === 'list' && (
                         <InstitutionalDonorsTable
                            donors={filteredAndSortedDonors}
                            highlightedId={highlightedId}
                            onDonorSelect={(donor) => {
                                if (isOptimisticInstitution(donor.id)) return;
                                setSelectedDonor(donor);
                            }}
                            onDonorDelete={handleDeleteInstitution}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                         />
                     )}
                     {view === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAndSortedDonors.map(donor => (
                                <InstitutionalDonorCard
                                    key={donor.id}
                                    donor={donor}
                                    highlighted={highlightedId === donor.id}
                                    onSelect={(d) => {
                                        if (isOptimisticInstitution(d.id)) return;
                                        setSelectedDonor(d);
                                    }}
                                    onDelete={handleDeleteInstitution}
                                />
                            ))}
                        </div>
                     )}
                     {view === 'map' && (
                        <InstitutionalDonorsMap donors={filteredAndSortedDonors} />
                     )}
                     {view === 'opportunities' && (
                        <PartnershipOpportunitiesTab donors={donors} onSelectDonor={setSelectedDonor} />
                     )}
                     {filteredAndSortedDonors.length === 0 && !['map', 'opportunities'].includes(view) && (
                        <div className="text-center py-16 px-6">
                            <h3 className="text-xl font-semibold text-foreground dark:text-dark-foreground mb-2">{t('institutional_donors.noResults')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('institutional_donors.noResultsDescription')}</p>
                        </div>
                     )}
                </div>
            </div>
        </>
    );
};

export default InstitutionalDonors;
