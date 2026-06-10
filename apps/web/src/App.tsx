
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import type { Role, Language, Project, HrData } from './types';
import { useLocation, useNavigate } from 'react-router';
import { pruneSearchParamsForModule } from './lib/moduleSearchParams';

// Providers & Contexts
import { DashboardProvider } from './contexts/DashboardContext';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import DashboardErrorBoundary from './components/common/DashboardErrorBoundary';
import LoginPage from './components/pages/LoginPage';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileSidebar from './components/layout/MobileSidebar';
import BottomNavBar from './components/layout/BottomNavBar';
import AiFab from './components/common/AiFab';

import { useHrData } from './hooks/useHrData';
import { MOCK_PROJECTS } from './data/projectData';


// Page Components (Lazy Loaded)
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const DonorManagement = lazy(() => import('./components/pages/DonorManagement'));
const InstitutionalDonors = lazy(() => import('./components/pages/InstitutionalDonors'));
const ProjectManagement = lazy(() => import('./components/pages/ProjectManagement'));
const BeneficiariesModule = lazy(() => import('./components/pages/BeneficiariesModule'));
const StakeholderManagement = lazy(() => import('./components/pages/StakeholderManagement'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));
const HelpSupportPage = lazy(() => import('./components/pages/HelpSupportPage'));
const PlaceholderPage = lazy(() => import('./components/pages/PlaceholderPage'));
const BousalaPage = lazy(() => import('./components/pages/BousalaPage'));
const FinancialsPage = lazy(() => import('./components/pages/FinancialsPage'));
const StaffPage = lazy(() => import('./components/pages/StaffPage'));
const ImplementingPartnersPage = lazy(() => import('./components/pages/ImplementingPartnersPage'));
const PlatformPage = lazy(() => import('./components/pages/PlatformPage'));


interface ModuleRendererProps {
    activeModule: string;
    updateActiveModule: (module: string) => void;
    role: Role;
    enabledLanguages: Language[];
    onEnabledLanguagesChange: (langs: Language[]) => void;
    deepLinkTarget: { id?: string; tab?: string } | null;
    hrData: HrData;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({
    activeModule, updateActiveModule, role,
    enabledLanguages, onEnabledLanguagesChange, deepLinkTarget,
    hrData
}) => {
    const { projects } = { projects: MOCK_PROJECTS as Project[] };

    switch (activeModule) {
        case 'dashboard': return <Dashboard setActiveModule={updateActiveModule} />;
        case 'donors': return <DonorManagement role={role} deepLinkTarget={deepLinkTarget} />;
        case 'institutional_donors': return <InstitutionalDonors />;
        case 'projects': return <ProjectManagement deepLinkTarget={deepLinkTarget} />;
        case 'beneficiaries': return <BeneficiariesModule deepLinkTarget={deepLinkTarget} />;
        case 'stakeholder_management': return <StakeholderManagement />;
        case 'bousala': return <BousalaPage projects={projects} hrData={hrData} role={role} setActiveModule={updateActiveModule} />;
        case 'financials': return <FinancialsPage />;
        case 'implementing_partners': return <ImplementingPartnersPage />;
        case 'staff': return <StaffPage />;
        case 'platform': return <PlatformPage setActiveModule={updateActiveModule} />;
        case 'settings': return <SettingsPage enabledLanguages={enabledLanguages} onEnabledLanguagesChange={onEnabledLanguagesChange} />;
        case 'help': return <HelpSupportPage />;
        default: return <PlaceholderPage moduleKey={activeModule} />;
    }
};

const LoadingSpinner = () => (
    <div className="flex h-full w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
    </div>
);

function App() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeModule, setActiveModule] = useState(() => (window.location.hash.substring(1) || 'dashboard').split('/')[0]);
    const [role, setRole] = useState<Role>('Admin');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [enabledLanguages, setEnabledLanguages] = useState<Language[]>(['en', 'ar']);
    const [_isAiFabVisible, setIsAiFabVisible] = useState(false);
    const [deepLinkTarget, setDeepLinkTarget] = useState<{ id?: string; tab?: string } | null>(null);

    // Get all necessary data at the top level
    const { hrData } = useHrData();

    const updateActiveModule = useCallback((module: string) => {
        window.location.hash = module;
    }, []);
    
    const syncModuleFromHash = useCallback(() => {
        const hashContent = window.location.hash.substring(1) || 'dashboard';
        const [module, targetId, targetTab] = hashContent.split('/');

        const browserSearch = new URLSearchParams(window.location.search);
        const pruned = pruneSearchParamsForModule(browserSearch, module);
        const search = pruned.toString();
        const currentSearch = location.search.replace(/^\?/, '');

        setActiveModule(module);
        setDeepLinkTarget(targetId ? { id: targetId, tab: targetTab } : null);

        if (search !== currentSearch || location.hash !== `#${hashContent}`) {
            navigate(
                {
                    pathname: location.pathname,
                    search: search ? `?${search}` : '',
                    hash: `#${hashContent}`,
                },
                { replace: true },
            );
        }
    }, [navigate, location.pathname, location.search, location.hash]);

    useEffect(() => {
        window.addEventListener('hashchange', syncModuleFromHash);
        syncModuleFromHash();
        return () => window.removeEventListener('hashchange', syncModuleFromHash);
    }, [syncModuleFromHash]);

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <DashboardErrorBoundary>
            <DashboardProvider>
                <ToastProvider>
                    <div className="flex h-screen bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground">
                        <Sidebar activeModule={activeModule} setActiveModule={updateActiveModule} role={role} />
                        <MobileSidebar 
                            isOpen={isMobileMenuOpen}
                            onClose={() => setIsMobileMenuOpen(false)}
                            activeModule={activeModule}
                            setActiveModule={updateActiveModule}
                            role={role}
                            setRole={setRole}
                        />
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <Header 
                                role={role} 
                                setRole={setRole} 
                                isMobileMenuOpen={isMobileMenuOpen} 
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                                enabledLanguages={enabledLanguages}
                                setActiveModule={updateActiveModule}
                            />
                            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
                                <Suspense fallback={<LoadingSpinner />}>
                                    <ModuleRenderer 
                                        activeModule={activeModule} 
                                        updateActiveModule={updateActiveModule}
                                        role={role}
                                        enabledLanguages={enabledLanguages}
                                        onEnabledLanguagesChange={setEnabledLanguages}
                                        deepLinkTarget={deepLinkTarget}
                                        hrData={hrData}
                                    />
                                </Suspense>
                            </main>
                        </div>
                        {_isAiFabVisible && <AiFab onClick={() => updateActiveModule('dashboard')} />}
                         <BottomNavBar
                            activeModule={activeModule}
                            setActiveModule={updateActiveModule}
                            onMenuClick={() => setIsMobileMenuOpen(true)}
                            notificationCount={3} // Example notification count
                        />
                    </div>
                </ToastProvider>
            </DashboardProvider>
        </DashboardErrorBoundary>
    );
}

export default App;
