export interface PartnerProject {
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
    { status: 'مكتمل', name: 'برنامج محو الأمية للكبار', sector: 'التعليم', duration: 'يناير 2023 - ديسمبر 2023', budget: 50000, beneficiaries: 500, location: 'الرياض', progress: 100 },
    { status: 'جاري التنفيذ', name: 'بناء مركز صحي مجتمعي', sector: 'الصحة', duration: 'مارس 2024 - سبتمبر 2024', budget: 120000, beneficiaries: 2000, location: 'جدة', progress: 65 },
    { status: 'جاري التنفيذ', name: 'تدريب مهني للشباب', sector: 'التنمية', duration: 'يناير 2024 - يونيو 2024', budget: 40000, beneficiaries: 150, location: 'الدمام', progress: 80 },
    { status: 'مكتمل', name: 'حملة تطعيم الأطفال', sector: 'الصحة', duration: 'اكتمل في ديسمبر 2023', budget: 30000, beneficiaries: 10000, location: 'مكة', progress: 100 },
    { status: 'مكتمل', name: 'توزيع مستلزمات مدرسية', sector: 'التعليم', duration: 'اكتمل في أغسطس 2023', budget: 15000, beneficiaries: 2500, location: 'المدينة المنورة', progress: 100 },
    { status: 'متوقف', name: 'برنامج الدعم النفسي', sector: 'الصحة', duration: 'متوقف منذ فبراير 2024', budget: 25000, beneficiaries: 300, location: 'أبها', progress: 40 },
];

export interface PartnerReview {
    reviewer: string;
    date: string;
    project: string;
    rating: number;
    comment: string;
    helpful: number;
}

export const MOCK_PARTNER_REVIEWS: PartnerReview[] = [
    { reviewer: 'أحمد محمد - مدير المشروع', date: '15 ديسمبر 2023', project: 'برنامج محو الأمية', rating: 5, comment: 'أداء ممتاز في تنفيذ المشروع. الشريك أظهر احترافية عالية والتزام بالجدول الزمني. التواصل كان فعال وشفاف طوال فترة المشروع.', helpful: 12 },
    { reviewer: 'فاطمة علي - مديرة البرامج', date: '20 نوفمبر 2023', project: 'حملة تطعيم الأطفال', rating: 4, comment: 'تنفيذ جيد بشكل عام. بعض التأخيرات البسيطة لكن تم معالجتها بسرعة.', helpful: 8 },
    { reviewer: 'خالد سعيد', date: '5 نوفمبر 2023', project: 'تدريب مهني للشباب', rating: 5, comment: 'شريك موثوق وملتزم. نتطلع لمشاريع مستقبلية.', helpful: 15 },
    { reviewer: 'مجهول', date: '18 أكتوبر 2023', project: 'بناء مركز صحي', rating: 4, comment: 'كان التسليم النهائي جيدًا.', helpful: 4 },
    { reviewer: 'علي حسن', date: '30 سبتمبر 2023', project: 'توزيع مستلزمات مدرسية', rating: 5, comment: 'فريق متعاون جداً.', helpful: 9 },
];

export const MOCK_RATING_BREAKDOWN: Record<number, number> = { 5: 8, 4: 5, 3: 2, 2: 0, 1: 0 };
export const MOCK_EVALUATION_KPIS = [
    { label: 'جودة التنفيذ', rating: 4.5, progress: 90 },
    { label: 'الالتزام بالمواعيد', rating: 4, progress: 80 },
    { label: 'الشفافية', rating: 4.8, progress: 96 },
    { label: 'التواصل', rating: 4.2, progress: 84 },
    { label: 'رضا المستفيدين', rating: 4.3, progress: 86 },
];

export interface PartnerDocument {
    id: string;
    name: string;
    category: string;
    date: string;
    size: string;
    type: 'folder' | 'pdf' | 'docx' | 'jpg' | 'mp4';
}

export const PARTNER_DOCUMENT_CATEGORIES = [
    'الكل',
    'الوثائق القانونية',
    'التقارير السنوية',
    'الاتفاقيات',
    'المراسلات',
    'الصور والفيديوهات',
    'دراسات مشاريع',
    'تقارير مشاريع',
] as const;

export const MOCK_PARTNER_DOCUMENTS: PartnerDocument[] = [
    { id: 'folder1', name: 'الوثائق القانونية', category: 'الوثائق القانونية', date: '2022-08-10', size: '--', type: 'folder' },
    { id: 'doc1', name: 'اتفاقية الشراكة 2024.pdf', category: 'الاتفاقيات', date: '2024-01-15', size: '2.5 MB', type: 'pdf' },
    { id: 'doc2', name: 'التقرير السنوي 2023.pdf', category: 'التقارير السنوية', date: '2024-02-01', size: '15.2 MB', type: 'pdf' },
    { id: 'doc4', name: 'مراسلات بخصوص مشروع المياه.docx', category: 'المراسلات', date: '2024-05-20', size: '1.1 MB', type: 'docx' },
    { id: 'doc5', name: 'صور من حفل التوقيع.jpg', category: 'الصور والفيديوهات', date: '2024-01-16', size: '4.8 MB', type: 'jpg' },
    { id: 'doc6', name: 'فيديو تعريفي بالمؤسسة.mp4', category: 'الصور والفيديوهات', date: '2023-11-10', size: '58.4 MB', type: 'mp4' },
];
