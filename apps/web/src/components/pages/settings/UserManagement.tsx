
import React, { useState, useMemo } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useTabParam } from '../../../hooks/useTabParam';
import { MOCK_ROLES, MOCK_USERS } from '../../../data/userData';
import { SIDEBAR_MODULES_FOR_PERMISSIONS } from '../../../constants';
import type { AppRole, RolePermissions, AppUser, UserStatus } from '../../../types';
import Tabs from '../../common/Tabs';
import SettingsCard from './SettingsCard';
import FormField from './FormField';
import ToggleSwitch from './ToggleSwitch';
import { EditIcon } from '../../icons/ActionIcons';
import { PlusCircleIcon, XIcon } from '../../icons/GenericIcons';
import { formatDate } from '../../../lib/utils';


const PermissionsModal: React.FC<{ role: AppRole, onClose: () => void }> = ({ role, onClose }) => {
    const { t } = useLocalization();
    const [permissions, setPermissions] = useState<RolePermissions>(role.permissions);

    const handlePermissionChange = (moduleKey: string, permission: 'view' | 'create' | 'edit' | 'delete', value: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [moduleKey]: {
                ...prev[moduleKey],
                [permission]: value
            }
        }));
    };

    return (
        <ModalPortal isOpen={true} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('settings.users.permissionsForRole', { roleName: role.name })}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <th className="p-2">{t('settings.users.module')}</th>
                                    <th className="p-2 text-center">{t('settings.users.view')}</th>
                                    <th className="p-2 text-center">{t('settings.users.create')}</th>
                                    <th className="p-2 text-center">{t('settings.users.edit')}</th>
                                    <th className="p-2 text-center">{t('settings.users.delete')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SIDEBAR_MODULES_FOR_PERMISSIONS.map(module => (
                                    <tr key={module.key} className="border-t dark:border-slate-700">
                                        <td className="p-2 font-semibold">{t(`sidebar.${module.key}`)}</td>
                                        {['view', 'create', 'edit', 'delete'].map(p => (
                                            <td key={p} className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                                                    checked={permissions[module.key]?.[p as keyof RolePermissions['']]}
                                                    onChange={e => handlePermissionChange(module.key, p as any, e.target.checked)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                    <button className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark">{t('settings.saveChanges')}</button>
                </div>
            </div>
        </ModalPortal>
    );
};

const RolesTab: React.FC = () => {
    const { t } = useLocalization();
    const [roles, setRoles] = useState<AppRole[]>(MOCK_ROLES);
    const [editingRole, setEditingRole] = useState<AppRole | null>(null);

    return (
        <>
            {editingRole && <PermissionsModal role={editingRole} onClose={() => setEditingRole(null)} />}
            <SettingsCard title={t('settings.users.rolesTitle')} description={t('settings.users.rolesDesc')}>
                <div className="flex justify-end mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                        <PlusCircleIcon /> {t('settings.users.addRole')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                            <tr>
                                <th className="p-2">{t('settings.users.roleName')}</th>
                                <th className="p-2">{t('settings.users.userCount')}</th>
                                <th className="p-2 text-right">{t('settings.users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id} className="border-t dark:border-slate-700">
                                    <td className="p-2">
                                        <p className="font-bold text-foreground dark:text-dark-foreground">{role.name}</p>
                                        <p className="text-xs text-gray-500">{role.description}</p>
                                    </td>
                                    <td className="p-2">{role.userCount}</td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => setEditingRole(role)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                            <EditIcon className="w-4 h-4" /> {t('settings.users.editPermissions')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingsCard>
        </>
    );
};

const UsersTab: React.FC = () => {
    const { t, language } = useLocalization();
    const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
    
    const StatusBadge: React.FC<{status: UserStatus}> = ({status}) => {
         const styles: Record<UserStatus, string> = {
            'Active': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'Invited': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Deactivated': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{t(`settings.users.statuses.${status}`)}</span>;
    }

    return (
        <SettingsCard title={t('settings.users.usersTitle')} description={t('settings.users.usersDesc')}>
            <div className="flex justify-end mb-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                    <PlusCircleIcon /> {t('settings.users.inviteUser')}
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <tr>
                            <th className="p-2">{t('settings.users.userName')}</th>
                            <th className="p-2">{t('settings.users.role')}</th>
                            <th className="p-2">{t('settings.users.status')}</th>
                            <th className="p-2">{t('settings.users.lastLogin')}</th>
                            <th className="p-2 text-right">{t('settings.users.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t dark:border-slate-700">
                                <td className="p-2">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" loading="lazy" />
                                        <div>
                                            <p className="font-bold text-foreground dark:text-dark-foreground">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-2">{user.role}</td>
                                <td className="p-2"><StatusBadge status={user.status} /></td>
                                <td className="p-2">{user.lastLogin ? formatDate(user.lastLogin, language) : '-'}</td>
                                <td className="p-2 text-right">
                                    {user.status === 'Active' && <button className="text-xs text-red-500 hover:underline">{t('settings.users.deactivate')}</button>}
                                    {user.status === 'Invited' && <button className="text-xs text-blue-500 hover:underline">{t('settings.users.resendInvite')}</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </SettingsCard>
    );
};

const AuthenticationTab: React.FC = () => {
    const { t } = useLocalization();
    const [policy, setPolicy] = useState({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: false,
        enableExpiration: true,
        expireAfter: 90,
        rememberLast: 3,
        mfa: 'requiredRoles',
        sessionTimeout: 30,
        allowConcurrent: false,
    });
    
    return (
        <div className="space-y-6">
            <SettingsCard title={t('settings.users.passwordPolicyTitle')} description={t('settings.users.passwordPolicyDesc')}>
                <FormField label={t('settings.users.minLength')}>
                    <input type="number" value={policy.minLength} onChange={e => setPolicy(p => ({...p, minLength: +e.target.value}))} />
                </FormField>
                <div className="space-y-2 pt-2">
                    <h4 className="text-sm font-semibold">{t('settings.users.complexity')}</h4>
                    <ToggleSwitch label={t('settings.users.requireUppercase')} name="reqUpper" isChecked={policy.requireUppercase} onToggle={(n, c) => setPolicy(p => ({...p, requireUppercase: c}))} />
                    <ToggleSwitch label={t('settings.users.requireLowercase')} name="reqLower" isChecked={policy.requireLowercase} onToggle={(n, c) => setPolicy(p => ({...p, requireLowercase: c}))} />
                    <ToggleSwitch label={t('settings.users.requireNumbers')} name="reqNum" isChecked={policy.requireNumbers} onToggle={(n, c) => setPolicy(p => ({...p, requireNumbers: c}))} />
                    <ToggleSwitch label={t('settings.users.requireSpecial')} name="reqSpecial" isChecked={policy.requireSpecial} onToggle={(n, c) => setPolicy(p => ({...p, requireSpecial: c}))} />
                </div>
            </SettingsCard>
            <SettingsCard title={t('settings.users.mfaTitle')} description={t('settings.users.mfaDesc')}>
                <FormField label={t('settings.users.mfaEnforcement')}>
                    <select value={policy.mfa} onChange={e => setPolicy(p => ({...p, mfa: e.target.value}))}>
                        <option value="disabled">{t('settings.users.mfaOptions.disabled')}</option>
                        <option value="optional">{t('settings.users.mfaOptions.optional')}</option>
                        <option value="required">{t('settings.users.mfaOptions.required')}</option>
                        <option value="requiredRoles">{t('settings.users.mfaOptions.requiredRoles')}</option>
                    </select>
                </FormField>
                {policy.mfa === 'requiredRoles' && (
                     <FormField label={t('settings.users.requiredForRoles')}>
                         <input type="text" placeholder={t('settings.users.requiredForRolesPlaceholder')} />
                     </FormField>
                )}
            </SettingsCard>
             <SettingsCard title={t('settings.users.sessionTitle')} description={t('settings.users.sessionDesc')}>
                <FormField label={t('settings.users.sessionTimeout')}>
                     <input type="number" value={policy.sessionTimeout} onChange={e => setPolicy(p => ({...p, sessionTimeout: +e.target.value}))} />
                </FormField>
                 <ToggleSwitch label={t('settings.users.allowConcurrent')} name="concurrent" isChecked={policy.allowConcurrent} onToggle={(n, c) => setPolicy(p => ({...p, allowConcurrent: c}))} />
            </SettingsCard>
        </div>
    )
}

const USER_MANAGEMENT_TABS = ['accessControl', 'userProvisioning', 'authentication'] as const;

const UserManagement: React.FC = () => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useTabParam('usersTab', 'accessControl', USER_MANAGEMENT_TABS);

    const tabs = [
        { id: 'accessControl', label: t('settings.users.tabAccessControl') },
        { id: 'userProvisioning', label: t('settings.users.tabUserProvisioning') },
        { id: 'authentication', label: t('settings.users.tabAuthentication') },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'accessControl': return <RolesTab />;
            case 'userProvisioning': return <UsersTab />;
            case 'authentication': return <AuthenticationTab />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground mb-4">{t('settings.categories.users')}</h2>
            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
            <div className="mt-6">
                {renderContent()}
            </div>
             <div className="flex justify-end pt-6 mt-6 border-t dark:border-slate-700">
                 <button className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors">
                    {t('settings.saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default UserManagement;
