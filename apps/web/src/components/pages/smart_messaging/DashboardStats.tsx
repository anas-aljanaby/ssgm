
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { GeneratedMessage } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatNumber } from '../../../lib/utils';
import { Calendar, MessageSquare, Star, Eye } from 'lucide-react';

interface DashboardStatsProps {
    generatedMessages: GeneratedMessage[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; bgColor: string }> = ({ title, value, icon, bgColor }) => (
    <div className={`p-5 rounded-xl shadow-sm ${bgColor}`}>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/50 rounded-full">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs font-semibold text-gray-600">{title}</p>
            </div>
        </div>
    </div>
);

const LanguageDistributionChart: React.FC<{ messages: GeneratedMessage[] }> = ({ messages }) => {
    const { t } = useLocalization(['smart_messaging', 'common']);
    const langCounts = React.useMemo(() => {
        return messages.reduce((acc, msg) => {
            acc[msg.language] = (acc[msg.language] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [messages]);

    const data = Object.entries(langCounts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    const COLORS = { en: '#3B82F6', ar: '#10B981', tr: '#EF4444' };

    if (messages.length === 0) return null;

    return (
        <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft p-4 col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-1">
             <h4 className="text-sm font-semibold text-center text-gray-500 dark:text-gray-400">{t('smart_messaging.dashboard.distributionByLanguage')}</h4>
            <div className="h-24 w-full">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={5}>
                             {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} messages`} />
                         <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ generatedMessages }) => {
    const { t, language } = useLocalization(['smart_messaging', 'common']);

    const stats = React.useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const generatedToday = generatedMessages.filter(m => m.created_at.startsWith(today)).length;
        
        const scheduledThisWeek = generatedMessages.filter(m => m.status === 'scheduled').length;
        
        const avgPersonalization = generatedMessages.length > 0
            ? generatedMessages.reduce((sum, m) => sum + m.personalization_score, 0) / generatedMessages.length
            : 0;
            
        const avgOpenRate = generatedMessages.length > 0
            ? generatedMessages.reduce((sum, m) => sum + (m.predicted_open_rate || 0), 0) / generatedMessages.length
            : 0;

        return { generatedToday, scheduledThisWeek, avgPersonalization, avgOpenRate };
    }, [generatedMessages]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <StatCard 
                title={t('smart_messaging.dashboard.generatedToday')}
                value={formatNumber(stats.generatedToday, language)}
                icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
                bgColor="bg-blue-100 dark:bg-blue-900/20"
            />
            <StatCard 
                title={t('smart_messaging.dashboard.scheduledWeek')}
                value={formatNumber(stats.scheduledThisWeek, language)}
                icon={<Calendar className="w-6 h-6 text-purple-600" />}
                bgColor="bg-purple-100 dark:bg-purple-900/20"
            />
            <StatCard 
                title={t('smart_messaging.dashboard.avgPersonalization')}
                value={`${Math.round(stats.avgPersonalization)}`}
                icon={<Star className="w-6 h-6 text-green-600" />}
                bgColor="bg-green-100 dark:bg-green-900/20"
            />
            <StatCard 
                title={t('smart_messaging.dashboard.predictedOpens')}
                value={`${Math.round(stats.avgOpenRate)}%`}
                icon={<Eye className="w-6 h-6 text-orange-600" />}
                bgColor="bg-orange-100 dark:bg-orange-900/20"
            />
            <LanguageDistributionChart messages={generatedMessages} />
        </div>
    );
};

export default DashboardStats;
