
import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { Mail, Link2, CalendarPlus, X, Send } from 'lucide-react';
import Spinner from '../common/Spinner';
import ModalPortal from '../common/ModalPortal';

interface ShareMenuProps {
    dashboardId: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ dashboardId }) => {
    const { t, dir } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'email' | 'link' | 'schedule'>('email');

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const TabButton: React.FC<{ id: 'email' | 'link' | 'schedule'; icon: React.ReactNode; label: string }> = ({
        id,
        icon,
        label,
    }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === id ? 'bg-white dark:bg-slate-700 shadow' : 'text-gray-500 hover:bg-white/50'
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <>
            <button
                onClick={handleOpen}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
            >
                <Mail size={16} /> {t('shareMenu.share')}
            </button>
            <ModalPortal
                isOpen={isOpen}
                onClose={handleClose}
                dir={dir === 'rtl' ? 'rtl' : 'ltr'}
            >
                <div
                    className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4 flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold">{t('shareMenu.modalTitle')}</h2>
                        <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                            <X />
                        </button>
                    </div>

                    <div className="p-4 border-b dark:border-slate-700">
                        <div className="flex justify-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                            <TabButton id="email" icon={<Mail size={16} />} label={t('shareMenu.tabs.email')} />
                            <TabButton id="link" icon={<Link2 size={16} />} label={t('shareMenu.tabs.link')} />
                            <TabButton id="schedule" icon={<CalendarPlus size={16} />} label={t('shareMenu.tabs.schedule')} />
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {activeTab === 'email' && <EmailTab onClose={handleClose} />}
                        {activeTab === 'link' && <LinkTab dashboardId={dashboardId} />}
                        {activeTab === 'schedule' && <ScheduleTab onClose={handleClose} />}
                    </div>
                </div>
            </ModalPortal>
        </>
    );
};

const EmailTab: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { t } = useLocalization();
    const toast = useToast();
    const [isSending, setIsSending] = useState(false);
    const [form, setForm] = useState({ to: '', subject: t('shareMenu.email.defaultSubject'), message: t('shareMenu.email.defaultMessage') });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({...form, [e.target.name]: e.target.value});
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.to.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
            toast.showError(t('shareMenu.email.invalidAddress'), {title: t('shareMenu.email.invalidTitle')});
            return;
        }
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            toast.showSuccess(t('shareMenu.email.sentSuccess'), {title: t('shareMenu.email.sentTitle')});
            onClose();
        }, 1500);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('shareMenu.email.to')}>
                <input type="email" name="to" value={form.to} onChange={handleChange} required />
            </FormField>
             <FormField label={t('shareMenu.email.subject')}>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} required />
            </FormField>
             <FormField label={t('shareMenu.email.message')}>
                <textarea name="message" value={form.message} onChange={handleChange} rows={4} />
            </FormField>
            <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSending} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-primary rounded-lg disabled:bg-gray-400">
                    {isSending ? <Spinner size="w-5 h-5"/> : <Send size={16} />}
                    {isSending ? t('shareMenu.email.sending') : t('shareMenu.email.send')}
                </button>
            </div>
        </form>
    );
};

const LinkTab: React.FC<{dashboardId: string}> = ({dashboardId}) => {
    const { t } = useLocalization();
    const toast = useToast();
    const [link, setLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // Generate a mock unique link
        const token = Math.random().toString(36).substring(2, 12);
        setLink(`${window.location.origin}/share/dashboard/${dashboardId}?token=${token}`);
    }, [dashboardId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(link).then(() => {
            setIsCopied(true);
            toast.showSuccess(t('shareMenu.copySuccess'), {title: t('common.copied')});
            setTimeout(() => setIsCopied(false), 2000);
        });
    }
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">{t('shareMenu.link.description')}</p>
            <div className="relative">
                <input type="text" value={link} readOnly className="w-full p-2 pe-20 border rounded-md bg-gray-100 dark:bg-slate-800" />
                <button onClick={handleCopy} className="absolute end-1 top-1 bottom-1 px-4 text-sm font-semibold bg-gray-200 dark:bg-slate-700 rounded-md">
                    {isCopied ? t('common.copied') : t('shareMenu.link.copy')}
                </button>
            </div>
        </div>
    );
};

const ScheduleTab: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { t } = useLocalization();
    const toast = useToast();
    const [isScheduling, setIsScheduling] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsScheduling(true);
        setTimeout(() => {
            setIsScheduling(false);
            toast.showSuccess(t('shareMenu.schedule.scheduledSuccess'), {title: t('shareMenu.schedule.scheduledTitle')});
            onClose();
        }, 1500);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">{t('shareMenu.schedule.description')}</p>
            <div className="grid grid-cols-2 gap-4">
                <FormField label={t('shareMenu.schedule.frequency')}>
                    <select>
                        <option>{t('shareMenu.schedule.frequencies.daily')}</option>
                        <option>{t('shareMenu.schedule.frequencies.weekly')}</option>
                        <option>{t('shareMenu.schedule.frequencies.monthly')}</option>
                    </select>
                </FormField>
                 <FormField label={t('shareMenu.schedule.time')}>
                    <input type="time" defaultValue="09:00" />
                </FormField>
            </div>
             <FormField label={t('shareMenu.schedule.recipients')}>
                <input type="email" placeholder={t('shareMenu.schedule.recipientsPlaceholder')} />
            </FormField>
             <div className="flex justify-end pt-4">
                <button type="submit" disabled={isScheduling} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-primary rounded-lg disabled:bg-gray-400">
                    {isScheduling ? <Spinner size="w-5 h-5"/> : <CalendarPlus size={16} />}
                    {isScheduling ? t('shareMenu.schedule.scheduling') : t('shareMenu.schedule.scheduleBtn')}
                </button>
            </div>
        </form>
    );
};

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, {
            className: `w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 ${((children as React.ReactElement).props as any).className || ''}`.trim()
        }) : children}
    </div>
)

export default ShareMenu;
