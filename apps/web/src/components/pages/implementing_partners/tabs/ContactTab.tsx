import React, { useEffect, useState } from 'react';
import { CirclePlus, Globe, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react';
import type { ContactPerson, Partner } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import AddContactModal from '../../donors_institutional/AddContactModal';
import ConfirmationModal from '../../../common/ConfirmationModal';
import { EditActions, fieldClass } from '../shared';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-primary dark:text-secondary mt-1">{icon}</div>
        <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
            <div className="font-semibold text-foreground dark:text-dark-foreground break-words">{value}</div>
        </div>
    </div>
);

const ContactPersonCard: React.FC<{
    contact: ContactPerson;
    primaryLabel: string;
    onEdit: () => void;
    onDelete: () => void;
    deleteLabel: string;
    editLabel: string;
}> = ({ contact, primaryLabel, onEdit, onDelete, deleteLabel, editLabel }) => (
    <div className={`bg-card dark:bg-dark-card rounded-xl shadow-md p-4 border dark:border-slate-700/50 relative ${contact.isPrimary ? 'ring-2 ring-secondary' : ''}`}>
        {contact.isPrimary && (
            <span className="absolute top-2 left-2 text-xs font-bold bg-secondary text-white px-2 py-0.5 rounded-full">
                {primaryLabel}
            </span>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
            <button type="button" onClick={onEdit} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600" title={editLabel}>
                <Pencil size={14} />
            </button>
            <button type="button" onClick={onDelete} className="p-1.5 rounded-full hover:bg-red-100 text-red-500" title={deleteLabel}>
                <Trash2 size={14} />
            </button>
        </div>
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

interface ContactInfoForm {
    phone: string;
    email: string;
    website: string;
    address: string;
}

interface ContactTabProps {
    partner: Partner;
    onPartnerUpdate: (updated: Partner) => void;
    isSaving?: boolean;
}

const ContactTab: React.FC<ContactTabProps> = ({ partner, onPartnerUpdate, isSaving = false }) => {
    const { t } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const [contacts, setContacts] = useState<ContactPerson[]>(partner.contacts ?? []);
    const [addOpen, setAddOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<ContactPerson | null>(null);
    const [contactToDelete, setContactToDelete] = useState<ContactPerson | null>(null);
    const [isInfoEditing, setIsInfoEditing] = useState(false);
    const [infoForm, setInfoForm] = useState<ContactInfoForm>({
        phone: partner.phone ?? '',
        email: partner.email ?? '',
        website: partner.website ?? '',
        address: partner.address ?? '',
    });

    useEffect(() => {
        if (!isInfoEditing) {
            setInfoForm({
                phone: partner.phone ?? '',
                email: partner.email ?? '',
                website: partner.website ?? '',
                address: partner.address ?? '',
            });
        }
    }, [partner, isInfoEditing]);

    useEffect(() => {
        setContacts(partner.contacts ?? []);
    }, [partner.contacts]);

    const na = <span className="text-gray-400 dark:text-gray-500 italic">{t('common.notAvailable', 'N/A')}</span>;

    const validateEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const persistPartner = (patch: Partial<Partner>) => {
        onPartnerUpdate({ ...partner, ...patch });
    };

    const handleSaveInfo = () => {
        if (!validateEmail(infoForm.email)) {
            toast.showError(t('partners.validation.invalidEmail'));
            return;
        }
        persistPartner({
            phone: infoForm.phone.trim() || undefined,
            email: infoForm.email.trim() || undefined,
            website: infoForm.website.trim() || undefined,
            address: infoForm.address.trim() || undefined,
        });
        setIsInfoEditing(false);
        toast.showSuccess(t('partners.detail.contactInfoSaveSuccess'));
    };

    const handleCancelInfo = () => {
        setInfoForm({
            phone: partner.phone ?? '',
            email: partner.email ?? '',
            website: partner.website ?? '',
            address: partner.address ?? '',
        });
        setIsInfoEditing(false);
    };

    const handleAdd = (contact: Omit<ContactPerson, 'id'>) => {
        const nextContacts = contact.isPrimary
            ? contacts.map((c) => ({ ...c, isPrimary: false }))
            : contacts;
        const newContact = { ...contact, id: `pc-${Date.now()}` };
        const updated = [newContact, ...nextContacts];
        setContacts(updated);
        persistPartner({ contacts: updated });
        toast.showSuccess(t('partners.detail.addContactSuccess'));
        setAddOpen(false);
    };

    const handleDelete = () => {
        if (!contactToDelete) return;
        const updated = contacts.filter((c) => c.id !== contactToDelete.id);
        setContacts(updated);
        persistPartner({ contacts: updated });
        toast.showSuccess(t('partners.detail.deleteContactSuccess'));
        setContactToDelete(null);
    };

    const handleEdit = (updatedContact: ContactPerson) => {
        const updated = contacts.map((contact) => {
            if (contact.id === updatedContact.id) return updatedContact;
            if (updatedContact.isPrimary) return { ...contact, isPrimary: false };
            return contact;
        });
        setContacts(updated);
        persistPartner({ contacts: updated });
        toast.showSuccess(t('partners.detail.editContactSuccess'));
        setContactToEdit(null);
    };

    const mapEmbedUrl = partner.coordinates
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${partner.coordinates.lng - 0.02}%2C${partner.coordinates.lat - 0.02}%2C${partner.coordinates.lng + 0.02}%2C${partner.coordinates.lat + 0.02}&layer=mapnik&marker=${partner.coordinates.lat}%2C${partner.coordinates.lng}`
        : null;
    const mapLinkUrl = partner.coordinates
        ? `https://www.openstreetmap.org/?mlat=${partner.coordinates.lat}&mlon=${partner.coordinates.lng}#map=14/${partner.coordinates.lat}/${partner.coordinates.lng}`
        : partner.address
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`
            : null;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-inner border dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{t('partners.detail.contactInfoTitle')}</h3>
                    <EditActions
                        isEditing={isInfoEditing}
                        isSaving={isSaving}
                        onEdit={() => setIsInfoEditing(true)}
                        onSave={handleSaveInfo}
                        onCancel={handleCancelInfo}
                        editLabel={t('common.edit')}
                        saveLabel={t('common.save')}
                        cancelLabel={t('common.cancel')}
                        savingLabel={t('common.loading')}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        {isInfoEditing ? (
                            <>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">{t('partners.detail.phone')}</label>
                                    <input className={fieldClass} value={infoForm.phone} onChange={(e) => setInfoForm((f) => ({ ...f, phone: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">{t('partners.detail.email')}</label>
                                    <input type="email" className={fieldClass} value={infoForm.email} onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">{t('partners.detail.website')}</label>
                                    <input className={fieldClass} value={infoForm.website} onChange={(e) => setInfoForm((f) => ({ ...f, website: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-500">{t('partners.detail.address')}</label>
                                    <textarea className={fieldClass} rows={2} value={infoForm.address} onChange={(e) => setInfoForm((f) => ({ ...f, address: e.target.value }))} />
                                </div>
                            </>
                        ) : (
                            <>
                                <InfoRow icon={<Phone size={18} />} label={t('partners.detail.phone')} value={partner.phone || na} />
                                <InfoRow
                                    icon={<Mail size={18} />}
                                    label={t('partners.detail.email')}
                                    value={partner.email ? <a href={`mailto:${partner.email}`} className="text-primary hover:underline">{partner.email}</a> : na}
                                />
                                <InfoRow
                                    icon={<Globe size={18} />}
                                    label={t('partners.detail.website')}
                                    value={partner.website ? (
                                        <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {partner.website}
                                        </a>
                                    ) : na}
                                />
                                <InfoRow
                                    icon={<MapPin size={18} />}
                                    label={t('partners.detail.address')}
                                    value={partner.address ? (
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {partner.address}
                                        </a>
                                    ) : na}
                                />
                            </>
                        )}
                    </div>
                    {mapEmbedUrl ? (
                        <div className="space-y-2">
                            <iframe
                                title={t('partners.detail.mapTitle')}
                                className="w-full min-h-[200px] rounded-lg border dark:border-slate-700"
                                src={mapEmbedUrl}
                                loading="lazy"
                            />
                            {mapLinkUrl && (
                                <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                    {t('partners.detail.openMap')}
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-lg min-h-[200px] text-gray-400">
                            <MapPin className="mr-2" />
                            {t('partners.detail.noLocation')}
                        </div>
                    )}
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
                {contacts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p>{t('partners.detail.contactsEmpty')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contacts.map((contact) => (
                            <ContactPersonCard
                                key={contact.id}
                                contact={contact}
                                primaryLabel={t('partners.detail.primaryContact')}
                                editLabel={t('common.edit')}
                                deleteLabel={t('common.delete')}
                                onEdit={() => setContactToEdit(contact)}
                                onDelete={() => setContactToDelete(contact)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddContactModal
                isOpen={addOpen || !!contactToEdit}
                onClose={() => {
                    setAddOpen(false);
                    setContactToEdit(null);
                }}
                onAdd={handleAdd}
                contactToEdit={contactToEdit}
                onUpdate={handleEdit}
            />
            <ConfirmationModal
                isOpen={!!contactToDelete}
                onClose={() => setContactToDelete(null)}
                onConfirm={handleDelete}
                title={t('partners.detail.deleteContactTitle')}
                message={t('partners.detail.deleteContactMessage', { name: contactToDelete?.name ?? '' })}
            />
        </div>
    );
};

export default ContactTab;
