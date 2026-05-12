




import React, { useState, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { useDonorIntelligenceData } from '../../hooks/useDonorIntelligenceData';
import { MOCK_DONORS } from '../../data/mockData';
import { MOCK_INDIVIDUAL_DONORS } from '../../data/individualDonorsData';
import { MOCK_DONATIONS } from '../../data/donationsData';
import { MOCK_COMMUNICATIONS } from '../../data/communicationsData';
import { classifyAndEnrichDonor } from '../../lib/donorIntelligence';

import type { Donor, DonorPipelineType, DonorStageId, IndividualDonor, Role, SortDirection } from '../../types';
import KanbanBoard, { type DonorKanbanStage, type KanbanDensity } from './donors/KanbanBoard';
import RegistryAddDonorModal from './donors_individual/AddDonorModal';
import DonorsTable from './donors_individual/DonorsTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatNumber, getDonorCategoryLabel } from '../../lib/utils';
import Tabs from '../common/Tabs';
import { Users, Filter, List, LayoutDashboard, DollarSign, UserCheck, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { SearchIcon } from '../icons/GenericIcons';
import DonorCard from './donors_individual/DonorCard';
import DonorDetailView, { DonorProfileRoute } from './donors_individual/DonorDetailView';
import { MicrophoneIcon } from '../icons/AiIcons';
import AdvancedFilterPanel, { type DonorFilters } from './donors_individual/AdvancedFilterPanel';


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


// --- REDUCER FOR KANBAN/PIPELINE ---
type DonorsState = { donors: Donor[] };
type DonorsAction =
    | { type: 'MOVE_DONOR'; payload: { donorId: number; targetStageId: DonorStageId } }
    | { type: 'ADD_DONOR'; payload: Omit<Donor, 'id' | 'tasks' | 'totalDonated' | 'donationCount' | 'firstDonation' | 'lastDonation' | 'lastContact' | 'relationshipHealth' | 'stage'> }
    | { type: 'SET_TASK_COMPLETED'; payload: { donorId: number; taskId: string; completed: boolean } };

const LOCAL_STORAGE_KEY = 'mss2-erp-donors-data';
const validPipelineStages: DonorStageId[] = ['prospect', 'researching', 'contacted', 'cultivating', 'solicited', 'pledged', 'donated', 'dormant'];
const legacyStageMap: Record<string, DonorStageId> = {
    stewardship: 'donated',
};
const DEFAULT_DONOR_FILTERS: DonorFilters = {
    status: 'all',
    tier: 'all',
    country: 'all',
    tag: 'all',
    owner: 'all',
    stage: 'all',
    donorType: 'all',
    taskState: 'all',
};

const normalizePipelineDonor = (donor: Donor): Donor => {
    const tasks = donor.tasks || [];
    const stage = validPipelineStages.includes(donor.stage)
        ? donor.stage
        : legacyStageMap[String(donor.stage)] || 'prospect';

    return {
        ...donor,
        stage,
        stageEnteredAt: donor.stageEnteredAt || donor.lastContact || donor.firstDonation || new Date().toISOString(),
        assignedOwner: donor.assignedOwner || String(tasks.find(task => !task.completed)?.assignedTo || 'Unassigned'),
        donorType: donor.donorType || (donor.totalDonated >= 10000 ? 'Major Donor' : donor.donationCount > 2 ? 'Recurring' : 'Individual'),
        likelihood: donor.likelihood || (donor.relationshipHealth === 'Good' ? 'High' : donor.relationshipHealth === 'At Risk' ? 'Low' : 'Medium'),
        suggestedAskAmount: donor.suggestedAskAmount ?? donor.potentialGift,
        interestTags: donor.interestTags || [],
        tasks,
    };
};

const getLatestContactDate = (donorId: string): string => {
    const latestCommunication = MOCK_COMMUNICATIONS
        .filter(communication => communication.donor_id === donorId)
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

    return latestCommunication?.sent_at || '';
};

const getDefaultDonorType = (donor: IndividualDonor): DonorPipelineType => {
    if (donor.donorType) return donor.donorType;
    if (donor.tier === 'Major Donor') return 'Major Donor';
    if (donor.donorCategory === 'Recurring Donor') return 'Recurring';
    return 'Individual';
};

const enrichProfileDonors = (donors: IndividualDonor[], pipelineDonors: Donor[]): IndividualDonor[] => {
    const pipelineByEmail = new Map(pipelineDonors.map(donor => [donor.email.toLowerCase(), donor]));

    return donors.map(donor => {
        const pipelineDonor = pipelineByEmail.get(donor.email.toLowerCase());
        const donorDonations = MOCK_DONATIONS.filter(donation => donation.donorId === donor.id);
        const largestGift = donorDonations.reduce((largest, donation) => Math.max(largest, donation.amount), 0);
        const programsSupported = Array.from(new Set(donorDonations.map(donation => donation.program)));
        const relationshipTasks = pipelineDonor?.tasks || donor.relationshipTasks || [];
        const stage = pipelineDonor?.stage || donor.relationshipStage || 'prospect';
        const stageEnteredAt = pipelineDonor?.stageEnteredAt || donor.stageEnteredAt || donor.donorSince;
        const lastContactDate = pipelineDonor?.lastContact || donor.lastContactDate || getLatestContactDate(donor.id) || donor.lastDonationDate;
        const relationshipHealth = pipelineDonor?.relationshipHealth || donor.relationshipHealth || (donor.status === 'Lapsed' ? 'At Risk' : 'Moderate');
        const relationshipLikelihood = pipelineDonor?.likelihood || donor.relationshipLikelihood || (relationshipHealth === 'Good' ? 'High' : relationshipHealth === 'At Risk' ? 'Low' : 'Medium');
        const donorType = pipelineDonor?.donorType || getDefaultDonorType(donor);
        const potentialGift = pipelineDonor?.potentialGift ?? donor.potentialGift ?? donor.next_predicted_amount ?? 0;
        const suggestedAskAmount = pipelineDonor?.suggestedAskAmount ?? donor.suggestedAskAmount ?? donor.next_predicted_amount ?? potentialGift;
        const openTasks = relationshipTasks.filter(task => !task.completed);
        const nextTask = openTasks.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

        return {
            ...donor,
            donorType,
            relationshipStage: stage,
            relationshipHealth,
            relationshipLikelihood,
            stageEnteredAt,
            lastContactDate,
            potentialGift,
            suggestedAskAmount,
            relationshipTasks,
            largestGift,
            programsSupported,
            recurringGiftStatus: donor.recurringGiftStatus || (donor.donorCategory === 'Recurring Donor' ? 'Active' : 'None'),
            stageHistory: donor.stageHistory || [
                { stage: 'prospect', enteredAt: donor.donorSince, exitedAt: stageEnteredAt !== donor.donorSince ? stageEnteredAt : undefined },
                { stage, enteredAt: stageEnteredAt },
            ],
            currentProposal: donor.currentProposal || (stage === 'solicited' ? 'Active giving proposal' : undefined),
            askDate: donor.askDate || (stage === 'solicited' ? stageEnteredAt : undefined),
            pledgeAmount: donor.pledgeAmount || (stage === 'pledged' ? suggestedAskAmount : undefined),
            pledgeStatus: donor.pledgeStatus || (stage === 'pledged' ? 'Pledged' : stage === 'donated' ? 'Paid' : 'None'),
            expectedCloseDate: donor.expectedCloseDate || nextTask?.dueDate,
            relationshipNotes: donor.relationshipNotes || `${donor.fullName.en} is primarily connected to ${donor.primaryProgramInterest || donor.tags[0] || 'general giving'}.`,
            aiInsights: donor.aiInsights || [
                relationshipHealth === 'At Risk'
                    ? 'Relationship needs a timely follow-up before the donor becomes harder to re-engage.'
                    : 'Keep open tasks current so the relationship keeps moving.',
            ],
            riskSignals: donor.riskSignals || (relationshipHealth === 'At Risk' ? ['Long gap since last contact or gift'] : []),
            documents: donor.documents || [
                ...(donor.totalDonations > 0 ? [{ id: `${donor.id}-receipt`, title: 'Latest donation receipt', type: 'Receipt' as const, date: donor.lastDonationDate || donor.donorSince }] : []),
                ...(stage === 'solicited' ? [{ id: `${donor.id}-proposal`, title: 'Current funding proposal', type: 'Proposal' as const, date: stageEnteredAt }] : []),
            ],
        };
    });
};

const buildPipelineDonorsFromProfiles = (profileDonors: IndividualDonor[], pipelineDonors: Donor[]): Donor[] => {
    const pipelineByEmail = new Map(pipelineDonors.map(donor => [donor.email.toLowerCase(), donor]));

    return profileDonors.map((donor, index) => {
        const pipelineDonor = pipelineByEmail.get(donor.email.toLowerCase());

        return normalizePipelineDonor({
            id: pipelineDonor?.id ?? index + 1,
            name: donor.fullName.en,
            email: donor.email,
            totalDonated: donor.totalDonations,
            donationCount: donor.donationsCount || 0,
            firstDonation: donor.donorSince,
            lastDonation: donor.lastDonationDate,
            country: donor.country,
            avatar: donor.avatar,
            stage: donor.relationshipStage || pipelineDonor?.stage || 'prospect',
            potentialGift: donor.potentialGift ?? pipelineDonor?.potentialGift ?? 0,
            suggestedAskAmount: donor.suggestedAskAmount ?? pipelineDonor?.suggestedAskAmount,
            relationshipHealth: donor.relationshipHealth || pipelineDonor?.relationshipHealth || 'Moderate',
            lastContact: donor.lastContactDate || pipelineDonor?.lastContact || '',
            stageEnteredAt: donor.stageEnteredAt || pipelineDonor?.stageEnteredAt,
            assignedOwner: donor.assignedManager,
            donorType: donor.donorType || pipelineDonor?.donorType,
            likelihood: donor.relationshipLikelihood || pipelineDonor?.likelihood,
            interestTags: donor.tags,
            tasks: donor.relationshipTasks || pipelineDonor?.tasks || [],
            donorCategory: donor.donorCategory,
        });
    });
};

const getInitialState = (): DonorsState => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsedState = storedData ? JSON.parse(storedData) : { donors: MOCK_DONORS };
    return {
        donors: (parsedState.donors || MOCK_DONORS).map(normalizePipelineDonor),
    };
  } catch (error) {
    console.error("Failed to load donors data from localStorage:", error);
    return { donors: MOCK_DONORS.map(normalizePipelineDonor) };
  }
};

