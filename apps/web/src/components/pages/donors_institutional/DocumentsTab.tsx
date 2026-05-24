import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useDropzone } from 'react-dropzone';
import type { InstitutionalDonor } from '../../../types';
import { Upload, FolderPlus, Trash2, Download, X as XIcon, Eye } from 'lucide-react';
import { PdfIcon, WordIcon, ImageIcon, VideoIcon, FileIcon as GenericFileIcon, FolderIcon } from '../../icons/FiletypeIcons';
import { formatDate } from '../../../lib/utils';

type DocumentType = 'pdf' | 'docx' | 'jpg' | 'mp4' | 'folder' | 'generic';

type DocumentCategoryId =
    | 'all'
    | 'legal'
    | 'annualReports'
    | 'agreements'
    | 'correspondence'
    | 'media'
    | 'projectStudies'
    | 'projectReports';

interface DocumentItem {
    id: string;
    name: string;
    category: DocumentCategoryId;
    date: string;
    size: string;
    type: DocumentType;
    file?: File;
}

const CATEGORY_IDS: DocumentCategoryId[] = [
    'all',
    'legal',
    'annualReports',
    'agreements',
    'correspondence',
    'media',
    'projectStudies',
    'projectReports',
];

const CATEGORY_LABEL_KEYS: Record<DocumentCategoryId, string> = {
    all: 'institutional_donors.documentsTab.categoryAll',
    legal: 'institutional_donors.documentsTab.categoryLegal',
    annualReports: 'institutional_donors.documentsTab.categoryAnnualReports',
    agreements: 'institutional_donors.documentsTab.categoryAgreements',
    correspondence: 'institutional_donors.documentsTab.categoryCorrespondence',
    media: 'institutional_donors.documentsTab.categoryMedia',
    projectStudies: 'institutional_donors.documentsTab.categoryProjectStudies',
    projectReports: 'institutional_donors.documentsTab.categoryProjectReports',
};

const initialDocuments: DocumentItem[] = [
    { id: 'folder1', name: 'Legal Documents', category: 'legal', date: '2022-08-10', size: '--', type: 'folder' },
    { id: 'doc1', name: 'Partnership Agreement 2024.pdf', category: 'agreements', date: '2024-01-15', size: '2.5 MB', type: 'pdf' },
    { id: 'doc2', name: 'Annual Report 2023.pdf', category: 'annualReports', date: '2024-02-01', size: '15.2 MB', type: 'pdf' },
    { id: 'doc4', name: 'Water Project Correspondence.docx', category: 'correspondence', date: '2024-05-20', size: '1.1 MB', type: 'docx' },
    { id: 'doc5', name: 'Signing Ceremony.jpg', category: 'media', date: '2024-01-16', size: '4.8 MB', type: 'jpg' },
    { id: 'doc6', name: 'Institutional Overview.mp4', category: 'media', date: '2023-11-10', size: '58.4 MB', type: 'mp4' },
];

/** PLACEHOLDER: Replace with institutional donor documents API when backend is activated. */
const DONORS_WITH_SEED_DOCUMENTS = new Set(['G-00123', 'G-00301', 'UN-001', 'QA-001']);
const donorDocumentsCache = new Map<string, DocumentItem[]>();

function seedDocumentsForDonor(donorId: string): DocumentItem[] {
    if (!DONORS_WITH_SEED_DOCUMENTS.has(donorId)) {
        return [];
    }
    return initialDocuments.map((doc) => ({
        ...doc,
        id: `${donorId}-${doc.id}`,
    }));
}

function loadDocumentsForDonor(donorId: string): DocumentItem[] {
    if (!donorDocumentsCache.has(donorId)) {
        donorDocumentsCache.set(donorId, seedDocumentsForDonor(donorId));
    }
    return [...(donorDocumentsCache.get(donorId) ?? [])];
}

export function clearDonorDocumentsCache(donorId: string) {
    donorDocumentsCache.delete(donorId);
}

