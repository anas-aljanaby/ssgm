import React, { useState } from 'react';
import { CirclePlus, Globe, Mail, MapPin, Phone } from 'lucide-react';
import type { ContactPerson, Partner } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import AddContactModal from '../../donors_institutional/AddContactModal';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary dark:text-secondary mt-1">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
            <div className="font-semibold text-foreground dark:text-dark-foreground break-words">{value}</div>
        </div>
    </div>
);

const ContactPersonCard: React.FC<{ contact: ContactPerson; primaryLabel: string }> = ({ contact, primaryLabel }) => (
    <div className={`bg-card dark:bg-dark-card rounded-xl shadow-md p-4 border dark:border-slate-700/50 relative ${contact.isPrimary ? 'ring-2 ring-secondary' : ''}`}>
        {contact.isPrimary && (
            <span className="absolute top-2 left-2 text-xs font-bold bg-secondary text-white px-2 py-0.5 rounded-full">
                {primaryLabel}
            </span>
        )}
        <div className="flex flex-col items-center text-center">
            <img
                src={contact.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                alt={contact.name}
                className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-600 mb-3 object-cover"
            />
            <h4 className="font-bold text-lg text-foreground dark:text-dark-foreground">{contact.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.position}</p>
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
        </div>
    </div>
);

interface ContactTabProps {
    partner: Partner;
}

const ContactTab: React.FC<ContactTabProps> = ({ partner }) => {
    const { t } = useLocalization(['partners', 'institutional_donors', 'common']);
    const toast = useToast();
    const [contacts, setContacts] = useState<ContactPerson[]>(partner.contacts ?? []);
    const [addOpen, setAddOpen] = useState(false);
    const na = <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>;

    const handleAdd = (contact: Omit<ContactPerson, 'id'>) => {
        setContacts((prev) => [{ ...contact, id: `pc-${Date.now()}` }, ...prev]);
        toast.showSuccess(t('institutional_donors.contacts.addSuccess', 'Contact added successfully!'));
        setAddOpen(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-inner border dark:border-slate-700/50">
                <h3 className="text-xl font-bold mb-4">{t('institutional_donors.detail.contactInfoTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <InfoRow icon={<Phone size={18} />} label={t('institutional_donors.detail.phone')} value={partner.phone || na} />
                        <InfoRow
                            icon={<Mail size={18} />}
                            label={t('institutional_donors.detail.email')}
                            value={partner.email ? <a href={`mailto:${partner.email}`} className="text-primary hover:underline">{partner.email}</a> : na}
                        />
                        <InfoRow
                            icon={<Globe size={18} />}
                            label={t('institutional_donors.detail.website')}
                            value={partner.website ? (
                                <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {partner.website}
                                </a>
                            ) : na}
                        />
                        <InfoRow
                            icon={<MapPin size={18} />}
                            label={t('institutional_donors.detail.address')}
                            value={partner.address ? (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {partner.address}
                                </a>
                            ) : na}
                        />
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-lg min-h-[200px] text-gray-400">
                        <MapPin className="mr-2" />
                        {t('partners.detail.noLocation')}
                    </div>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4 mt-8">
                    <h3 className="text-xl font-bold">{t('partners.detail.contactsTitle')}</h3>
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg"
                    >
                        <CirclePlus size={18} /> {t('partners.detail.addContact')}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map((contact) => (
                        <ContactPersonCard key={contact.id} contact={contact} primaryLabel={t('institutional_donors.detail.form.isPrimary')} />
                    ))}
                </div>
            </div>

            <AddContactModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
        </div>
    );
};

export default ContactTab;
