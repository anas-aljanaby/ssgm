import React, { useState, useCallback } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useDropzone } from 'react-dropzone';
import { XIcon, UploadCloud, User } from 'lucide-react';
import type { ContactPerson } from '../../../types';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (contact: Omit<ContactPerson, 'id'>) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();

    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setPhoto(acceptedFiles[0]);
            setPhotoPreview(URL.createObjectURL(acceptedFiles[0]));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif'] },
        multiple: false,
    });
    
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = t('institutional_donors.detail.validation.required');
        if (!position.trim()) newErrors.position = t('institutional_donors.detail.validation.required');
        if (!email.trim()) {
            newErrors.email = t('institutional_donors.detail.validation.required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = t('institutional_donors.detail.validation.email');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.showError('Please correct the errors before submitting.');
            return;
        }
        onAdd({
            name,
            position,
            email,
            phone,
            whatsapp,
            isPrimary,
            photoUrl: photoPreview || '',
        });
        onClose(); // Resetting state will be handled by parent component re-render if it re-creates the modal
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('institutional_donors.detail.addContactTitle')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow contents">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                             <div className="md:col-span-1 flex flex-col items-center">
                                <label className="block text-sm font-medium mb-2">{t('institutional_donors.detail.form.profilePicture')}</label>
                                <div {...getRootProps()} className={`w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer ${isDragActive ? 'border-primary bg-primary-light/50' : 'border-gray-300 dark:border-slate-600'}`}>
                                    <input {...getInputProps()} />
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <UploadCloud size={32} className="mx-auto" />
                                            <p className="text-xs mt-1">Drop or click</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">{t('institutional_donors.detail.form.fullName')}*</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('institutional_donors.detail.placeholders.fullName')} className={`w-full p-2 mt-1 border rounded-md ${errors.name ? 'border-red-500' : ''}`} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">{t('institutional_donors.detail.form.position')}*</label>
                                    <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder={t('institutional_donors.detail.placeholders.position')} className={`w-full p-2 mt-1 border rounded-md ${errors.position ? 'border-red-500' : ''}`} />
                                     {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.detail.form.email')}*</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full p-2 mt-1 border rounded-md ${errors.email ? 'border-red-500' : ''}`} />
                                 {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.detail.form.phone')}</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium">{t('institutional_donors.detail.form.whatsapp')}</label>
                            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                        </div>
                         <div className="pt-4 border-t dark:border-slate-700">
                             <h4 className="font-semibold">{t('institutional_donors.detail.form.permissions')}</h4>
                             <p className="text-xs text-gray-500">{t('institutional_donors.detail.form.permissionsDesc')}</p>
                             <div className="space-y-2 mt-2">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-4 h-4 text-primary rounded" /> {t('institutional_donors.detail.form.isPrimary')}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-primary rounded" /> {t('institutional_donors.detail.form.permViewProjects')}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-primary rounded" /> {t('institutional_donors.detail.form.permManageFinances')}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-primary rounded" /> {t('institutional_donors.detail.form.permApproveReports')}</label>
                             </div>
                         </div>

                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold">{t('institutional_donors.detail.save')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddContactModal;