const donorsReducer = (state: DonorsState, action: DonorsAction): DonorsState => {
    switch (action.type) {
        case 'MOVE_DONOR':
            return { ...state, donors: state.donors.map(d => d.id === action.payload.donorId ? { ...d, stage: action.payload.targetStageId, stageEnteredAt: new Date().toISOString() } : d) };
        case 'ADD_DONOR':
            const newDonor: Donor = normalizePipelineDonor({ ...action.payload, id: Math.max(0, ...state.donors.map(d => d.id)) + 1, stage: 'prospect', totalDonated: 0, donationCount: 0, firstDonation: '', lastDonation: '', lastContact: '', relationshipHealth: 'Moderate', tasks: [] });
            return { ...state, donors: [newDonor, ...state.donors] };
        case 'SET_TASK_COMPLETED':
            return { ...state, donors: state.donors.map(donor => donor.id === action.payload.donorId ? { ...donor, tasks: donor.tasks.map(task => task.id === action.payload.taskId ? { ...task, completed: action.payload.completed } : task) } : donor) };
        default: return state;
    }
};

const CategoryCard: React.FC<{ category: string; count: number }> = ({ category, count }) => {
    const { t } = useLocalization();
    return (
        <div className="rounded-xl border dark:border-slate-700 bg-card dark:bg-dark-card p-4">
            <p className="text-sm text-gray-500">{getDonorCategoryLabel(category, t)}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
    );
};


