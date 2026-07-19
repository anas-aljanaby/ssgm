
import React, { useState, useMemo } from 'react';
import type { GeneratedMessage, SortDirection } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatDate, formatNumber } from '../../../lib/utils';
import { langToFlag } from '../../icons/FlagIcons';
import { ChevronDownIcon, MoreHorizontalIcon } from '../../icons/GenericIcons';

interface GeneratedMessagesProps {
    messages: GeneratedMessage[];
}

const GeneratedMessages: React.FC<GeneratedMessagesProps> = ({ messages }) => {
    const { t, language } = useLocalization(['smart_messaging', 'common']);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    const paginatedMessages = messages.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(messages.length / rowsPerPage);

    const StatusBadge: React.FC<{ status: GeneratedMessage['status'] }> = ({ status }) => {
        const colors = {
            draft: 'bg-gray-200 text-gray-800',
            scheduled: 'bg-blue-200 text-blue-800',
            sent: 'bg-green-200 text-green-800',
            opened: 'bg-purple-200 text-purple-800',
            clicked: 'bg-orange-200 text-orange-800',
            responded: 'bg-teal-200 text-teal-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>{t(`smart_messaging.results.statuses.${status}`)}</span>;
    };

    return (
        <div className="mt-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">{t('smart_messaging.results.title')} ({messages.length})</h2>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border border-gray-200 dark:border-slate-700/50">
                {/* Actions Bar */}
                <div className="p-4 border-b dark:border-slate-700 flex flex-wrap gap-2 items-center">
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg">{t('smart_messaging.results.send_selected')}</button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-purple-500 rounded-lg">{t('smart_messaging.results.schedule_selected')}</button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg">{t('smart_messaging.results.delete_selected')}</button>
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-dark-card/50">
                            <tr>
                                <th className="p-4"><input type="checkbox" /></th>
                                <th className="p-4">{t('smart_messaging.results.columns.donor')}</th>
                                <th className="p-4">{t('smart_messaging.results.columns.subject')}</th>
                                <th className="p-4">{t('smart_messaging.results.columns.personalization')}</th>
                                <th className="p-4">{t('smart_messaging.results.columns.open_rate')}</th>
                                <th className="p-4">{t('smart_messaging.results.columns.scheduled')}</th>
                                <th className="p-4">{t('smart_messaging.results.columns.status')}</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMessages.map(msg => (
                                <tr key={msg.message_id} className="border-t dark:border-slate-700">
                                    <td className="p-4"><input type="checkbox" /></td>
                                    <td className="p-4">{msg.donor_id}</td>
                                    <td className="p-4 max-w-xs truncate" title={msg.generated_subject}>{msg.generated_subject}</td>
                                    <td className="p-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${msg.personalization_score}%`}}></div></div>
                                    </td>
                                    <td className="p-4">{msg.predicted_open_rate?.toFixed(1)}%</td>
                                    <td className="p-4">{formatDate(msg.scheduled_send_time, language)}</td>
                                    <td className="p-4"><StatusBadge status={msg.status} /></td>
                                    <td className="p-4"><button><MoreHorizontalIcon /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Pagination */}
                <nav className="flex items-center justify-between p-4" aria-label="Table navigation">
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{t('common.pagination_summary', { start: (currentPage - 1) * rowsPerPage + 1, end: Math.min(currentPage * rowsPerPage, messages.length), total: messages.length })}</span>
                    <ul className="inline-flex items-center -space-x-px rtl:space-x-reverse">
                        <li><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-2 ms-0 leading-tight border rounded-s-lg disabled:opacity-50">{t('common.previous')}</button></li>
                        <li><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-2 leading-tight border rounded-e-lg disabled:opacity-50">{t('common.next')}</button></li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default GeneratedMessages;
