
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { IndividualDonor, MessageType, GeneratedMessage, Language } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { generatePersonalizedMessage } from '../../../lib/smartMessaging';
import { MOCK_MESSAGE_TEMPLATES } from '../../../data/smartMessagingData';
import { langToFlag } from '../../icons/FlagIcons';
import { channelIcons } from '../../icons/ChannelIcons';
import Spinner from '../../common/Spinner';
import { SUPPORTED_LANGUAGES } from '../../../lib/i18n';

interface LivePreviewPanelProps {
    targetDonors: IndividualDonor[];
    campaignType: MessageType;
    personalizationLevel: 'Low' | 'Medium' | 'High';
    languageSelection: 'auto' | Language;
}

const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({ targetDonors, campaignType, personalizationLevel, languageSelection }) => {
    const { t } = useLocalization(['smart_messaging', 'common']);
    const [previewDonor, setPreviewDonor] = useState<IndividualDonor | null>(null);
    const [previewMessage, setPreviewMessage] = useState<Partial<GeneratedMessage> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messageDir = useMemo(() => {
        const lang = previewMessage?.language;
        if (!lang) return 'ltr';
        return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
    }, [previewMessage]);

    useEffect(() => {
        if (targetDonors.length > 0 && (!previewDonor || !targetDonors.some(d => d.id === previewDonor.id))) {
            setPreviewDonor(targetDonors[0]);
        }
        if (targetDonors.length === 0) {
            setPreviewDonor(null);
        }
    }, [targetDonors, previewDonor]);

    const regeneratePreview = useCallback(async () => {
        if (!previewDonor) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const generated = await generatePersonalizedMessage(previewDonor, campaignType, personalizationLevel, languageSelection, MOCK_MESSAGE_TEMPLATES);
            setPreviewMessage(generated);
        } catch (err) {
            console.error(err);
            setError("Failed to generate preview.");
        } finally {
            setIsLoading(false);
        }
    }, [previewDonor, campaignType, personalizationLevel, languageSelection]);

    useEffect(() => {
        const handler = setTimeout(() => {
            regeneratePreview();
        }, 500); // Debounce
        return () => clearTimeout(handler);
    }, [regeneratePreview]);

    const handleDonorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const donor = targetDonors.find(d => d.id === e.target.value);
        setPreviewDonor(donor || null);
    };
    
    const LanguageFlag = previewMessage?.language ? langToFlag[previewMessage.language] : null;
    const ChannelIcon = previewMessage?.send_channel ? channelIcons[previewMessage.send_channel] : null;

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50 sticky top-24">
            <h3 className="text-lg font-bold p-4 border-b dark:border-slate-700">{t('smart_messaging.preview.title')}</h3>
            <div className="p-4 border-b dark:border-slate-700">
                <label className="text-sm font-medium mr-2">{t('smart_messaging.preview.preview_for')}</label>
                <select onChange={handleDonorChange} value={previewDonor?.id || ''} className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                    {targetDonors.map(d => <option key={d.id} value={d.id}>{d.fullName.en}</option>)}
                </select>
                <button onClick={regeneratePreview} className="text-xs font-semibold text-primary mt-2">
                    {t('smart_messaging.preview.regenerate')}
                </button>
            </div>
            <div className="p-4 h-[500px] overflow-y-auto">
                {isLoading && <div className="flex items-center justify-center h-full"><Spinner text={t('common.generating')} /></div>}
                {error && <div className="text-center text-red-500">{error}</div>}
                {!isLoading && !error && previewMessage && (
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-gray-500">
                            {LanguageFlag && <div className="flex items-center gap-1"><LanguageFlag /> {previewMessage.language?.toUpperCase()}</div>}
                            {ChannelIcon && <div className="flex items-center gap-1"><ChannelIcon className="w-4 h-4"/> {previewMessage.send_channel}</div>}
                        </div>
                        <p className="text-sm"><strong>To:</strong> {previewDonor?.fullName.en}</p>
                        <p className="text-sm"><strong>{t('smart_messaging.results.columns.subject')}:</strong> {previewMessage.generated_subject}</p>
                        <div className="border-t dark:border-slate-700 my-2"></div>
                        <div className="text-sm whitespace-pre-wrap" dir={messageDir}>{previewMessage.generated_body}</div>
                    </div>
                )}
            </div>
             <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl space-y-2">
                 <div>
                    <div className="flex justify-between text-xs font-semibold">
                        <span>{t('smart_messaging.preview.score')}</span>
                        <span>{previewMessage?.personalization_score || 0}%</span>
                    </div>
                     <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${previewMessage?.personalization_score || 0}%`}}></div></div>
                 </div>
                 <div>
                     <div className="flex justify-between text-xs font-semibold">
                        <span>{t('smart_messaging.preview.open_rate')}</span>
                        <span>{previewMessage?.predicted_open_rate || 0}%</span>
                    </div>
                     <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${previewMessage?.predicted_open_rate || 0}%`}}></div></div>
                </div>
            </div>
        </div>
    );
};

export default LivePreviewPanel;
