import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useBeneficiaryData } from '../../../hooks/useBeneficiaryData';
import type { Beneficiary, BeneficiaryType } from '../../../types';
import { BeneficiaryIcon } from '../../icons/ModuleIcons';
import BeneficiaryCard from './BeneficiaryCard';
import BeneficiaryTable from './BeneficiaryTable';
import BeneficiaryDetailView from './BeneficiaryDetailView';
import BeneficiaryToolbar from './BeneficiaryToolbar';
import BeneficiaryStatBar from './BeneficiaryStatBar';
import AddBeneficiaryModal from './AddBeneficiaryModal';
import { useToast } from '../../../hooks/useToast';

const BeneficiariesModule: React.FC = () => {
    const { t, language } = useLocalization(['common', 'beneficiaries']);
    const { beneficiaryData } = useBeneficiaryData();
    const toast = useToast();

    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(beneficiaryData.beneficiaries);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);

    // Toolbar state
    const [view, setView] = useState<'table' | 'card'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<BeneficiaryType | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedCountry, setSelectedCountry] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Derived data for filters
    const countries = useMemo(() => {
        const set = new Set(beneficiaries.map(b => b.country));
        return Array.from(set).sort();
    }, [beneficiaries]);

    // Filtering
    const filteredBeneficiaries = useMemo(() => {
        return beneficiaries.filter(b => {
            if (selectedType !== 'all' && b.beneficiaryType !== selectedType) return false;
            if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
            if (selectedCountry !== 'all' && b.country !== selectedCountry) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = (b.name[language] || b.name.en || b.name.ar || '').toLowerCase();
                const country = b.country.toLowerCase();
                const contact = b.profile.contact;
                const matchesName = name.includes(term);
                const matchesCountry = country.includes(term);
                const matchesEmail = contact?.email?.toLowerCase().includes(term) ?? false;
                const matchesPhone = contact?.phone?.includes(term) ?? false;
                if (!matchesName && !matchesCountry && !matchesEmail && !matchesPhone) return false;
            }

            return true;
        });
    }, [beneficiaries, selectedType, selectedStatus, selectedCountry, searchTerm, language]);

    const handleAddBeneficiary = (data: Partial<Beneficiary>) => {
        const newBeneficiary: Beneficiary = {
            id: `ben-${Date.now()}`,
            name: data.name || { en: '', ar: '' },
            beneficiaryType: data.beneficiaryType || 'student',
            photo: `https://picsum.photos/seed/${Date.now()}/200/200`,
            status: 'active',
            supportType: data.supportType || 'direct-support',
            country: data.country || '',
            profile: data.profile || { type: 'student' },
            aidLog: [],
            assessments: [],
            milestones: [],
            documents: [],
        };
        setBeneficiaries(prev => [newBeneficiary, ...prev]);
        toast.showSuccess(t('beneficiaries.addedSuccess', { name: newBeneficiary.name[language] }));
        setIsAddModalOpen(false);
    };

    const handleUpdate = (updated: Beneficiary) => {
        setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
        setSelectedBeneficiary(updated);
    };

    // Detail view
    if (selectedBeneficiary) {
        return (
            <BeneficiaryDetailView
                beneficiary={selectedBeneficiary}
                onBack={() => setSelectedBeneficiary(null)}
                onUpdate={handleUpdate}
            />
        );
    }

    return (
        <>
            <AddBeneficiaryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddBeneficiary}
            />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
                        <BeneficiaryIcon /> {t('beneficiaries.title')}
                    </h1>
                </div>

                {/* Stat bar */}
                <BeneficiaryStatBar beneficiaries={filteredBeneficiaries} />

                {/* Toolbar */}
                <BeneficiaryToolbar
                    view={view}
                    onViewChange={setView}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedType={selectedType}
                    onTypeChange={setSelectedType}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    countries={countries}
                    onAddBeneficiary={() => setIsAddModalOpen(true)}
                />

                {/* Content */}
                {filteredBeneficiaries.length > 0 ? (
                    view === 'table' ? (
                        <BeneficiaryTable
                            beneficiaries={filteredBeneficiaries}
                            projects={beneficiaryData.projects}
                            onSelect={setSelectedBeneficiary}
                        />
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-5">
                            {filteredBeneficiaries.map(b => {
                                const project = beneficiaryData.projects.find(p => p.id === b.projectId);
                                return (
                                    <BeneficiaryCard
                                        key={b.id}
                                        beneficiary={b}
                                        project={project}
                                        onClick={() => setSelectedBeneficiary(b)}
                                    />
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="text-center py-16 px-6 bg-card dark:bg-dark-card rounded-2xl shadow-inner">
                        <h3 className="text-xl font-semibold text-foreground dark:text-dark-foreground mb-2">
                            {t('beneficiaries.noResults')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {t('beneficiaries.noResultsDescription')}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default BeneficiariesModule;
