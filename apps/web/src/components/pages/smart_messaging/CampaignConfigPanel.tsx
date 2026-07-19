
import React, { useState, useRef, useEffect } from 'react';
import type { MessageType, Language } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { GlobeIcon, ChevronDownIcon } from '../../icons/GenericIcons';
import { langToFlag } from '../../icons/FlagIcons';

interface CampaignConfigPanelProps {
    config: {
        timing: string;
        channels: string[];
        personalizationLevel: 'Low' | 'Medium' | 'High';
        language: 'auto' | Language;
    };
    onConfigChange: (config: any) => void;
    messageType: MessageType;
}

const CampaignConfigPanel: React.FC<CampaignConfigPanelProps> = ({ config, onConfigChange, messageType }) => {
    const { t } = useLocalization(['smart_messaging', 'common']);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setLangDropdownOpen(false);
        }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languageOptions: { value: 'auto' | Language, label: string, Icon: React.FC | string }[] = [
        { value: 'auto', label: t('smart_messaging.config.lang_auto'), Icon: '🤖' },
        { value: 'ar', label: t('smart_messaging.config.lang_ar'), Icon: langToFlag['ar'] },
        { value: 'en', label: t('smart_messaging.config.lang_en'), Icon: langToFlag['en'] },
        { value: 'tr', label: t('smart_messaging.config.lang_tr'), Icon: langToFlag['tr'] },
    ];
    
    const selectedOption = languageOptions.find(opt => opt.value === config.language);
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const level = Number(e.target.value);
        let personalizationLevel: 'Low' | 'Medium' | 'High' = 'Low';
        if (level > 60) personalizationLevel = 'High';
        else if (level > 30) personalizationLevel = 'Medium';
        onConfigChange({ ...config, personalizationLevel });
    };

    const sliderValue = config.personalizationLevel === 'High' ? 100 : config.personalizationLevel === 'Medium' ? 50 : 0;

    const personalizationDesc = {
        Low: t('smart_messaging.personalization.low_desc'),
        Medium: t('smart_messaging.personalization.medium_desc'),
        High: t('smart_messaging.personalization.high_desc'),
    };
    
    const languageDescription = config.language === 'auto'
        ? t('smart_messaging.config.messageLanguage_desc_auto')
        : t('smart_messaging.config.messageLanguage_desc_specific', { language: languageOptions.find(l => l.value === config.language)?.label || '' });

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50">
            <h3 className="text-lg font-bold p-4 border-b dark:border-slate-700">{t('smart_messaging.config.title')}</h3>
            <div className="p-4 space-y-6">
                
                {/* Message Language */}
                 <div>
                    <h4 className="text-sm font-semibold mb-2">{t('smart_messaging.config.messageLanguage')}</h4>
                     <div className="relative" ref={langDropdownRef}>
                        <button type="button" onClick={() => setLangDropdownOpen(!langDropdownOpen)} className="relative w-full flex items-center p-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-left">
                            <span className="text-gray-500 dark:text-gray-400">
                                {selectedOption && typeof selectedOption.Icon !== 'string' ? <selectedOption.Icon /> : <GlobeIcon />}
                            </span>
                            <span className="mx-2 flex-1 truncate">{selectedOption?.label}</span>
                            <ChevronDownIcon />
                        </button>
                        {langDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 animate-scale-in-fast">
                                {languageOptions.map(option => {
                                    const Icon = option.Icon;
                                    return (
                                        <a href="#" key={option.value} onClick={e => { e.preventDefault(); onConfigChange({...config, language: option.value}); setLangDropdownOpen(false); }}
                                           className={`flex items-center gap-3 px-4 py-2 text-sm text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-slate-700 ${config.language === option.value ? 'font-bold text-primary' : ''}`}>
                                            {typeof Icon === 'string' ? <span className="text-lg">{Icon}</span> : <Icon />}
                                            <span>{option.label}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">ℹ️ {languageDescription}</p>
                </div>

                {/* Send Timing */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">{t('smart_messaging.config.sendTiming')}</h4>
                    <div className="space-y-2">
                        {['sendImmediately', 'scheduleBest', 'customDateTime'].map(timing => (
                             <div key={timing} className="flex items-center">
                                <input type="radio" id={timing} name="timing" value={timing} checked={config.timing === timing} onChange={(e) => onConfigChange({...config, timing: e.target.value})} className="w-4 h-4 text-primary focus:ring-primary"/>
                                <label htmlFor={timing} className="ml-2 text-sm">{t(`smart_messaging.config.${timing}`)}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Personalization */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">{t('smart_messaging.personalization.title')}</h4>
                     <div className="flex items-center gap-4">
                        <span>{t('smart_messaging.personalization.low')}</span>
                        <input type="range" min="0" max="100" step="50" value={sliderValue} onChange={handleSliderChange} className="w-full"/>
                        <span>{t('smart_messaging.personalization.high')}</span>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-2">{personalizationDesc[config.personalizationLevel]}</p>
                </div>

            </div>
        </div>
    );
};

export default CampaignConfigPanel;
