import React from 'react';
import type { Campaign, OutreachChannel, Language } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';

interface Step3ChannelContentProps {
    campaignData: Partial<Campaign>;
    updateData: (data: Partial<Campaign>) => void;
    errors?: Record<string, string>;
}

const CHANNELS: OutreachChannel[] = ['Email', 'SMS', 'WhatsApp', 'Social'];

const Step3ChannelContent: React.FC<Step3ChannelContentProps> = ({ campaignData, updateData, errors = {} }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);
    const primary = (campaignData.channels?.[0] as OutreachChannel) || 'Email';
    const draft = campaignData.contentDraft || {};

    const setChannel = (channel: OutreachChannel) => {
        updateData({ channels: [channel] });
    };

    const setDraft = (patch: Partial<NonNullable<Campaign['contentDraft']>>) => {
        updateData({ contentDraft: { ...draft, ...patch } });
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{t('digital_marketing.wizard.step3.title')}</h2>
                <p className="text-gray-500">{t('digital_marketing.wizard.step3.description')}</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step3.primaryChannel')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CHANNELS.map(ch => (
                            <button
                                key={ch}
                                type="button"
                                onClick={() => setChannel(ch)}
                                className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                    primary === ch
                                        ? 'border-primary bg-primary-light/40 dark:bg-primary/20 text-primary'
                                        : 'border-gray-200 dark:border-slate-700 hover:border-primary/40'
                                }`}
                            >
                                {t(`digital_marketing.campaigns.channels.${ch.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                    {errors.channel && <p className="mt-1 text-xs text-red-600">{errors.channel}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step3.language')}</label>
                    <select
                        value={draft.language || 'en'}
                        onChange={e => setDraft({ language: e.target.value as Language })}
                        className="w-full max-w-xs p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                    >
                        <option value="en">{t('digital_marketing.wizard.step3.langEn')}</option>
                        <option value="ar">{t('digital_marketing.wizard.step3.langAr')}</option>
                    </select>
                </div>

                {(primary === 'Email' || primary === 'Social') && (
                    <div>
                        <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step3.subject')}</label>
                        <input
                            type="text"
                            value={draft.subject || ''}
                            onChange={e => setDraft({ subject: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                        />
                        {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step3.body')}</label>
                    <textarea
                        rows={6}
                        value={draft.body || ''}
                        onChange={e => setDraft({ body: e.target.value })}
                        className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                        placeholder={t('digital_marketing.wizard.step3.bodyPlaceholder')}
                    />
                    {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                </div>
            </div>
        </div>
    );
};

export default Step3ChannelContent;
