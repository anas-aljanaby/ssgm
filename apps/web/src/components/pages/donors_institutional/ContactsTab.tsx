import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OPTIMISTIC_HIGHLIGHT_MS, simulateLocalPersist } from '../../../lib/optimisticSubmit';
import { buildOptimisticContact, isOptimisticContact } from '../../../lib/contactOptimistic';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import type { InstitutionalDonor } from '../../../types';
import { Mail, Phone, PlusCircle, Globe, Linkedin, Twitter, Facebook, MapPin, Handshake, Trash2 } from 'lucide-react';
import AddContactModal from './AddContactModal';

// Self-contained WhatsappIcon to avoid dependency on missing file
const WhatsappIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor">
        <path d="M18.4,6.5C16.3,4.5,13.8,3.5,11,3.5C5.8,3.5,1.5,7.8,1.5,13c0,1.8,0.5,3.5,1.4,5l-1.6,5.8l6-1.6 c1.4,0.8,3,1.3,4.7,1.3h0c5.2,0,9.5-4.3,9.5-9.5C21.5,10.2,20.5,7.8,18.4,6.5z M11,21.8L11,21.8c-1.6,0-3.2-0.5-4.5-1.3l-0.3-0.2 l-3.3,0.9l0.9-3.2l-0.2-0.3c-0.9-1.3-1.4-2.9-1.4-4.6c0-4.6,3.7-8.3,8.3-8.3c2.2,0,4.3,0.9,5.8,2.4c1.6,1.6,2.4,3.6,2.4,5.8 C20.1,18,16.4,21.8,11,21.8z M15.9,14.4c-0.2-0.1-1.3-0.6-1.5-0.7c-0.2-0.1-0.3-0.1-0.5,0.1c-0.2,0.2-0.5,0.7-0.7,0.8 c-0.1,0.1-0.3,0.2-0.5,0.1c-0.2-0.1-1-0.4-1.9-1.2c-0.7-0.6-1.2-1.4-1.3-1.6c-0.1-0.2,0-0.3,0.1-0.4c0.1-0.1,0.2-0.2,0.3-0.4 c0.1-0.1,0.2-0.2,0.2-0.4c0.1-0.2,0-0.3,0-0.4C10.1,10,10,9.5,9.8,9.1C9.7,8.6,9.5,8.7,9.4,8.7c-0.1,0-0.3,0-0.5,0 s-0.5,0.1-0.7,0.3c-0.2,0.2-0.9,0.8-0.9,2c0,1.2,0.9,2.3,1,2.5c0.1,0.2,1.8,2.8,4.4,3.9c0.6,0.2,1.1,0.4,1.4,0.5 c0.5,0.2,1,0.2,1.3,0.1c0.4-0.1,1.3-0.5,1.4-1c0.2-0.5,0.2-0.9,0.1-1C16.2,14.6,16.1,14.5,15.9,14.4z" />
    </svg>
);

export interface Contact {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  isPrimary: boolean;
  photoUrl?: string;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary dark:text-secondary mt-1">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
            <div className="font-semibold text-foreground dark:text-dark-foreground break-words">{value}</div>
        </div>
    </div>
);

