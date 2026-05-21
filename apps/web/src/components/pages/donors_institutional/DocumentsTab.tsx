import React, { useState, useMemo, useCallback } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { useDropzone } from 'react-dropzone';
import { Upload, FolderPlus, Trash2, Download, MoreHorizontal, X as XIcon, Search as SearchIcon, Eye } from 'lucide-react';
import { PdfIcon, WordIcon, ImageIcon, VideoIcon, FileIcon as GenericFileIcon, FolderIcon } from '../../icons/FiletypeIcons';
import { formatDate } from '../../../lib/utils';

// Local Types for this component
type DocumentType = 'pdf' | 'docx' | 'jpg' | 'mp4' | 'folder' | 'generic';
interface DocumentItem {
    id: string;
    name: string;
    category: string;
    date: string;
    size: string;
    type: DocumentType;
    file?: File; // For newly uploaded files
}

// Updated Initial Data
const documentCategories = [
    "الكل", "الوثائق القانونية", "التقارير السنوية", "الاتفاقيات", "المراسلات", "الصور والفيديوهات", "دراسات مشاريع", "تقارير مشاريع"
];
const initialDocuments: DocumentItem[] = [
    { id: 'folder1', name: 'الوثائق القانونية', category: 'الوثائق القانونية', date: '2022-08-10', size: '--', type: 'folder' },
    { id: 'doc1', name: 'اتفاقية الشراكة 2024.pdf', category: 'الاتفاقيات', date: '2024-01-15', size: '2.5 MB', type: 'pdf' },
    { id: 'doc2', name: 'التقرير السنوي 2023.pdf', category: 'التقارير السنوية', date: '2024-02-01', size: '15.2 MB', type: 'pdf' },
    { id: 'doc4', name: 'مراسلات بخصوص مشروع المياه.docx', category: 'المراسلات', date: '2024-05-20', size: '1.1 MB', type: 'docx' },
    { id: 'doc5', name: 'صور من حفل التوقيع.jpg', category: 'الصور والفيديوهات', date: '2024-01-16', size: '4.8 MB', type: 'jpg' },
    { id: 'doc6', name: 'فيديو تعريفي بالمؤسسة.mp4', category: 'الصور والفيديوهات', date: '2023-11-10', size: '58.4 MB', type: 'mp4' },
];

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

// --- PREVIEW MODAL ---
const FilePreviewModal: React.FC<{ item: DocumentItem; onClose: () => void }> = ({ item, onClose }) => {
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
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isImage && <img src={fileUrl} alt={item.name} className="max-w-full h-auto rounded-lg mx-auto" />}
                    {isVideo && <video src={fileUrl} controls className="w-full rounded-lg" />}
                    {!isImage && !isVideo && (
                        <div className="text-center py-10">
                            <div className="text-6xl mx-auto w-fit">{getFileIcon(item.type)}</div>
                            <p className="mt-4 text-gray-500">لا توجد معاينة متاحة لهذا النوع من الملفات.</p>
                        </div>
                    )}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm space-y-2">
                        <p><strong>الحجم:</strong> {item.size}</p>
                        <p><strong>تاريخ الرفع:</strong> {formatDate(item.date, 'en')}</p>
                        <p><strong>التصنيف:</strong> {item.category}</p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"><Download size={16}/> تنزيل</button>
                </div>
            </div>
        </ModalPortal>
    );
};


const DocumentsTab: React.FC = () => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();
    const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [previewItem, setPreviewItem] = useState<DocumentItem | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: DocumentItem[] = acceptedFiles.map(file => {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'generic';
            let type: DocumentType = 'generic';
            if (['pdf', 'docx', 'jpg', 'mp4'].includes(extension)) {
                type = extension as DocumentType;
            }
            return {
                id: `file-${Date.now()}-${Math.random()}`,
                name: file.name,
                category: 'المراسلات', // Default category
                date: new Date().toISOString(),
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: type,
                file: file,
            };
        });
        setDocuments(prev => [...newFiles, ...prev]);
        toast.showSuccess(`تم رفع ${newFiles.length} ملف بنجاح!`);
    }, [toast]);
    
    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

    const handleNewFolder = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropzone from handling the click
        const folderName = prompt("أدخل اسم المجلد الجديد:");
        if (folderName && folderName.trim() !== '') {
            const newFolder: DocumentItem = {
                id: `folder-${Date.now()}`,
                name: folderName.trim(),
                category: selectedCategory === 'الكل' ? 'المراسلات' : selectedCategory,
                date: new Date().toISOString(),
                size: '--',
                type: 'folder'
            };
            setDocuments(prev => [newFolder, ...prev]);
            toast.showSuccess(`تم إنشاء مجلد "${folderName.trim()}"`);
        }
    }, [selectedCategory, toast]);

    const handleDelete = (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
            setDocuments(prev => prev.filter(doc => doc.id !== id));
            toast.showInfo("تم حذف العنصر.");
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
            toast.showWarning("لا يمكن تنزيل الملفات الوهمية.");
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
            selectedCategory === 'الكل' || doc.category === selectedCategory
        ).sort((a,b) => (a.type === 'folder' ? -1 : 1) - (b.type === 'folder' ? -1 : 1)); // Folders first
    }, [documents, selectedCategory]);

    return (
        <div {...getRootProps({ className: `flex flex-col md:flex-row gap-6 relative transition-colors ${isDragActive ? 'bg-blue-50' : ''}` })}>
            <input {...getInputProps()} />
             {isDragActive && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center z-20 border-4 border-dashed border-primary rounded-2xl">
                    <Upload size={64} className="text-primary"/>
                    <p className="mt-4 text-xl font-bold text-primary">أفلت الملفات هنا لرفعها</p>
                </div>
            )}
            
            {previewItem && <FilePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
            
            <aside className="w-full md:w-1/4">
                <div className="bg-card dark:bg-dark-card/50 p-4 rounded-xl space-y-2 border dark:border-slate-700">
                    <h4 className="font-bold mb-2">تصنيفات الوثائق</h4>
                    {documentCategories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-right p-3 rounded-md text-sm font-semibold transition-colors ${selectedCategory === cat ? 'bg-primary-light text-primary-dark' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1">
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
                    <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h3 className="font-bold">مكتبة الوثائق ({filteredDocuments.length})</h3>
                        <div className="flex gap-2">
                            <button onClick={handleNewFolder} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700"><FolderPlus size={16}/> مجلد جديد</button>
                            <button onClick={open} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"><Upload size={16}/> رفع ملف</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-right text-xs text-gray-500 uppercase bg-gray-50 dark:bg-dark-card/50">
                                <tr>
                                    <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} /></th>
                                    <th className="p-3">اسم الملف</th>
                                    <th className="p-3">تاريخ الرفع</th>
                                    <th className="p-3">الحجم</th>
                                    <th className="p-3">الإجراءات</th>
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
                                        <td className="p-3 text-gray-500">{formatDate(doc.date, 'en')}</td>
                                        <td className="p-3 text-gray-500">{doc.size}</td>
                                        <td className="p-3">
                                            <div className="flex justify-start" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setPreviewItem(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title="معاينة"><Eye size={16}/></button>
                                                <button onClick={() => handleDownload(doc)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title="تنزيل"><Download size={16}/></button>
                                                <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-full hover:bg-red-100 text-red-500" title="حذف"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDocuments.length === 0 && (
                            <div className="text-center p-16 text-gray-500">
                                <p>لا توجد وثائق في هذا التصنيف.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocumentsTab;
