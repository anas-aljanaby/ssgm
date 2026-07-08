// Page-level mock/local state for the GRI Reporting page (Overview + Disclosures + Report).
// The disclosure catalog itself lives in `griData.ts`; this file holds the per-disclosure
// responses, material topics in scope, and report meta that this page owns and edits.
// ACTIVATE stage swaps these for real hooks with the same shape.

export type GriDisclosureStatus = 'not_started' | 'in_progress' | 'complete';

export interface GriDisclosureResponse {
  narrative: string;
  status: GriDisclosureStatus;
  reference: string;
}

// Keyed by disclosure number (e.g. '2-1'). Missing entries default to 'not_started'.
export const initialGriResponses: Record<string, GriDisclosureResponse> = {
  '1-1': { narrative: 'أعدت المنظمة هذا التقرير وفقاً لمعايير GRI للفترة 2025.', status: 'complete', reference: 'ص. 3' },
  '1-2': { narrative: 'طُبقت مبادئ الإبلاغ الستة: الدقة والتوازن والوضوح والمقارنة والموثوقية والتوقيت.', status: 'complete', reference: 'ص. 4' },
  '2-1': { narrative: 'مؤسسة الوقف الخيري، مؤسسة أهلية غير ربحية، مقرها الرياض، المملكة العربية السعودية.', status: 'complete', reference: 'ص. 6' },
  '2-2': { narrative: 'يشمل التقرير الكيان الأم وجميع الفروع التشغيلية.', status: 'complete', reference: 'ص. 6' },
  '2-3': { narrative: 'الفترة المشمولة: السنة المالية 2025، بدورية إبلاغ سنوية.', status: 'complete', reference: 'ص. 7' },
  '2-6': { narrative: 'تعمل المنظمة في مجالات الأوقاف والرعاية الاجتماعية والتعليم.', status: 'complete', reference: 'ص. 9' },
  '201-1': { narrative: 'بلغت القيمة الاقتصادية المباشرة الموزعة 42,500,000 ريال خلال العام.', status: 'complete', reference: 'ص. 21' },
  '413-1': { narrative: 'نُفذت 18 برنامجاً مجتمعياً استفاد منها أكثر من 12,000 مستفيد.', status: 'complete', reference: 'ص. 34' },
  '2-7': { narrative: 'إجمالي 240 موظفاً، التفاصيل حسب الجنس ونوع العقد قيد الاستكمال.', status: 'in_progress', reference: '' },
  '2-9': { narrative: 'يتكون هيكل الحوكمة من مجلس أمناء وثلاث لجان دائمة.', status: 'in_progress', reference: '' },
  '3-1': { narrative: 'جارٍ توثيق عملية تحديد الموضوعات الجوهرية.', status: 'in_progress', reference: '' },
  '3-2': { narrative: '', status: 'in_progress', reference: '' },
  '401-1': { narrative: '', status: 'in_progress', reference: '' },
  '404-1': { narrative: '', status: 'in_progress', reference: '' },
  '405-1': { narrative: '', status: 'in_progress', reference: '' },
};

// Disclosure numbers of the org's selected material topics (GRI 3). Read-only for MVP;
// future source = the org's materiality assessment (stakeholder_management).
export const griMaterialTopics: string[] = ['2-7', '201-1', '404-1', '405-1', '413-1', '302-1'];

export const griReportMeta = {
  reportPeriod: '2025',
  frameworkVersion: 'GRI Standards 2021',
};