const ContactInfoCard: React.FC<{ donor: InstitutionalDonor }> = ({ donor }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);
    const socialPlatforms = donor.socialMedia ? Object.entries(donor.socialMedia).filter(([, url]) => url) : [];
    const NA_Component = <span className="text-gray-400 dark:text-gray-500 italic">{t('common.notAvailable')}</span>;

    return (
        <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-inner border dark:border-slate-700/50">
            <h3 className="text-xl font-bold mb-4">{t('institutional_donors.detail.contactInfoTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Details */}
                <div className="space-y-6">
                    <InfoItem icon={<Phone size={18} />} label={t('institutional_donors.detail.phone')} value={donor.phone || NA_Component} />
                    <InfoItem icon={<Mail size={18} />} label={t('institutional_donors.detail.email')} value={<a href={`mailto:${donor.primaryContact.email}`} className="text-primary hover:underline">{donor.primaryContact.email}</a>} />
                    <InfoItem icon={<Globe size={18} />} label={t('institutional_donors.detail.website')} value={donor.website ? <a href={donor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{donor.website}</a> : NA_Component} />
                    {socialPlatforms.length > 0 && (
                         <InfoItem 
                            icon={<Handshake size={18} />} 
                            label={t('institutional_donors.detail.socialMedia')} 
                            value={
                                <div className="flex items-center gap-4 mt-1">
                                    {donor.socialMedia?.linkedin && <a href={donor.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary"><Linkedin /></a>}
                                    {donor.socialMedia?.twitter && <a href={donor.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary"><Twitter /></a>}
                                    {donor.socialMedia?.facebook && <a href={donor.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary"><Facebook /></a>}
                                </div>
                            } 
                        />
                    )}
                    <InfoItem icon={<MapPin size={18} />} label={t('institutional_donors.detail.address')} value={donor.address ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donor.address)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{donor.address}</a> : NA_Component} />
                </div>

                {/* Right Column: Map */}
                <div className={`rounded-lg overflow-hidden border dark:border-slate-700 h-64 md:h-full min-h-[250px] ${!donor.coordinates ? 'flex items-center justify-center bg-gray-100 dark:bg-slate-800' : ''}`}>
                    {donor.coordinates ? (
                        <iframe
                            width="100%"
                            height="100%"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://maps.google.com/maps?q=${donor.coordinates.lat},${donor.coordinates.lng}&hl=${language}&z=14&amp;output=embed`}
                            style={{ border: 0 }}
                        >
                        </iframe>
                    ) : (
                        <div className="text-center text-gray-500">
                            <MapPin size={32} className="mx-auto mb-2"/>
                            {t('institutional_donors.detail.noLocation')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// Mock data based on the donor prop
const getMockContacts = (donor: InstitutionalDonor): Contact[] => {
    return [
        {
            id: `contact-primary-${donor.id}`,
            name: donor.primaryContact.name,
            position: 'Program Director, MENA', // Mock position
            email: donor.primaryContact.email,
            phone: donor.phone || '+32 2 299 11 11',
            whatsapp: '+32 475 12 34 56',
            isPrimary: true,
            photoUrl: `https://picsum.photos/seed/${donor.primaryContact.name.split(' ')[0]}/200/200`,
        },
        {
            id: `contact-${donor.id}-2`,
            name: 'Jean-Luc Picard',
            position: 'Grants Officer',
            email: 'jl.picard@eda.eu',
            phone: '+32 2 299 11 12',
            isPrimary: false,
            photoUrl: 'https://picsum.photos/seed/Picard/200/200',
        },
        {
            id: `contact-${donor.id}-3`,
            name: 'Catherine Janeway',
            position: 'Head of Compliance',
            email: 'c.janeway@eda.eu',
            isPrimary: false,
            photoUrl: 'https://picsum.photos/seed/Janeway/200/200',
        },
    ];
};

interface ContactsTabProps {
    donor: InstitutionalDonor;
}

const ContactCard: React.FC<{ contact: Contact; highlighted?: boolean; onDelete?: () => void }> = ({ contact, highlighted = false, onDelete }) => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const optimistic = isOptimisticContact(contact.id);
    return (
        <div className={`bg-card dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-slate-700 shadow-sm relative transition-shadow ${
            optimistic
                ? 'opacity-70 animate-pulse'
                : 'hover:shadow-md'
        } ${highlighted ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}>
            <div className="absolute top-3 right-3 flex items-center gap-2">
                {contact.isPrimary && (
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/40 dark:text-blue-200">
                        {t('institutional_donors.detail.form.isPrimary')}
                    </span>
                )}
                {onDelete && !optimistic && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        aria-label={t('institutional_donors.detail.deleteContact')}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            <div className="flex flex-col items-center text-center">
                 <img 
                    src={contact.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`} 
                    alt={contact.name}
                    className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-600 mb-3"
                />
                <h4 className="font-bold text-lg text-foreground dark:text-dark-foreground">{contact.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{optimistic ? t('common.saving') : contact.position}</p>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-slate-600 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline truncate">{contact.email}</a>
                </div>
                {contact.phone && (
                    <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-foreground dark:text-dark-foreground">{contact.phone}</span>
                    </div>
                )}
                {contact.whatsapp && (
                    <div className="flex items-center gap-2">
                        <WhatsappIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-foreground dark:text-dark-foreground">{contact.whatsapp}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ContactsTab: React.FC<ContactsTabProps> = ({ donor }) => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();
    const [contacts, setContacts] = useState<Contact[]>(() => getMockContacts(donor));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setContacts(getMockContacts(donor));
    }, [donor.id]);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: string) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    const handleAddContact = (newContactData: Omit<Contact, 'id' | 'isPrimary'> & { isPrimary?: boolean }) => {
        const optimistic = buildOptimisticContact(newContactData);
        setContacts(prev => [optimistic, ...prev]);

        void simulateLocalPersist((): Contact => ({
            ...optimistic,
            id: `contact-${donor.id}-${Date.now()}`,
        })).then((created) => {
            setContacts(prev => prev.map(c => (c.id === optimistic.id ? created : c)));
            flashHighlight(created.id);
            toast.showSuccess(t('institutional_donors.detail.contactAdded'));
        }).catch(() => {
            setContacts(prev => prev.filter(c => c.id !== optimistic.id));
            toast.showError(t('institutional_donors.errors.generic'));
        });
    };

    const handleDeleteContact = (contactId: string) => {
        if (!window.confirm(t('institutional_donors.detail.deleteContactConfirm'))) {
            return;
        }
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        toast.showInfo(t('institutional_donors.detail.contactDeleted'));
    };

    return (
        <div className="animate-fade-in space-y-6">
            <ContactInfoCard donor={donor} />

            <div>
                <div className="flex justify-between items-center mb-4 mt-8">
                     <h3 className="text-xl font-bold">{t('institutional_donors.detail.contactsListTitle')}</h3>
                     <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg">
                        <PlusCircle /> {t('institutional_donors.detail.addContact')}
                    </button>
                </div>
                {contacts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-slate-600 dark:text-gray-400">
                        {t('institutional_donors.detail.noContacts')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                highlighted={highlightedId === contact.id}
                                onDelete={() => handleDeleteContact(contact.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <AddContactModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddContact}
            />
        </div>
    );
};

export default ContactsTab;
