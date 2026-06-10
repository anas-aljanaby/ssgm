import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, Plus, Star, Users } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useCountUp } from '../../../hooks/useCountUp';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import { useDashboard } from '../../../contexts/DashboardContext';

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

interface KpiTileProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    format?: 'number' | 'currency' | 'rating';
    colorClass: string;
}

const KpiTile: React.FC<KpiTileProps> = ({ title, value, icon, format = 'number', colorClass }) => {
    const { language } = useLocalization(['partners']);
    const animated = useCountUp(value, 1500);

    const display = () => {
        switch (format) {
            case 'currency':
                return formatCurrency(animated, language);
            case 'rating':
                return animated.toFixed(1);
            default:
                return formatNumber(Math.round(animated), language);
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border dark:border-slate-700 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClass}`}>{icon}</div>
            <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h4>
                <p className="text-3xl font-bold text-gray-800 dark:text-dark-foreground">{display()}</p>
            </div>
        </div>
    );
};

interface PartnerAnalyticsProps {
    partners: Partner[];
}

const PartnerAnalytics: React.FC<PartnerAnalyticsProps> = ({ partners }) => {
    const { t, language } = useLocalization(['partners']);
    const { state } = useDashboard();
    const isDark = state.theme === 'dark';

    const stats = useMemo(() => {
        const totalPartners = partners.length;
        const activePartners = partners.filter((p) => p.status === 'نشط').length;
        const totalBudget = partners.reduce((sum, p) => sum + p.budget, 0);
        const avgRating = totalPartners > 0 ? partners.reduce((sum, p) => sum + p.rating, 0) / totalPartners : 0;
        const partnersBySector = partners.reduce<Record<string, number>>((acc, p) => {
            acc[p.sector] = (acc[p.sector] || 0) + 1;
            return acc;
        }, {});
        return { totalPartners, activePartners, totalBudget, avgRating, partnersBySector };
    }, [partners]);

    const chartData = Object.entries(stats.partnersBySector).map(([name, value]) => ({ name, value }));

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-6 mb-6 border dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-dark-foreground mb-4">{t('partners.analyticsTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KpiTile title={t('partners.kpi.total')} value={stats.totalPartners} icon={<Users />} colorClass="bg-blue-100 text-blue-600" />
                <KpiTile title={t('partners.kpi.active')} value={stats.activePartners} icon={<Plus />} colorClass="bg-green-100 text-green-600" />
                <KpiTile title={t('partners.kpi.totalBudget')} value={stats.totalBudget} icon={<DollarSign />} format="currency" colorClass="bg-purple-100 text-purple-600" />
                <KpiTile title={t('partners.kpi.avgRating')} value={stats.avgRating} icon={<Star />} format="rating" colorClass="bg-yellow-100 text-yellow-600" />
            </div>
            <div>
                <h3 className="font-semibold text-center mb-2 text-gray-700 dark:text-gray-300">{t('partners.sectorChartTitle')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4A5568' : '#E2E8F0'} />
                        <XAxis dataKey="name" tick={{ fill: isDark ? '#A0AEC0' : '#4A5568', fontSize: 12 }} />
                        <YAxis tick={{ fill: isDark ? '#A0AEC0' : '#4A5568' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1A202C' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                                direction: 'rtl',
                            }}
                            formatter={(value) => [formatNumber(Number(value), language), t('partners.chartTooltip')]}
                        />
                        <Bar dataKey="value" name={t('partners.chartSeries')}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PartnerAnalytics;
