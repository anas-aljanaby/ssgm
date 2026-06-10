import React, { useMemo, useState } from 'react';
import { Download, Eye, File, FileText, Folder, Image, Trash2, Video } from 'lucide-react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatDate } from '../../../../lib/utils';
import { MOCK_PARTNER_DOCUMENTS, PARTNER_DOCUMENT_CATEGORIES, type PartnerDocument } from '../partnerStaticData';

const FileIcon: React.FC<{ type: PartnerDocument['type'] }> = ({ type }) => {
    switch (type) {
        case 'pdf': return <FileText className="text-red-500" />;
        case 'docx': return <FileText className="text-blue-500" />;
        case 'jpg': return <Image className="text-green-500" />;
        case 'mp4': return <Video className="text-purple-500" />;
        case 'folder': return <Folder className="text-amber-500" />;
        default: return <File className="text-gray-500" />;
    }
};

const DocumentsTab: React.FC = () => {
    const { t, language } = useLocalization(['partners']);
    const [category, setCategory] = useState<string>('الكل');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [documents] = useState(MOCK_PARTNER_DOCUMENTS);

    const filtered = useMemo(
        () => (category === 'الكل' ? documents : documents.filter((d) => d.category === category)),
        [documents, category],
    );

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {PARTNER_DOCUMENT_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <button type="button" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    {t('partners.documents.upload')}
                </button>
                <button type="button" className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                    {t('partners.documents.newFolder')}
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th className="p-3 w-10" />
                            <th className="p-3">{t('partners.documents.fileName')}</th>
                            <th className="p-3">{t('partners.documents.uploadDate')}</th>
                            <th className="p-3">{t('partners.documents.size')}</th>
                            <th className="p-3">{t('partners.documents.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((doc) => (
                            <tr key={doc.id} className="border-t dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                                <td className="p-3">
                                    <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggleSelect(doc.id)} />
                                </td>
                                <td className="p-3 font-semibold">
                                    <div className="flex items-center gap-3">
                                        <FileIcon type={doc.type} />
                                        <span>{doc.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-500">{formatDate(doc.date, language)}</td>
                                <td className="p-3 text-gray-500">{doc.size}</td>
                                <td className="p-3">
                                    <div className="flex justify-start gap-1">
                                        <button type="button" className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('partners.documents.preview')}>
                                            <Eye size={16} />
                                        </button>
                                        <button type="button" className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('partners.documents.download')}>
                                            <Download size={16} />
                                        </button>
                                        <button type="button" className="p-2 rounded-full hover:bg-red-100 text-red-500" title={t('partners.documents.delete')}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center p-16 text-gray-500">
                        <p>{t('partners.documents.empty')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsTab;
