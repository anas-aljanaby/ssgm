import React, { useState } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { XIcon } from '../../../icons/GenericIcons';
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from '../../../icons/SocialMediaIcons';
import type { SocialPlatform } from '../../../../types';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreatePost: (post: any) => void;
    initialDate?: Date;
}

const platforms: { id: SocialPlatform, name: string, icon: React.FC }[] = [
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon },
    { id: 'twitter', name: 'Twitter', icon: TwitterIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon },
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onCreatePost, initialDate }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatform>>(new Set(['facebook']));
    const [content, setContent] = useState('');
    const [scheduledTime, setScheduledTime] = useState(initialDate ? initialDate.toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16));

    const handlePlatformToggle = (platformId: SocialPlatform) => {
        const newSelection = new Set(selectedPlatforms);
        if (newSelection.has(platformId)) {
            newSelection.delete(platformId);
        } else {
            newSelection.add(platformId);
        }
        setSelectedPlatforms(newSelection);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPlatforms.size === 0 || !content.trim()) {
            alert("Please select a platform and write some content.");
            return;
        }

        selectedPlatforms.forEach(platform => {
            onCreatePost({
                id: `post-${Date.now()}-${Math.random()}`,
                platform,
                status: 'scheduled',
                scheduledTime,
                content,
            });
        });
        
        // Reset state
        setContent('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                        {t('digital_marketing.social.createPost')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Close modal">
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-semibold mb-2">{t('digital_marketing.social.postTo')}</label>
                            <div className="flex flex-wrap gap-2">
                                {platforms.map(({id, name, icon: Icon}) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => handlePlatformToggle(id)}
                                        className={`flex items-center gap-2 p-2 border-2 rounded-lg transition-colors ${selectedPlatforms.has(id) ? 'border-primary bg-primary-light/50' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <Icon />
                                        <span className="text-sm font-medium">{name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label htmlFor="post-content" className="block text-sm font-semibold mb-2">{t('digital_marketing.social.content')}</label>
                             <textarea 
                                id="post-content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={8}
                                placeholder={t('digital_marketing.social.contentPlaceholder')}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="schedule-time" className="block text-sm font-semibold mb-2">{t('digital_marketing.social.scheduleTime')}</label>
                            <input 
                                type="datetime-local" 
                                id="schedule-time"
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark">{t('digital_marketing.social.schedulePost')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