const getFileIcon = (type: DocumentType) => {
    switch (type) {
        case 'pdf': return <PdfIcon />;
        case 'docx': return <WordIcon />;
        case 'jpg': return <ImageIcon />;
        case 'mp4': return <VideoIcon />;
        case 'folder': return <FolderIcon />;
        default: return <GenericFileIcon />;
    }
};

const FilePreviewModal: React.FC<{ item: DocumentItem; onClose: () => void; language: string }> = ({ item, onClose, language }) => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const isImage = item.type === 'jpg';
    const isVideo = item.type === 'mp4';
    const fileUrl = item.file ? URL.createObjectURL(item.file) : '#';

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ModalPortal isOpen onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h3 className="font-bold text-lg flex items-center gap-2">{getFileIcon(item.type)} {item.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isImage && <img src={fileUrl} alt={item.name} className="max-w-full h-auto rounded-lg mx-auto" />}
                    {isVideo && <video src={fileUrl} controls className="w-full rounded-lg" />}
                    {!isImage && !isVideo && (
                        <div className="text-center py-10">
                            <div className="text-6xl mx-auto w-fit">{getFileIcon(item.type)}</div>
                            <p className="mt-4 text-gray-500">{t('institutional_donors.documentsTab.noPreview')}</p>
                        </div>
                    )}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm space-y-2">
                        <p><strong>{t('institutional_donors.documentsTab.sizeLabel')}:</strong> {item.size}</p>
                        <p><strong>{t('institutional_donors.documentsTab.uploadDateLabel')}:</strong> {formatDate(item.date, language)}</p>
                        <p><strong>{t('institutional_donors.documentsTab.categoryLabel')}:</strong> {t(CATEGORY_LABEL_KEYS[item.category])}</p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"><Download size={16}/> {t('institutional_donors.documentsTab.download')}</button>
                </div>
            </div>
        </ModalPortal>
    );
};


