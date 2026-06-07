import { can as canFn, PermissionAction, RbacModule } from '@gms/shared';
import { useOrg } from '../contexts/OrgContext';

/**
 * Permission helper bound to the active org's role. Platform admins are granted
 * everything. Mirrors the server-side matrix in @gms/shared so UI gating and API
 * enforcement stay consistent.
 */
export function usePermissions() {
    const { role, isPlatformAdmin } = useOrg();

    const can = (module: RbacModule, action: PermissionAction): boolean => {
        if (isPlatformAdmin) return true;
        if (!role) return false;
        return canFn(role, module, action);
    };

    return { role, isPlatformAdmin, can };
}
