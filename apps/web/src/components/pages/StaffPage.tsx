import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalization } from '../../hooks/useLocalization';
import { usePermissions } from '../../hooks/usePermissions';
import { STAFF_QUERY_KEY, useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '../../hooks/useStaff';
import type { StaffMember } from '../../hooks/useStaff';
import type { CreateStaff, OrgRole, UpdateStaff } from '@gms/shared';
import { ORG_ROLES } from '@gms/shared';
import { useOrg } from '../../contexts/OrgContext';
import { useToast } from '../../hooks/useToast';
import { useDestructiveConfirmation } from '../../hooks/useDestructiveConfirmation';
import { createOptimisticId, isOptimisticId, OPTIMISTIC_HIGHLIGHT_MS } from '../../lib/optimisticSubmit';
import ModalPortal from '../common/ModalPortal';
import ConfirmationModal from '../common/ConfirmationModal';

const ROLE_COLORS: Record<OrgRole, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accountant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    staff: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const OPTIMISTIC_STAFF_PREFIX = 'optimistic-staff-';

interface StaffFormData {
    full_name_en: string;
    full_name_ar: string;
    email: string;
    password: string;
    role: OrgRole;
    title: string;
    department: string;
    phone: string;
}

type StaffFieldErrorKey = 'full_name_en' | 'email' | 'password';

const emptyForm: StaffFormData = {
    full_name_en: '',
    full_name_ar: '',
    email: '',
    password: '',
    role: 'staff',
    title: '',
    department: '',
    phone: '',
};

function isOptimisticStaff(id: string) {
    return isOptimisticId(id, OPTIMISTIC_STAFF_PREFIX);
}

function buildOptimisticStaff(form: StaffFormData, id: string): StaffMember {
    return {
        id,
        user_id: '',
        role: form.role,
        email: form.email.trim(),
        name: { en: form.full_name_en.trim(), ar: form.full_name_ar.trim() },
        title: form.title.trim(),
        department: form.department.trim(),
        phone: form.phone.trim(),
        avatar: '',
        status: 'active',
        custom_fields: {},
        created_at: new Date().toISOString(),
    };
}

function mapStaffError(message: string, t: (key: string) => string) {
    if (message.includes('last_admin')) return t('staff.errors.last_admin');
    if (message.includes('cannot_remove_self')) return t('staff.errors.cannot_remove_self');
    return message || t('staff.errors.generic');
}

interface StaffFormModalProps {
    isOpen: boolean;
    editingId: string | null;
    initialForm: StaffFormData;
    onClose: () => void;
    onCreate: (data: CreateStaff) => void;
    onUpdate: (id: string, data: UpdateStaff) => void;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({
    isOpen,
    editingId,
    initialForm,
    onClose,
    onCreate,
    onUpdate,
}) => {
    const { t, dir } = useLocalization(['staff', 'common']);
    const [form, setForm] = useState<StaffFormData>(initialForm);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<StaffFieldErrorKey, string>>>({});
    const [passwordVisible, setPasswordVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm(initialForm);
            setFieldErrors({});
            setPasswordVisible(false);
        }
    }, [isOpen, initialForm]);

    const clearFieldError = (key: StaffFieldErrorKey) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Partial<Record<StaffFieldErrorKey, string>> = {};
        const fullNameEn = form.full_name_en.trim();
        const email = form.email.trim();

        if (!fullNameEn) {
            errors.full_name_en = t('staff.errors.name_en_required', 'English name is required.');
        }
        if (!editingId) {
            if (!email) {
                errors.email = t('staff.errors.email_required', 'Email is required.');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.email = t('staff.errors.email_invalid', 'Enter a valid email address.');
            }
        }

        const password = form.password.trim();
        if (password && password.length < 8) {
            errors.password = t('staff.errors.password_min_length', 'Password must be at least 8 characters.');
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const payload = {
            full_name_en: fullNameEn,
            full_name_ar: form.full_name_ar.trim(),
            role: form.role,
            title: form.title.trim(),
            department: form.department.trim(),
            phone: form.phone.trim(),
        };

        if (editingId) {
            onUpdate(editingId, password ? { ...payload, password } : payload);
        } else {
            onCreate(password ? { ...payload, email, password } : { ...payload, email });
        }
        onClose();
    };

    const fieldClass = (hasError: boolean) =>
        `w-full rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 ${
            hasError
                ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-400'
                : 'border-gray-200 dark:border-slate-700 focus:ring-primary/30 focus:border-primary'
        }`;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir={dir}>
            <div
                className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg mx-auto animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">
                            {editingId ? t('staff.edit_title') : t('staff.add_title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('staff.required_helper', 'Fields marked * are required.')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('staff.fields.name_en')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={form.full_name_en}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, full_name_en: e.target.value }));
                                    clearFieldError('full_name_en');
                                }}
                                aria-invalid={!!fieldErrors.full_name_en}
                                className={fieldClass(!!fieldErrors.full_name_en)}
                            />
                            {fieldErrors.full_name_en && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.full_name_en}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('staff.fields.name_ar')}
                            </label>
                            <input
                                value={form.full_name_ar}
                                onChange={(e) => setForm((f) => ({ ...f, full_name_ar: e.target.value }))}
                                dir="rtl"
                                className={fieldClass(false)}
                            />
                        </div>
                    </div>

                    {!editingId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('staff.fields.email')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, email: e.target.value }));
                                    clearFieldError('email');
                                }}
                                aria-invalid={!!fieldErrors.email}
                                className={fieldClass(!!fieldErrors.email)}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {editingId ? t('staff.fields.password_reset') : t('staff.fields.password')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, password: e.target.value }));
                                    clearFieldError('password');
                                }}
                                autoComplete="new-password"
                                aria-invalid={!!fieldErrors.password}
                                className={fieldClass(!!fieldErrors.password)}
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordVisible((v) => !v)}
                                className="shrink-0 p-2 rounded-md border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500"
                                title={passwordVisible ? t('staff.hide_password') : t('staff.show_password')}
                                aria-label={passwordVisible ? t('staff.hide_password') : t('staff.show_password')}
                            >
                                {passwordVisible ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {editingId ? t('staff.password_helper_edit') : t('staff.password_helper_create')}
                        </p>
                        {fieldErrors.password && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('staff.fields.role')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as OrgRole }))}
                            className={fieldClass(false)}
                        >
                            {ORG_ROLES.map((r) => (
                                <option key={r} value={r}>{t(`staff.roles.${r}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('staff.fields.title')}
                            </label>
                            <input
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                className={fieldClass(false)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('staff.fields.department')}
                            </label>
                            <input
                                value={form.department}
                                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                                className={fieldClass(false)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('staff.fields.phone')}
                        </label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            className={fieldClass(false)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            {editingId ? t('common.save') : t('staff.add')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

interface PasswordRevealModalProps {
    isOpen: boolean;
    password: string;
    onClose: () => void;
}

const PasswordRevealModal: React.FC<PasswordRevealModalProps> = ({ isOpen, password, onClose }) => {
    const { t } = useLocalization(['staff', 'common']);
    const { showSuccess } = useToast();
    const [passwordVisible, setPasswordVisible] = useState(false);

    useEffect(() => {
        if (isOpen) setPasswordVisible(false);
    }, [isOpen, password]);

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">{t('staff.password_created_title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('staff.password_created_desc')}</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('staff.fields.password')}</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <code className="flex-1 text-sm font-mono break-all select-all">
                            {passwordVisible ? password : '•'.repeat(password.length)}
                        </code>
                        <button
                            type="button"
                            onClick={() => setPasswordVisible((v) => !v)}
                            className="shrink-0 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-500"
                            title={passwordVisible ? t('staff.hide_password') : t('staff.show_password')}
                            aria-label={passwordVisible ? t('staff.hide_password') : t('staff.show_password')}
                        >
                            {passwordVisible ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => { void navigator.clipboard.writeText(password); showSuccess(t('common.copied')); }}
                            className="shrink-0 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-500"
                            title={t('common.copy')}
                            aria-label={t('common.copy')}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full mt-2 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                    {t('common.done')}
                </button>
            </div>
        </ModalPortal>
    );
};

const StaffPage: React.FC = () => {
    const { t, language } = useLocalization(['staff', 'common']);
    const { can } = usePermissions();
    const { activeOrgId } = useOrg();
    const queryClient = useQueryClient();
    const canWrite = can('staff', 'write');
    const { data: staff = [], isLoading } = useStaff();
    const createMutation = useCreateStaff();
    const updateMutation = useUpdateStaff();
    const deleteMutation = useDeleteStaff();
    const { showSuccess, showError } = useToast();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formInitial, setFormInitial] = useState<StaffFormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [optimisticStaff, setOptimisticStaff] = useState<StaffMember[]>([]);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const deleteConfirmation = useDestructiveConfirmation<StaffMember>({ getRowId: (member) => member.id });

    useEffect(() => {
        if (!highlightedId) return;
        const timeout = window.setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);
        return () => window.clearTimeout(timeout);
    }, [highlightedId]);

    const visibleStaff = [...optimisticStaff, ...staff];

    const filtered = visibleStaff.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.name.en.toLowerCase().includes(q) ||
            s.name.ar.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.role.toLowerCase().includes(q) ||
            s.department.toLowerCase().includes(q)
        );
    });

    const setStaffCache = (updater: (current: StaffMember[]) => StaffMember[]) => {
        queryClient.setQueryData<StaffMember[]>([...STAFF_QUERY_KEY, activeOrgId], (current = []) => updater(current));
    };

    const openCreate = () => {
        setEditingId(null);
        setFormInitial(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (member: StaffMember) => {
        if (isOptimisticStaff(member.id)) return;
        setEditingId(member.id);
        setFormInitial({
            full_name_en: member.name.en,
            full_name_ar: member.name.ar,
            email: member.email,
            password: '',
            role: member.role,
            title: member.title,
            department: member.department,
            phone: member.phone,
        });
        setModalOpen(true);
    };

    const handleCreate = (data: CreateStaff) => {
        const optimisticId = createOptimisticId(OPTIMISTIC_STAFF_PREFIX);
        const optimistic = buildOptimisticStaff(
            {
                full_name_en: data.full_name_en,
                full_name_ar: data.full_name_ar,
                email: data.email,
                password: '',
                role: data.role,
                title: data.title,
                department: data.department,
                phone: data.phone,
            },
            optimisticId,
        );

        setOptimisticStaff((prev) => [optimistic, ...prev]);

        void createMutation.mutateAsync(data).then((created) => {
            setOptimisticStaff((prev) => prev.filter((member) => member.id !== optimisticId));
            setStaffCache((current) => [created, ...current.filter((member) => member.id !== created.id)]);
            if (created.temp_password) {
                setTempPassword(created.temp_password);
            } else {
                setHighlightedId(created.id);
                showSuccess(t('staff.created'));
            }
        }).catch((err: unknown) => {
            setOptimisticStaff((prev) => prev.filter((member) => member.id !== optimisticId));
            showError(err instanceof Error ? mapStaffError(err.message, t) : t('staff.errors.generic'));
        });
    };

    const handleUpdate = (id: string, data: UpdateStaff) => {
        void updateMutation.mutateAsync({ id, input: data }).then((updated) => {
            setStaffCache((current) => current.map((member) => (member.id === id ? updated : member)));
            setHighlightedId(updated.id);
            showSuccess(t('staff.updated'));
        }).catch((err: unknown) => {
            showError(err instanceof Error ? mapStaffError(err.message, t) : t('staff.errors.generic'));
        });
    };

    const handleDelete = () =>
        deleteConfirmation.confirm(async (member) => {
            await deleteMutation.mutateAsync(member.id);
        }).then((removed) => {
            if (!removed) return;
            setStaffCache((current) => current.filter((item) => item.id !== removed.id));
            showSuccess(t('staff.deleted'));
        }).catch((err: unknown) => {
            showError(err instanceof Error ? mapStaffError(err.message, t) : t('staff.errors.generic'));
        });

    const displayName = (member: StaffMember) =>
        language === 'ar' && member.name.ar ? member.name.ar : member.name.en;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{t('staff.title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('staff.subtitle')}</p>
                </div>
                {canWrite && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                        {t('staff.add')}
                    </button>
                )}
            </div>

            <div className="relative max-w-md">
                <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('staff.search')}
                    className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground placeholder-gray-400 focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-dashed border-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                    <svg className="mx-auto w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-lg font-medium">{search ? t('staff.no_results') : t('staff.empty')}</p>
                </div>
            ) : (
                <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.name')}</th>
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.email')}</th>
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.role')}</th>
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.department')}</th>
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.title')}</th>
                                    <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{t('staff.fields.status')}</th>
                                    {canWrite && <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-300" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filtered.map((member) => {
                                    const optimistic = isOptimisticStaff(member.id);
                                    const highlighted = highlightedId === member.id;
                                    const rowPending = deleteConfirmation.isRowPending(member.id);
                                    const rowExiting = deleteConfirmation.isRowExiting(member.id);
                                    const rowBusy = deleteConfirmation.isRowBusy(member.id);
                                    return (
                                        <tr
                                            key={member.id}
                                            className={`transition-all duration-200 ${
                                                rowExiting
                                                    ? 'opacity-0 -translate-x-2 scale-[0.98]'
                                                    : rowPending
                                                        ? 'bg-red-50/70 dark:bg-red-900/15 opacity-80'
                                                        : optimistic
                                                            ? 'opacity-70 animate-pulse'
                                                            : highlighted
                                                                ? 'bg-primary/5 dark:bg-primary/10'
                                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <td className="px-4 py-3 font-medium text-foreground dark:text-dark-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span>{displayName(member)}</span>
                                                    {optimistic && (
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                            {t('common.saving')}
                                                        </span>
                                                    )}
                                                    {rowPending && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300/40 border-t-red-600 dark:border-red-700/40 dark:border-t-red-300" aria-hidden="true" />
                                                            {t('common.deleting')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{member.email}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.viewer}`}>
                                                    {t(`staff.roles.${member.role}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{member.department || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{member.title || '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                    {t(`staff.status.${member.status}`)}
                                                </span>
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEdit(member)}
                                                            disabled={optimistic}
                                                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={t('common.edit')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteConfirmation.open(member)}
                                                            disabled={optimistic || rowBusy || deleteConfirmation.isPending}
                                                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={t('common.delete')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <StaffFormModal
                isOpen={modalOpen}
                editingId={editingId}
                initialForm={formInitial}
                onClose={() => setModalOpen(false)}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
            />

            <PasswordRevealModal
                isOpen={!!tempPassword}
                password={tempPassword ?? ''}
                onClose={() => setTempPassword(null)}
            />

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={deleteConfirmation.close}
                onConfirm={handleDelete}
                isConfirming={deleteConfirmation.isPending}
                title={t('staff.delete_title')}
                message={t('staff.delete_confirm', {
                    name: deleteConfirmation.target ? displayName(deleteConfirmation.target) : '',
                })}
                confirmLabel={t('common.delete')}
                confirmingLabel={t('common.deleting')}
            />
        </div>
    );
};

export default StaffPage;
