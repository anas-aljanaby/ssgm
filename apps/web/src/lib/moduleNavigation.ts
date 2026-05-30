function navigateWithParams(
    module: string,
    params: Record<string, string | undefined>,
    hashSuffix?: string,
) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            searchParams.set(key, value);
        }
    }
    const hash = hashSuffix ? `#${module}/${hashSuffix}` : `#${module}`;
    const search = searchParams.toString();
    window.history.replaceState(null, '', `${window.location.pathname}?${search}${hash}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function openFinancialsTab(tabId: string, highlightId?: string) {
    navigateWithParams('financials', { tab: tabId, highlight: highlightId });
}

export function openDonorProfile(donorId: string) {
    navigateWithParams('donors', { tab: 'registry', highlight: donorId }, donorId);
}

export function openBeneficiaryAidLog(beneficiaryId: string, highlightDisbursementId?: string) {
    navigateWithParams(
        'beneficiaries',
        { tab: 'aid_log', highlight: highlightDisbursementId },
        `${beneficiaryId}/aid_log`,
    );
}
