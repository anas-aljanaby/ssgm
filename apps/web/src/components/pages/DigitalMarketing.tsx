import React, { useState } from 'react';
import { BarChart3, Megaphone, MessageCircleMore, Share2 } from 'lucide-react';
import { useLocalization } from '../../hooks/useLocalization';
import type { Role, SocialPost, Campaign } from '../../types';
import { MOCK_SOCIAL_POSTS } from '../../data/socialMediaData';
import { MOCK_CAMPAIGNS } from '../../data/campaignsData';
import MarketingDashboard from './marketing/MarketingDashboard';
import CampaignsTab from './marketing/CampaignsTab';
import OutreachTab from './marketing/OutreachTab';
import SocialMediaTab from './marketing/SocialMediaTab';
import CreatePostModal from './marketing/social/CreatePostModal';
import SendEmailModal from './marketing/email/SendEmailModal';

interface DigitalMarketingProps {
    role?: Role;
}

const DigitalMarketing: React.FC<DigitalMarketingProps> = ({ role = 'Admin' }) => {
    const { t, dir } = useLocalization(['digital_marketing', 'smart_messaging', 'common']);
    const [activeTab, setActiveTab] = useState('overview');

    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
    const [composerInitialDate, setComposerInitialDate] = useState<Date | undefined>(undefined);
    const [openWizardOnMount, setOpenWizardOnMount] = useState(false);

    const [socialPosts, setSocialPosts] = useState<SocialPost[]>(MOCK_SOCIAL_POSTS);
    const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

    const handleCreatePost = (newPost: Omit<SocialPost, 'id'>) => {
        setSocialPosts(prev => [{ ...newPost, id: `post-${Date.now()}` }, ...prev]);
        setIsCreatePostModalOpen(false);
    };

    const handleSendEmail = (data: { to: string; subject: string; body: string }) => {
        // Quick email creates a draft/completed campaign row locally (BUILD static).
        const newCampaign: Campaign = {
            id: `CAMP-${Date.now()}`,
            name: { en: data.subject, ar: data.subject },
            type: 'Awareness',
            objective: 'stewardship',
            status: 'Completed',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            channels: ['Email'],
            contentDraft: { subject: data.subject, body: data.body, language: 'en' },
            budget: 0,
            spent: 0,
            audience: { name: data.to, size: 1 },
            goal: { type: 'Subscribers', target: 1, current: 1 },
            owner: 'Current User',
            createdAt: new Date().toISOString(),
            messagesSent: 1,
            openRate: 0,
        };
        setCampaigns(prev => [newCampaign, ...prev]);
        setIsSendEmailModalOpen(false);
    };

    const handleCreateCampaign = (campaign: Campaign) => {
        setCampaigns(prev => [campaign, ...prev]);
    };

    const handleDeleteCampaign = (id: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
    };

    const openComposer = (date?: Date) => {
        setComposerInitialDate(date);
        setIsCreatePostModalOpen(true);
    };

    const goCreateCampaign = () => {
        setOpenWizardOnMount(true);
        setActiveTab('campaigns');
    };

    const tabs = [
        { id: 'overview', label: t('digital_marketing.tabs.overview'), icon: BarChart3 },
        { id: 'campaigns', label: t('digital_marketing.tabs.campaigns'), icon: Megaphone },
        { id: 'outreach', label: t('digital_marketing.tabs.outreach'), icon: MessageCircleMore },
        { id: 'social', label: t('digital_marketing.tabs.social'), icon: Share2 },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <MarketingDashboard
                        setActiveTab={setActiveTab}
                        onOpenCreateCampaign={goCreateCampaign}
                        onOpenCreatePostModal={() => openComposer()}
                        onOpenSendEmailModal={() => setIsSendEmailModalOpen(true)}
                    />
                );
            case 'campaigns':
                return (
                    <CampaignsTab
                        campaigns={campaigns}
                        onCreateCampaign={handleCreateCampaign}
                        onDeleteCampaign={handleDeleteCampaign}
                        openWizard={openWizardOnMount}
                        onWizardOpened={() => setOpenWizardOnMount(false)}
                    />
                );
            case 'outreach':
                return <OutreachTab role={role} />;
            case 'social':
                return <SocialMediaTab posts={socialPosts} openComposer={openComposer} />;
            default:
                return null;
        }
    };

    return (
        <>
            <main
                className="-m-4 min-h-[calc(100vh-4rem)] bg-[#f6f7f9] p-5 text-[#182338] sm:-m-6 sm:p-7 lg:p-8"
                dir={dir}
            >
                <div className="mx-auto max-w-[1540px] animate-fade-in">
                    <header className="mb-7 flex items-end justify-between gap-8">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#233b63]">
                                <span className="h-2 w-2 rounded-full bg-[#e7a83e]" />
                                {t('digital_marketing.redesign.workspace')}
                            </div>
                            <h1 className="text-[2rem] font-black tracking-[-0.035em] text-[#101d33]">
                                {t('digital_marketing.title')}
                            </h1>
                            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#687386]">
                                {t('digital_marketing.redesign.subtitle')}
                            </p>
                        </div>
                        <div className="hidden items-center gap-2 rounded-full border border-[#dce1e8] bg-white px-4 py-2 text-xs font-semibold text-[#56637a] shadow-[0_8px_30px_rgba(19,36,66,0.05)] lg:flex">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34a177] opacity-40" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#24946b]" />
                            </span>
                            {t('digital_marketing.redesign.updated')}
                        </div>
                    </header>

                    <nav
                        aria-label={t('digital_marketing.title')}
                        className="mb-7 flex w-fit items-center gap-1 rounded-xl border border-[#dfe3ea] bg-white p-1.5 shadow-[0_10px_30px_rgba(19,36,66,0.04)]"
                    >
                        {tabs.map(({ id, label, icon: Icon }) => {
                            const selected = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveTab(id)}
                                    aria-current={selected ? 'page' : undefined}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                                        selected
                                            ? 'bg-[#142542] text-white shadow-[0_7px_18px_rgba(20,37,66,0.2)]'
                                            : 'text-[#6f7989] hover:bg-[#f1f3f6] hover:text-[#243653]'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={selected ? 2.3 : 1.8} />
                                    {label}
                                </button>
                            );
                        })}
                    </nav>

                    <div>
                    {renderContent()}
                    </div>
                </div>
            </main>

            <CreatePostModal
                isOpen={isCreatePostModalOpen}
                onClose={() => setIsCreatePostModalOpen(false)}
                onCreatePost={handleCreatePost}
                initialDate={composerInitialDate}
            />
            <SendEmailModal
                isOpen={isSendEmailModalOpen}
                onClose={() => setIsSendEmailModalOpen(false)}
                onSend={handleSendEmail}
            />
        </>
    );
};

export default DigitalMarketing;