interface DocumentsTabProps {
    donor: InstitutionalDonor;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ donor }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();
    const [documents, setDocuments] = useState<DocumentItem[]>(() => loadDocumentsForDonor(donor.id));
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategoryId>('all');
    const [previewItem, setPreviewItem] = useState<DocumentItem | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setDocuments(loadDocumentsForDonor(donor.id));
        setSelectedCategory('all');
        setPreviewItem(null);
        setSelectedIds(new Set());
    }, [donor.id]);

    useEffect(() => {
        donorDocumentsCache.set(donor.id, documents);
    }, [donor.id, documents]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: DocumentItem[] = acceptedFiles.map(file => {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'generic';
            let type: DocumentType = 'generic';
            if (['pdf', 'docx', 'jpg', 'mp4'].includes(extension)) {
                type = extension as DocumentType;
            }
            return {
                id: `${donor.id}-file-${Date.now()}-${Math.random()}`,
                name: file.name,
                category: selectedCategory === 'all' ? 'correspondence' : selectedCategory,
                date: new Date().toISOString(),
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: type,
                file: file,
            };
        });
        setDocuments(prev => [...newFiles, ...prev]);
        toast.showSuccess(t('institutional_donors.documentsTab.uploadSuccess', { count: newFiles.length }));
    }, [donor.id, selectedCategory, toast, t]);

    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

    const handleNewFolder = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const folderName = prompt(t('institutional_donors.documentsTab.folderPrompt'));
        if (folderName && folderName.trim() !== '') {
            const newFolder: DocumentItem = {
                id: `${donor.id}-folder-${Date.now()}`,
                name: folderName.trim(),
                category: selectedCategory === 'all' ? 'correspondence' : selectedCategory,
                date: new Date().toISOString(),
                size: '--',
                type: 'folder'
            };
            setDocuments(prev => [newFolder, ...prev]);
            toast.showSuccess(t('institutional_donors.documentsTab.folderCreated', { name: folderName.trim() }));
        }
    }, [donor.id, selectedCategory, toast, t]);

    const handleDelete = (id: string) => {
        if (window.confirm(t('institutional_donors.documentsTab.deleteConfirm'))) {
            setDocuments(prev => prev.filter(doc => doc.id !== id));
            toast.showInfo(t('institutional_donors.documentsTab.deleteSuccess'));
        }
    };
    
    const handleDownload = (item: DocumentItem) => {
        if (item.file) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(item.file);
            link.download = item.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            toast.showWarning(t('institutional_donors.documentsTab.mockDownloadWarning'));
        }
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => 
            selectedCategory === 'all' || doc.category === selectedCategory
        ).sort((a,b) => (a.type === 'folder' ? -1 : 1) - (b.type === 'folder' ? -1 : 1));
    }, [documents, selectedCategory]);

    return (
        <div {...getRootProps({ className: `flex flex-col md:flex-row gap-6 relative transition-colors ${isDragActive ? 'bg-blue-50' : ''}` })}>
            <input {...getInputProps()} />
             {isDragActive && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center z-20 border-4 border-dashed border-primary rounded-2xl">
                    <Upload size={64} className="text-primary"/>
                    <p className="mt-4 text-xl font-bold text-primary">{t('institutional_donors.documentsTab.dropHere')}</p>
                </div>
            )}
            
            {previewItem && <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} language={language} />}
            
            <aside className="w-full md:w-1/4">
                <div className="bg-card dark:bg-dark-card/50 p-4 rounded-xl space-y-2 border dark:border-slate-700">
                    <h4 className="font-bold mb-2">{t('institutional_donors.documentsTab.categoriesTitle')}</h4>
                    {CATEGORY_IDS.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-start p-3 rounded-md text-sm font-semibold transition-colors ${selectedCategory === cat ? 'bg-primary-light text-primary-dark' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                            {t(CATEGORY_LABEL_KEYS[cat])}
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1">
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
                    <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h3 className="font-bold">{t('institutional_donors.documentsTab.libraryTitle', { count: filteredDocuments.length })}</h3>
                        <div className="flex gap-2">
                            <button onClick={handleNewFolder} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700"><FolderPlus size={16}/> {t('institutional_donors.documentsTab.newFolder')}</button>
                            <button onClick={open} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"><Upload size={16}/> {t('institutional_donors.documentsTab.uploadFile')}</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-dark-card/50">
                                <tr>
                                    <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} aria-label={t('common.confirm')} /></th>
                                    <th className="p-3 text-start">{t('institutional_donors.documentsTab.fileName')}</th>
                                    <th className="p-3 text-start">{t('institutional_donors.documentsTab.uploadDate')}</th>
                                    <th className="p-3 text-start">{t('institutional_donors.documentsTab.size')}</th>
                                    <th className="p-3 text-start">{t('institutional_donors.documentsTab.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.map(doc => (
                                    <tr key={doc.id} onDoubleClick={() => setPreviewItem(doc)} className="border-t dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 cursor-pointer">
                                        <td className="p-3"><input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => handleSelect(doc.id)} onClick={e => e.stopPropagation()} /></td>
                                        <td className="p-3 font-semibold">
                                            <div className="flex items-center gap-3">
                                                <span>{getFileIcon(doc.type)}</span>
                                                <span>{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-500">{formatDate(doc.date, language)}</td>
                                        <td className="p-3 text-gray-500">{doc.size}</td>
                                        <td className="p-3">
                                            <div className="flex justify-start" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setPreviewItem(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('institutional_donors.documentsTab.preview')}><Eye size={16}/></button>
                                                <button onClick={() => handleDownload(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title={t('institutional_donors.documentsTab.download')}><Download size={16}/></button>
                                                <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-full hover:bg-red-100 text-red-500" title={t('institutional_donors.documentsTab.delete')}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDocuments.length === 0 && (
                            <div className="text-center p-16 text-gray-500">
                                <p>{documents.length === 0 ? t('institutional_donors.documentsTab.emptyLibrary') : t('institutional_donors.documentsTab.emptyCategory')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocumentsTab;
