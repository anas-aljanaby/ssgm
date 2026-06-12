import React, { useMemo, useRef, useState } from 'react';
import { Download, Eye, File, FileText, Folder, Image, Trash2, Video } from 'lucide-react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatDate } from '../../../../lib/utils';
import { useToast } from '../../../../hooks/useToast';
import type { Partner } from '../../../../types';
import {
    useDeletePartnerDocument,
    usePartnerDocuments,
    useUploadPartnerDocument,
    resolvePartnerDocumentUrl,
    type PartnerDocumentRecord,
} from '../../../../hooks/usePartnerDocuments';
import {
    PARTNER_DOCUMENT_CATEGORY_KEYS,
    type PartnerDocument,
    type PartnerDocumentCategory,
} from '../partnerStaticData';
import ModalPortal from '../../../common/ModalPortal';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Spinner from '../../../common/Spinner';

interface DocumentsTabProps {
    partner: Partner;
}

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

const inferDocType = (fileName: string): PartnerDocument['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'jpg';
    if (ext === 'mp4') return 'mp4';
    return 'pdf';
};

const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function mapApiDocument(record: PartnerDocumentRecord): PartnerDocument {
    return {
        id: record.id,
        name: record.label || record.filename,
        category: record.category,
        date: record.uploaded_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        size: formatFileSize(record.size_bytes),
        type: inferDocType(record.filename),
    };
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ partner }) => {
    const { t, language } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const { data: apiDocuments = [], isLoading } = usePartnerDocuments(partner.id);
    const uploadDocument = useUploadPartnerDocument(partner.id);
    const deleteDocument = useDeletePartnerDocument(partner.id);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<string>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [localFolders, setLocalFolders] = useState<PartnerDocument[]>([]);
    const [folderOpen, setFolderOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [docToDelete, setDocToDelete] = useState<{ id: string; name: string; source: 'api' | 'local' } | null>(null);

    const apiDocumentMap = useMemo(
        () => new Map(apiDocuments.map((doc) => [doc.id, doc])),
        [apiDocuments],
    );

    const documents = useMemo(
        () => [...localFolders, ...apiDocuments.map(mapApiDocument)],
        [localFolders, apiDocuments],
    );

    const filtered = useMemo(
        () => (category === 'all' ? documents : documents.filter((d) => d.category === category)),
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

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const docCategory: PartnerDocumentCategory = category === 'all' ? 'reports' : (category as PartnerDocumentCategory);
        uploadDocument.mutate(
            { file, label: file.name, category: docCategory },
            {
                onSuccess: () => toast.showSuccess(t('partners.documents.uploadSuccess')),
                onError: () => toast.showError(t('partners.errors.saveFailed')),
            },
        );
        e.target.value = '';
    };

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) {
            toast.showError(t('partners.validation.required'));
            return;
        }
        const folder: PartnerDocument = {
            id: `folder-${partner.id}-${Date.now()}`,
            name: folderName.trim(),
            category: category === 'all' ? 'legalCompliance' : (category as PartnerDocumentCategory),
            date: new Date().toISOString().split('T')[0],
            size: '--',
            type: 'folder',
        };
        setLocalFolders((prev) => [folder, ...prev]);
        toast.showSuccess(t('partners.documents.folderCreated'));
        setFolderName('');
        setFolderOpen(false);
    };

    const handleDelete = () => {
        if (!docToDelete) return;
        if (docToDelete.source === 'local') {
            setLocalFolders((prev) => prev.filter((d) => d.id !== docToDelete.id));
            toast.showSuccess(t('partners.documents.deleteSuccess'));
            setDocToDelete(null);
            return;
        }
        deleteDocument.mutate(docToDelete.id, {
            onSuccess: () => {
                setSelected((prev) => {
                    const next = new Set(prev);
                    next.delete(docToDelete.id);
                    return next;
                });
                toast.showSuccess(t('partners.documents.deleteSuccess'));
                setDocToDelete(null);
            },
            onError: () => toast.showError(t('partners.errors.saveFailed')),
        });
    };

    const handlePreview = (doc: PartnerDocument) => {
        const record = apiDocumentMap.get(doc.id);
        if (!record?.file_url) {
            toast.showInfo(t('partners.documents.previewPlaceholder'));
            return;
        }
        window.open(resolvePartnerDocumentUrl(record.file_url), '_blank', 'noopener,noreferrer');
    };

    const handleDownload = (doc: PartnerDocument) => {
        const record = apiDocumentMap.get(doc.id);
        if (!record?.file_url) {
            toast.showInfo(t('partners.documents.downloadPlaceholder'));
            return;
        }
        window.open(resolvePartnerDocumentUrl(record.file_url), '_blank', 'noopener,noreferrer');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {PARTNER_DOCUMENT_CATEGORY_KEYS.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200'}`}
                    >
                        {t(`partners.documents.categories.${cat}`)}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4" onChange={handleUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadDocument.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {uploadDocument.isPending ? t('common.loading') : t('partners.documents.upload')}
                </button>
                <button type="button" onClick={() => setFolderOpen(true)} className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
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
                                        <button type="button" onClick={() => handlePreview(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('partners.documents.preview')}>
                                            <Eye size={16} />
                                        </button>
                                        <button type="button" onClick={() => handleDownload(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('partners.documents.download')}>
                                            <Download size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDocToDelete({
                                                id: doc.id,
                                                name: doc.name,
                                                source: apiDocumentMap.has(doc.id) ? 'api' : 'local',
                                            })}
                                            className="p-2 rounded-full hover:bg-red-100 text-red-500"
                                            title={t('partners.documents.delete')}
                                        >
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

            <ModalPortal isOpen={folderOpen} onClose={() => setFolderOpen(false)}>
                <form className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md m-4 p-6" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateFolder}>
                            <h2 className="text-xl font-bold mb-4">{t('partners.documents.newFolder')}</h2>
                            <input
                                className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder={t('partners.documents.folderNamePlaceholder')}
                                autoFocus
                            />
                            <div className="mt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setFolderOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg">{t('common.save')}</button>
                            </div>
                </form>
            </ModalPortal>

            <ConfirmationModal
                isOpen={!!docToDelete}
                onClose={() => setDocToDelete(null)}
                onConfirm={handleDelete}
                title={t('partners.documents.deleteTitle')}
                message={t('partners.documents.deleteMessage', { name: docToDelete?.name ?? '' })}
                isConfirming={deleteDocument.isPending}
            />
        </div>
    );
};

export default DocumentsTab;