// --- TAB COMPONENTS ---

const RegistryMetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary-light dark:bg-primary/20 text-primary dark:text-secondary">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const RegistryTab: React.FC<{
    pipelineDonors: Donor[];
    dispatch: React.Dispatch<DonorsAction>;
    deepLinkTarget?: { id?: string; tab?: string } | null;
}> = ({ pipelineDonors, dispatch, deepLinkTarget }) => {
    const { t, language, dir } = useLocalization(['common', 'donors', 'individual_donors', 'misc']);
    const enrichedDonors = useMemo(() =>
        MOCK_INDIVIDUAL_DONORS.map(donor => classifyAndEnrichDonor(donor, MOCK_DONATIONS)),
    []);
    const [donors, setDonors] = useState<IndividualDonor[]>(enrichedDonors);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof IndividualDonor | null>('lastDonationDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [view, setView] = useState<'list' | 'card' | 'kanban'>('list');
    const [selectedDonor, setSelectedDonor] = useState<IndividualDonor | null>(null);
    const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<DonorFilters>(DEFAULT_DONOR_FILTERS);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [kanbanDensity, setKanbanDensity] = useState<KanbanDensity>('compact');
    const [pipelineOwnerFilter, setPipelineOwnerFilter] = useState('all');

    // Voice Search State
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const toast = useToast();

    const handleDonorSelect = useCallback((donor: IndividualDonor) => {
        setSelectedDonor(donor);
        setSelectedDonorId(donor.id);
        window.location.hash = `donors/${donor.id}`;
    }, []);

    const handleDonorBack = useCallback(() => {
        setSelectedDonor(null);
        setSelectedDonorId(null);
        window.location.hash = 'donors';
    }, []);

    const handleDonorUpdated = useCallback((updatedDonor: IndividualDonor) => {
        setDonors(prev => prev.map(donor => donor.id === updatedDonor.id ? { ...donor, ...updatedDonor } : donor));
        setSelectedDonor(updatedDonor);
        setSelectedDonorId(updatedDonor.id);
    }, []);

    const profileDonors = useMemo(
        () => enrichProfileDonors(donors, pipelineDonors),
        [donors, pipelineDonors]
    );

    const pipelineViewDonors = useMemo(
        () => buildPipelineDonorsFromProfiles(profileDonors, pipelineDonors),
        [pipelineDonors, profileDonors]
    );

    useEffect(() => {
        if (deepLinkTarget?.id && profileDonors.length > 0) {
            const donor = profileDonors.find(d => d.id === deepLinkTarget.id);
            setSelectedDonor(donor || null);
            setSelectedDonorId(deepLinkTarget.id);
        } else if (!deepLinkTarget?.id) {
            setSelectedDonor(null);
            setSelectedDonorId(null);
        }
    }, [deepLinkTarget, profileDonors]);

    // Speech Recognition Setup Effect
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError(t('donorManagement.voice.notSupported'));
            return;
        }
        
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                const errorMsg = t('donorManagement.voice.permissionDenied');
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
    }, [toast]);

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
            const errorMsg = t('donorManagement.voice.startError');
            setMicError(errorMsg);
            toast.showError(errorMsg);
        }
    }, [isListening, language, t, toast]);

    const filteredAndSortedDonors = useMemo(() => {
        const searchLower = searchTerm.trim().toLowerCase();
        let filtered = profileDonors.filter(donor => {
            const openTasks = donor.relationshipTasks?.filter(task => !task.completed) || [];
            const today = new Date().toISOString().split('T')[0];
            const hasOverdueTask = openTasks.some(task => task.dueDate < today);
            const hasNoOpenTasks = openTasks.length === 0;
            const searchableText = [
                donor.fullName[language],
                donor.fullName.en,
                donor.fullName.ar,
                donor.email,
                donor.phone,
                donor.country,
                donor.city,
                donor.status,
                donor.tier,
                donor.assignedManager,
                donor.donorType,
                donor.relationshipStage,
                donor.relationshipHealth,
                donor.relationshipLikelihood,
                ...(donor.tags || []),
            ].filter(Boolean).join(' ').toLowerCase();

            const matchesSearch = !searchLower || searchableText.includes(searchLower);
            const matchesStatus = filters.status === 'all' || donor.status === filters.status;
            const matchesTier = filters.tier === 'all' || donor.tier === filters.tier;
            const matchesCountry = filters.country === 'all' || donor.country === filters.country;
            const matchesTag = filters.tag === 'all' || donor.tags.includes(filters.tag);
            const matchesOwner = filters.owner === 'all' || donor.assignedManager === filters.owner;
            const matchesStage = filters.stage === 'all' || donor.relationshipStage === filters.stage;
            const matchesDonorType = filters.donorType === 'all' || donor.donorType === filters.donorType;
            const matchesTaskState =
                filters.taskState === 'all' ||
                (filters.taskState === 'overdue' && hasOverdueTask) ||
                (filters.taskState === 'noOpenTasks' && hasNoOpenTasks);

            return matchesSearch && matchesStatus && matchesTier && matchesCountry && matchesTag && matchesOwner && matchesStage && matchesDonorType && matchesTaskState;
        });
        
        if (sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }
                
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                     if (sortColumn === 'lastDonationDate' || sortColumn === 'donorSince') {
                         if (!aVal) return 1;
                         if (!bVal) return -1;
                        return sortDirection === 'asc' ? new Date(aVal).getTime() - new Date(bVal).getTime() : new Date(bVal).getTime() - new Date(aVal).getTime();
                    }
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                if (sortColumn === 'fullName') {
                     const aName = a.fullName[language] || a.fullName.en;
                     const bName = b.fullName[language] || b.fullName.en;
                     return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }

                return 0;
            });
        }
        
        return filtered;
    }, [filters, profileDonors, searchTerm, sortColumn, sortDirection, language]);

    const filteredPipelineDonors = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        const visibleEmails = new Set(filteredAndSortedDonors.map(donor => donor.email.toLowerCase()));

        return buildPipelineDonorsFromProfiles(filteredAndSortedDonors, pipelineViewDonors).filter(donor => {
            const matchesOwner = pipelineOwnerFilter === 'all' || (donor.assignedOwner || 'Unassigned') === pipelineOwnerFilter;
            const matchesSearch =
                donor.name.toLowerCase().includes(searchLower) ||
                donor.email.toLowerCase().includes(searchLower) ||
                donor.country.toLowerCase().includes(searchLower);

            return visibleEmails.has(donor.email.toLowerCase()) && matchesSearch && matchesOwner;
        });
    }, [filteredAndSortedDonors, pipelineOwnerFilter, pipelineViewDonors, searchTerm]);

    const stageByEmail = useMemo(() => {
        return new Map(profileDonors.map(donor => [donor.email.toLowerCase(), donor.relationshipStage || 'prospect']));
    }, [profileDonors]);

    const registryStats = useMemo(() => {
        const totalDonations = profileDonors.reduce((sum, donor) => sum + donor.totalDonations, 0);
        const activeDonors = profileDonors.filter(donor => donor.status === 'Active').length;
        const avgGift = profileDonors.length > 0
            ? profileDonors.reduce((sum, donor) => sum + (donor.avgGift || 0), 0) / profileDonors.length
            : 0;

        return { totalDonations, activeDonors, avgGift };
    }, [profileDonors]);

    const filterOptions = useMemo(() => {
        const countries = Array.from(new Set(profileDonors.map(donor => donor.country).filter(Boolean))).sort();
        const tags = Array.from(new Set(profileDonors.flatMap(donor => donor.tags))).sort();
        const owners = Array.from(new Set(profileDonors.map(donor => donor.assignedManager).filter(Boolean))).sort();
        const donorTypes = Array.from(new Set(profileDonors.map(donor => donor.donorType).filter(Boolean))) as DonorPipelineType[];

        return { countries, tags, owners, donorTypes };
    }, [profileDonors]);

    const hasActiveFilters = useMemo(() => (
        filters.status !== 'all' ||
        filters.tier !== 'all' ||
        filters.country !== 'all' ||
        filters.tag !== 'all' ||
        filters.owner !== 'all' ||
        filters.stage !== 'all' ||
        filters.donorType !== 'all' ||
        filters.taskState !== 'all'
    ), [filters]);

    const clearFilters = useCallback(() => {
        setFilters(DEFAULT_DONOR_FILTERS);
    }, []);

    const stages: DonorKanbanStage[] = [
        { id: 'prospect', titleKey: 'donors.stages.prospect', color: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-400', railColor: '#f59e0b' },
        { id: 'researching', titleKey: 'donors.stages.researching', color: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-500', railColor: '#14b8a6' },
        { id: 'contacted', titleKey: 'donors.stages.contacted', color: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-500', railColor: '#3b82f6' },
        { id: 'cultivating', titleKey: 'donors.stages.cultivating', color: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-500', railColor: '#f59e0b' },
        { id: 'solicited', titleKey: 'donors.stages.solicited', color: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-500', railColor: '#8b5cf6' },
        { id: 'pledged', titleKey: 'donors.stages.pledged', color: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-500', railColor: '#06b6d4' },
        { id: 'donated', titleKey: 'donors.stages.donated', color: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-500', railColor: '#22c55e' },
        { id: 'dormant', titleKey: 'donors.stages.dormant', color: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-500', railColor: '#ef4444' },
    ];

    const pipelineOwners = useMemo(() => {
        return Array.from(new Set(pipelineViewDonors.map(donor => donor.assignedOwner || 'Unassigned'))).sort();
    }, [pipelineViewDonors]);

    const pipelineStats = useMemo(() => {
        const pipelineValue = filteredPipelineDonors.reduce((sum, donor) => sum + donor.potentialGift, 0);

        return { pipelineValue };
    }, [filteredPipelineDonors]);

    const handleDragEnd = useCallback((donorId: number, targetStageId: DonorStageId) => {
        dispatch({ type: 'MOVE_DONOR', payload: { donorId, targetStageId } });
    }, [dispatch]);

    const handleAddDonor = (newDonorData: Omit<IndividualDonor, 'id' | 'totalDonations' | 'lastDonationDate' | 'status' | 'tier' | 'tags' | 'assignedManager' | 'avatar' | 'donorSince'>) => {
        const newDonor: IndividualDonor = {
            ...newDonorData,
            id: `IDN-${String(donors.length + 1).padStart(4, '0')}`,
            totalDonations: 0,
            lastDonationDate: '',
            status: 'Active',
            tier: 'Bronze',
            tags: [],
            assignedManager: 'Unassigned',
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(newDonorData.email)}`,
            donorSince: new Date().toISOString(),
            donationsCount: 0,
            avgGift: 0,
            donorCategory: 'New Donor',
            donorType: 'Individual',
            relationshipStage: 'prospect',
            relationshipHealth: 'Moderate',
            relationshipLikelihood: 'Medium',
            stageEnteredAt: new Date().toISOString(),
            potentialGift: 0,
            suggestedAskAmount: 0,
            relationshipTasks: [],
            lastContactDate: '',
            pledgeStatus: 'None',
        };
        setDonors(prev => [newDonor, ...prev]);
        dispatch({
            type: 'ADD_DONOR',
            payload: {
                name: newDonor.fullName.en,
                email: newDonor.email,
                country: newDonor.country,
                potentialGift: 0,
                suggestedAskAmount: 0,
                avatar: newDonor.avatar,
                assignedOwner: newDonor.assignedManager,
                donorType: 'Individual',
                likelihood: 'Medium',
                interestTags: newDonor.tags,
            },
        });
    };

     const handleSort = useCallback((column: keyof IndividualDonor) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    const getButtonClass = (buttonView: 'list' | 'card') => {
        return view === buttonView
            ? "p-2 bg-primary text-white rounded-md"
            : "p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md";
    };

    if (selectedDonor) {
        return <DonorDetailView donor={selectedDonor} onBack={handleDonorBack} onDonorUpdated={handleDonorUpdated} />;
    }

    if (selectedDonorId) {
        return <DonorProfileRoute donorId={selectedDonorId} onBack={handleDonorBack} onDonorUpdated={handleDonorUpdated} />;
    }

    return (
        <>
            <RegistryAddDonorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddDonor}
            />
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <RegistryMetricCard title={t('donors.registry.metrics.totalDonors')} value={formatNumber(profileDonors.length, language)} icon={<Users size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.activeDonors')} value={formatNumber(registryStats.activeDonors, language)} icon={<UserCheck size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.totalDonated')} value={formatCurrency(registryStats.totalDonations, language)} icon={<DollarSign size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.averageGift')} value={formatCurrency(registryStats.avgGift, language)} icon={<Clock size={20} />} />
                </div>

                <div className="p-4 bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3">
                            <button
                                onClick={() => setIsSearchOpen(prev => !prev)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
                                    isSearchOpen || searchTerm
                                        ? 'border-primary bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary'
                                        : 'border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                                aria-expanded={isSearchOpen}
                            >
                                <SearchIcon className="w-5 h-5" />
                                {t('common.search', language === 'ar' ? 'بحث' : 'Search')}
                                {searchTerm && <span className="h-2 w-2 rounded-full bg-primary dark:bg-secondary" aria-hidden="true" />}
                            </button>
                            <button
                                onClick={() => setFiltersOpen(prev => !prev)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
                                    filtersOpen || hasActiveFilters
                                        ? 'border-primary bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary'
                                        : 'border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                                aria-expanded={filtersOpen}
                            >
                                <Filter size={16} />
                                {t('individual_donors.filters')}
                                {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary dark:bg-secondary" aria-hidden="true" />}
                            </button>
                            <div className="p-1 bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                                <button onClick={() => setView('list')} className={getButtonClass('list')} aria-label={t('individual_donors.listView')} title={t('individual_donors.listView')}><List size={20}/></button>
                                <button onClick={() => setView('card')} className={getButtonClass('card')} aria-label={t('individual_donors.iconView')} title={t('individual_donors.iconView')}><Users size={20} /></button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}
                                aria-pressed={view === 'kanban'}
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                                    view === 'kanban'
                                        ? 'border-primary bg-primary text-white shadow-sm'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary-light/80 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <LayoutDashboard size={17} />
                                <span>{t('donors.kanban.pipelineBoard')}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                                    view === 'kanban'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-100 text-gray-600 dark:bg-slate-900 dark:text-gray-300'
                                }`}>
                                    {formatNumber(filteredPipelineDonors.length, language)}
                                </span>
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors"
                            >
                                {t('individual_donors.addDonor')}
                            </button>
                        </div>
                        {view === 'kanban' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="text-sm">
                                        <span className="mb-1 block font-semibold text-gray-600 dark:text-gray-300">{t('donors.kanban.owner')}</span>
                                        <select
                                            value={pipelineOwnerFilter}
                                            onChange={e => setPipelineOwnerFilter(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <option value="all">{t('donors.kanban.allOwners')}</option>
                                            {pipelineOwners.map(owner => (
                                                <option key={owner} value={owner}>{owner}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                                        <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">{t('donors.kanban.filteredValue')}</span>
                                        <span className="text-sm font-bold text-foreground dark:text-dark-foreground">{formatCurrency(pipelineStats.pipelineValue, language)}</span>
                                    </div>
                                </div>
                                <div className="flex items-end justify-start text-sm lg:justify-end">
                                    <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" aria-label={t('donors.kanban.density.label')}>
                                        <button
                                            type="button"
                                            onClick={() => setKanbanDensity('compact')}
                                            aria-pressed={kanbanDensity === 'compact'}
                                            title={t('donors.kanban.density.compact')}
                                            className={`flex items-center gap-1 rounded px-2 py-1.5 font-semibold transition-colors ${kanbanDensity === 'compact' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'}`}
                                        >
                                            <Minimize2 size={14} />
                                            {t('donors.kanban.density.compact')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setKanbanDensity('comfortable')}
                                            aria-pressed={kanbanDensity === 'comfortable'}
                                            title={t('donors.kanban.density.comfortable')}
                                            className={`flex items-center gap-1 rounded px-2 py-1.5 font-semibold transition-colors ${kanbanDensity === 'comfortable' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'}`}
                                        >
                                            <Maximize2 size={14} />
                                            {t('donors.kanban.density.comfortable')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isSearchOpen && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    placeholder={isListening ? t('common.listening') : t('donors.registry.searchPlaceholder')}
                                    className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary ${dir === 'ltr' ? 'pl-12 pr-12' : 'pr-12 pl-12'}`}
                                    autoFocus
                                />
                                <div className={`absolute inset-y-0 flex items-center pointer-events-none ${dir === 'ltr' ? 'left-3' : 'right-3'}`}>
                                    <SearchIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className={`absolute inset-y-0 flex items-center ${dir === 'ltr' ? 'right-3' : 'left-3'}`}>
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
                        )}
                    </div>
                </div>

                <AdvancedFilterPanel
                    isOpen={filtersOpen}
                    filters={filters}
                    countries={filterOptions.countries}
                    tags={filterOptions.tags}
                    owners={filterOptions.owners}
                    donorTypes={filterOptions.donorTypes}
                    stages={stages.map(stage => stage.id)}
                    onApply={setFilters}
                    onClear={clearFilters}
                />

                {view === 'list' && (
                    <DonorsTable
                        donors={filteredAndSortedDonors}
                        onDonorSelect={handleDonorSelect}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        stageByEmail={stageByEmail}
                    />
                )}
                {view === 'card' && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,23rem),1fr))] items-start gap-5">
                        {filteredAndSortedDonors.map(donor => (
                            <DonorCard key={donor.id} donor={donor} onClick={() => handleDonorSelect(donor)} />
                        ))}
                    </div>
                )}
                {view === 'kanban' && (
                    <KanbanBoard
                        donors={filteredPipelineDonors}
                        stages={stages}
                        density={kanbanDensity}
                        onDragEnd={handleDragEnd}
                    />
                )}
            </div>
        </>
    );
};

const AnalyticsTab: React.FC<{ role: Role }> = ({ role }) => {
    const { t, language, dir } = useLocalization();
    const { donors, isLoading } = useDonorIntelligenceData();
    const [filters, setFilters] = useState({ search: '', category: 'all', program: 'all' });
    
    const CATEGORY_COLORS: Record<string, string> = { 'Hero Donor': '#FFD700', 'Recurring Donor': '#10B981', 'Seasonal Donor': '#3B82F6', 'Event Donor': '#F59E0B', 'Dormant Donor': '#6B7280', 'General Donor': '#9CA3AF', 'New Donor': '#A1A1AA' };
    const categoryCounts = useMemo(() => donors.reduce((acc, donor) => { if(donor.donorCategory) { acc[donor.donorCategory] = (acc[donor.donorCategory] || 0) + 1; } return acc; }, {} as Record<string, number>), [donors]);
    const pieChartData = useMemo(() => Object.entries(categoryCounts).map(([name, value]) => ({ name: getDonorCategoryLabel(name, t), value })), [categoryCounts, t]);

    return (
         <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.keys(CATEGORY_COLORS).map((category) => (
                            <CategoryCard key={category} category={category} count={categoryCounts[category] || 0} />
                        ))}
                    </div>
                </div>
                <div className="xl:col-span-2 bg-card dark:bg-dark-card rounded-2xl shadow-soft p-4 border dark:border-slate-700/50">
                     <h3 className="text-lg font-bold mb-2 text-center">{t('donorIntelligence.distributionChart')}</h3>
                     <div className="h-64 w-full">
                        <ResponsiveContainer>
                             <PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[Object.keys(CATEGORY_COLORS).find(key => getDonorCategoryLabel(key, t) === entry.name) || '']} />)}</Pie><Tooltip /><Legend /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN HUB COMPONENT ---

const DonorHub: React.FC<{ role: Role; deepLinkTarget?: { id?: string; tab?: string } | null }> = ({ role, deepLinkTarget }) => {
    const { t } = useLocalization(['common', 'donors', 'individual_donors', 'misc']);
    const [state, dispatch] = useReducer(donorsReducer, getInitialState());
    const [activeTab, setActiveTab] = useState('registry');

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const tabs = [
        { id: 'registry', label: t('donors.tabs.registry') },
        { id: 'analytics', label: t('donors.tabs.analytics') },
    ];

    return (
        <>
            <div className="flex flex-col h-full animate-fade-in">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-4">
                    {t('donors.hubTitle')}
                </h1>

                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                
                <div className="mt-6 flex-grow">
                    {activeTab === 'registry' && <RegistryTab pipelineDonors={state.donors} dispatch={dispatch} deepLinkTarget={deepLinkTarget} />}
                    {activeTab === 'analytics' && <AnalyticsTab role={role} />}
                </div>
            </div>
        </>
    );
};

export default DonorHub;
