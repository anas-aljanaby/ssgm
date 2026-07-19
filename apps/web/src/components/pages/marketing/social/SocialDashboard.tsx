import React from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { MOCK_SOCIAL_ACCOUNTS } from '../../../../data/socialMediaData';
import AccountCard from './AccountCard';

const SocialDashboard: React.FC = () => {
    const { t } = useLocalization(['digital_marketing', 'common']);

    return (
        <section>
            <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">
                {t('digital_marketing.social.connectedAccounts')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_SOCIAL_ACCOUNTS.map(account => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        </section>
    );
};

export default SocialDashboard;
