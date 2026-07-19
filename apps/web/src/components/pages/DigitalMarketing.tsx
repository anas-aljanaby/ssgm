import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import type { Role, SocialPost, Campaign } from '../../types';
import { MOCK_SOCIAL_POSTS } from '../../data/socialMediaData';
import { MOCK_CAMPAIGNS } from '../../data/campaignsData';
import Tabs from '../common/Tabs';
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
    const { t } = useLocalization(['digital_marketing', 'smart_messaging', 'common']);
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
        { id: 'overview', label: t('digital_marketing.tabs.overview') },
        { id: 'campaigns', label: t('digital_marketing.tabs.campaigns') },
        { id: 'outreach', label: t('digital_marketing.tabs.outreach') },
        { id: 'social', label: t('digital_marketing.tabs.social') },
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
            <div className="animate-fade-in space-y-4">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                    {t('digital_marketing.title')}
                </h1>

                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

                <div className="mt-2">
                    {renderContent()}
                </div>
            </div>

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
