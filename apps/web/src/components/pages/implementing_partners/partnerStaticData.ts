export interface PartnerProject {
    id: string;
    status: string;
    name: string;
    sector: string;
    duration: string;
    budget: number;
    beneficiaries: number;
    location: string;
    progress: number;
}

export const MOCK_PARTNER_PROJECTS: PartnerProject[] = [
    { id: 'pp-1', status: 'مكتمل', name: 'برنامج محو الأمية للكبار', sector: 'التعليم', duration: 'يناير 2023 - ديسمبر 2023', budget: 50000, beneficiaries: 500, location: 'الرياض', progress: 100 },
    { id: 'pp-2', status: 'جاري التنفيذ', name: 'بناء مركز صحي مجتمعي', sector: 'الصحة', duration: 'مارس 2024 - سبتمبر 2024', budget: 120000, beneficiaries: 2000, location: 'جدة', progress: 65 },
    { id: 'pp-3', status: 'جاري التنفيذ', name: 'تدريب مهني للشباب', sector: 'التنمية', duration: 'يناير 2024 - يونيو 2024', budget: 40000, beneficiaries: 150, location: 'الدمام', progress: 80 },
    { id: 'pp-4', status: 'مكتمل', name: 'حملة تطعيم الأطفال', sector: 'الصحة', duration: 'اكتمل في ديسمبر 2023', budget: 30000, beneficiaries: 10000, location: 'مكة', progress: 100 },
    { id: 'pp-5', status: 'مكتمل', name: 'توزيع مستلزمات مدرسية', sector: 'التعليم', duration: 'اكتمل في أغسطس 2023', budget: 15000, beneficiaries: 2500, location: 'المدينة المنورة', progress: 100 },
    { id: 'pp-6', status: 'متوقف', name: 'برنامج الدعم النفسي', sector: 'الصحة', duration: 'متوقف منذ فبراير 2024', budget: 25000, beneficiaries: 300, location: 'أبها', progress: 40 },
];

export interface PartnerReview {
    id: string;
    reviewer: string;
    date: string;
    project: string;
    rating: number;
    comment: string;
}

export const MOCK_PARTNER_REVIEWS: PartnerReview[] = [
    { id: 'rev-1', reviewer: 'أحمد محمد - مدير المشروع', date: '15 ديسمبر 2023', project: 'برنامج محو الأمية', rating: 5, comment: 'أداء ممتاز في تنفيذ المشروع. الشريك أظهر احترافية عالية والتزام بالجدول الزمني. التواصل كان فعال وشفاف طوال فترة المشروع.' },
    { id: 'rev-2', reviewer: 'فاطمة علي - مديرة البرامج', date: '20 نوفمبر 2023', project: 'حملة تطعيم الأطفال', rating: 4, comment: 'تنفيذ جيد بشكل عام. بعض التأخيرات البسيطة لكن تم معالجتها بسرعة.' },
    { id: 'rev-3', reviewer: 'خالد سعيد', date: '5 نوفمبر 2023', project: 'تدريب مهني للشباب', rating: 5, comment: 'شريك موثوق وملتزم. نتطلع لمشاريع مستقبلية.' },
    { id: 'rev-4', reviewer: 'علي حسن', date: '30 سبتمبر 2023', project: 'توزيع مستلزمات مدرسية', rating: 5, comment: 'فريق متعاون جداً.' },
];

export const MOCK_EVALUATION_KPIS = [
    { label: 'deliveryQuality', rating: 4.5, progress: 90 },
    { label: 'timeliness', rating: 4, progress: 80 },
    { label: 'transparency', rating: 4.8, progress: 96 },
    { label: 'communication', rating: 4.2, progress: 84 },
    { label: 'beneficiarySatisfaction', rating: 4.3, progress: 86 },
];

export type PartnerDocumentCategory = 'agreements' | 'legalCompliance' | 'reports' | 'correspondence' | 'media' | 'projectReports';

export const PARTNER_DOCUMENT_CATEGORY_KEYS = [
    'all',
    'agreements',
    'legalCompliance',
    'reports',
    'correspondence',
    'media',
    'projectReports',
] as const;

export interface PartnerDocument {
    id: string;
    name: string;
    category: PartnerDocumentCategory;
    date: string;
    size: string;
    type: 'folder' | 'pdf' | 'docx' | 'jpg' | 'mp4';
}

export const MOCK_PARTNER_DOCUMENTS: PartnerDocument[] = [
    { id: 'folder1', name: 'الوثائق القانونية', category: 'legalCompliance', date: '2022-08-10', size: '--', type: 'folder' },
    { id: 'doc1', name: 'اتفاقية الشراكة 2024.pdf', category: 'agreements', date: '2024-01-15', size: '2.5 MB', type: 'pdf' },
    { id: 'doc2', name: 'التقرير السنوي 2023.pdf', category: 'reports', date: '2024-02-01', size: '15.2 MB', type: 'pdf' },
    { id: 'doc4', name: 'مراسلات بخصوص مشروع المياه.docx', category: 'correspondence', date: '2024-05-20', size: '1.1 MB', type: 'docx' },
    { id: 'doc5', name: 'صور من حفل التوقيع.jpg', category: 'media', date: '2024-01-16', size: '4.8 MB', type: 'jpg' },
    { id: 'doc6', name: 'فيديو تعريفي بالمؤسسة.mp4', category: 'media', date: '2023-11-10', size: '58.4 MB', type: 'mp4' },
];
