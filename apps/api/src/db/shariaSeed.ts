import type { InferInsertModel } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type Db = PostgresJsDatabase<typeof schema>;

const {
    sharia_activities,
    sharia_exceptions,
    sharia_fatwas,
    sharia_reviews,
    sharia_zakat_policy_rules,
    sharia_zakat_reviews,
} = schema;

type FatwaInsert = Omit<InferInsertModel<typeof sharia_fatwas>, 'org_id' | 'id'>;
type ReviewInsert = Omit<InferInsertModel<typeof sharia_reviews>, 'org_id' | 'id'>;
type ZakatInsert = Omit<InferInsertModel<typeof sharia_zakat_reviews>, 'org_id' | 'id'>;
type PolicyInsert = Omit<InferInsertModel<typeof sharia_zakat_policy_rules>, 'org_id' | 'id'>;
type ExceptionInsert = Omit<InferInsertModel<typeof sharia_exceptions>, 'org_id' | 'id'>;
type ActivityInsert = Omit<InferInsertModel<typeof sharia_activities>, 'org_id' | 'id'>;

export const SEED_SHARIA_FATWAS: FatwaInsert[] = [
    {
        reference_number: 'FTW-2026-014',
        topic_en: 'Zakat eligibility for education grants',
        topic_ar: 'أهلية الزكاة لمنح التعليم',
        question_en: 'Can restricted zakat funds support vocational education grants for families below the nisab threshold?',
        question_ar: 'هل يجوز استخدام أموال الزكاة المقيدة لدعم منح التعليم المهني للأسر دون حد النصاب؟',
        requester: 'Programs Department',
        related_module: 'projects',
        related_record: 'Education Pathways 2026',
        status: 'underReview',
        priority: 'high',
        assigned_reviewer_id: 'sbm-004',
        requested_date: new Date('2026-06-02'),
        due_date: new Date('2026-06-18'),
        ruling_summary_en: '',
        ruling_summary_ar: '',
        review_notes_en: 'Eligibility analysis is complete. Awaiting board confirmation on category treatment.',
        review_notes_ar: 'اكتمل تحليل الأهلية. بانتظار تأكيد الهيئة حول معالجة الفئة.',
        attachments_count: 3,
        status_history: [
            { status: 'submitted', actor: 'Programs Department', date: '2026-06-02' },
            { status: 'underReview', actor: 'Dr. Aisha Ibrahim', date: '2026-06-05' },
        ],
    },
    {
        reference_number: 'FTW-2026-011',
        topic_en: 'Late payment clause in supplier agreement',
        topic_ar: 'شرط التأخير في اتفاقية مورد',
        question_en: 'Does the proposed damages clause in the clinic equipment contract create a prohibited interest-like penalty?',
        question_ar: 'هل يشكل شرط التعويض المقترح في عقد معدات العيادة غرامة شبيهة بالربا؟',
        requester: 'Procurement',
        related_module: 'financials',
        related_record: 'Supplier Contract C-456',
        status: 'submitted',
        priority: 'critical',
        assigned_reviewer_id: 'sbm-001',
        requested_date: new Date('2026-06-08'),
        due_date: new Date('2026-06-14'),
        ruling_summary_en: '',
        ruling_summary_ar: '',
        review_notes_en: 'Contract text uploaded for review.',
        review_notes_ar: 'تم رفع نص العقد للمراجعة.',
        attachments_count: 2,
        status_history: [{ status: 'submitted', actor: 'Procurement', date: '2026-06-08' }],
    },
    {
        reference_number: 'FTW-2026-009',
        topic_en: 'Digital wallet donation settlement',
        topic_ar: 'تسوية تبرعات المحفظة الرقمية',
        question_en: 'Are service-fee deductions in the digital wallet settlement acceptable for sadaqah campaigns?',
        question_ar: 'هل تعتبر خصومات رسوم الخدمة في تسوية المحفظة الرقمية مقبولة لحملات الصدقة؟',
        requester: 'Donor Relations',
        related_module: 'donors',
        related_record: 'Ramadan Digital Campaign',
        status: 'issued',
        priority: 'medium',
        assigned_reviewer_id: 'sbm-002',
        requested_date: new Date('2026-05-15'),
        due_date: new Date('2026-05-29'),
        issued_date: new Date('2026-05-28'),
        ruling_summary_en: 'Permissible when fee terms are disclosed and donor restricted amounts are reconciled net of service charges.',
        ruling_summary_ar: 'جائز عند الإفصاح عن شروط الرسوم وتسوية المبالغ المقيدة للمانح بعد خصم رسوم الخدمة.',
        review_notes_en: 'Finance must document fee treatment in the campaign closeout.',
        review_notes_ar: 'يجب على المالية توثيق معالجة الرسوم في إغلاق الحملة.',
        attachments_count: 4,
        status_history: [
            { status: 'submitted', actor: 'Donor Relations', date: '2026-05-15' },
            { status: 'underReview', actor: 'Sheikh Fatima Al-Mansour', date: '2026-05-18' },
            { status: 'issued', actor: 'Sheikh Fatima Al-Mansour', date: '2026-05-28' },
        ],
    },
];

export const SEED_SHARIA_REVIEWS: ReviewInsert[] = [
    {
        title_en: 'Clinic equipment procurement contract',
        title_ar: 'عقد توريد معدات العيادة',
        type: 'procurementContract',
        description_en: 'Review compensation, warranty, and late delivery clauses before signature.',
        description_ar: 'مراجعة بنود التعويض والضمان والتأخر في التسليم قبل التوقيع.',
        source_module: 'financials',
        source_record: 'PO-2026-044',
        counterparty_or_project: 'Global Med Supply',
        status: 'underReview',
        risk_flag: 'critical',
        priority: 'critical',
        assigned_reviewer_id: 'sbm-001',
        due_date: new Date('2026-06-15'),
        submitted_date: new Date('2026-06-06'),
        decision: 'needsClarification',
        conditions_en: '',
        conditions_ar: '',
        review_notes_en: 'Penalty clause requires clarification from Legal and Procurement.',
        review_notes_ar: 'يتطلب شرط الغرامة توضيحا من الشؤون القانونية والمشتريات.',
        attachments_count: 5,
        activity_history: [
            { status: 'submitted', actor: 'Procurement', date: '2026-06-06' },
            { status: 'underReview', actor: 'Dr. Abdullah Al-Fahim', date: '2026-06-07' },
        ],
    },
    {
        title_en: 'Sukuk reserve investment proposal',
        title_ar: 'مقترح استثمار احتياطي الصكوك',
        type: 'investmentProposal',
        description_en: 'Confirm instrument screening, income purification, and exit conditions.',
        description_ar: 'تأكيد فحص الأداة وتنقية الدخل وشروط الخروج.',
        source_module: 'financials',
        source_record: 'INV-2026-008',
        counterparty_or_project: 'Reserve Liquidity Portfolio',
        status: 'submitted',
        risk_flag: 'high',
        priority: 'high',
        assigned_reviewer_id: 'sbm-004',
        due_date: new Date('2026-06-20'),
        submitted_date: new Date('2026-06-10'),
        decision: null,
        conditions_en: '',
        conditions_ar: '',
        review_notes_en: '',
        review_notes_ar: '',
        attachments_count: 2,
        activity_history: [{ status: 'submitted', actor: 'Finance', date: '2026-06-10' }],
    },
    {
        title_en: 'Emergency grant agreement template',
        title_ar: 'نموذج اتفاقية منحة الطوارئ',
        type: 'grantAgreement',
        description_en: 'Review restricted fund language and beneficiary obligations.',
        description_ar: 'مراجعة صياغة الأموال المقيدة والتزامات المستفيد.',
        source_module: 'projects',
        source_record: 'Grant Template v4',
        counterparty_or_project: 'Emergency Relief Program',
        status: 'approvedWithConditions',
        risk_flag: 'medium',
        priority: 'medium',
        assigned_reviewer_id: 'sbm-002',
        due_date: new Date('2026-05-25'),
        submitted_date: new Date('2026-05-10'),
        decision: 'approvedWithConditions',
        conditions_en: 'Add a paragraph requiring documented eligibility review before disbursement.',
        conditions_ar: 'إضافة فقرة تشترط توثيق مراجعة الأهلية قبل الصرف.',
        review_notes_en: 'Template may be used after Legal applies the required wording.',
        review_notes_ar: 'يمكن استخدام النموذج بعد أن تطبق الشؤون القانونية الصياغة المطلوبة.',
        attachments_count: 3,
        activity_history: [
            { status: 'submitted', actor: 'Programs Department', date: '2026-05-10' },
            { status: 'approvedWithConditions', actor: 'Sheikh Fatima Al-Mansour', date: '2026-05-23' },
        ],
    },
];

export const SEED_SHARIA_ZAKAT_REVIEWS: ZakatInsert[] = [
    {
        beneficiary_en: 'Debt relief disbursement batch',
        beneficiary_ar: 'دفعة صرف تفريج الديون',
        category: 'debtRelief',
        amount: '68000',
        review_date: new Date('2026-06-04'),
        eligibility_status: 'certified',
        financial_transaction: 'DISB-2026-091',
        reviewer_id: 'sbm-003',
        notes_en: 'Beneficiary debt records and hardship evidence reviewed.',
        notes_ar: 'تمت مراجعة سجلات ديون المستفيدين وأدلة التعثر.',
    },
    {
        beneficiary_en: 'Vocational education vouchers',
        beneficiary_ar: 'قسائم التعليم المهني',
        category: 'education',
        amount: '47000',
        review_date: new Date('2026-06-07'),
        eligibility_status: 'needsReview',
        financial_transaction: 'DISB-2026-104',
        reviewer_id: 'sbm-004',
        notes_en: 'Awaiting final fatwa on education category treatment.',
        notes_ar: 'بانتظار الفتوى النهائية حول معالجة فئة التعليم.',
    },
    {
        beneficiary_en: 'Monthly food assistance',
        beneficiary_ar: 'مساعدات الغذاء الشهرية',
        category: 'poorNeedy',
        amount: '92000',
        review_date: new Date('2026-05-28'),
        eligibility_status: 'eligible',
        financial_transaction: 'DISB-2026-077',
        reviewer_id: 'sbm-002',
        notes_en: 'Household means testing completed before payment release.',
        notes_ar: 'اكتمل اختبار احتياج الأسر قبل إطلاق الدفعة.',
    },
    {
        beneficiary_en: 'General operations allocation',
        beneficiary_ar: 'تخصيص العمليات العامة',
        category: 'operations',
        amount: '12000',
        review_date: new Date('2026-06-09'),
        eligibility_status: 'ineligible',
        financial_transaction: 'JRN-2026-230',
        reviewer_id: 'sbm-001',
        notes_en: 'Expense should be moved to unrestricted sadaqah funding.',
        notes_ar: 'ينبغي نقل المصروف إلى تمويل صدقة غير مقيد.',
    },
];

export const SEED_SHARIA_POLICY_RULES: PolicyInsert[] = [
    {
        category: 'poorNeedy',
        rule_en: 'Direct assistance to verified poor and needy households remains the primary category.',
        rule_ar: 'تظل المساعدة المباشرة للأسر الفقيرة والمحتاجة بعد التحقق هي الفئة الأساسية.',
        threshold: 'No cap',
        effective_date: new Date('2026-01-01'),
        status: 'active',
    },
    {
        category: 'debtRelief',
        rule_en: 'Debt relief requires documented debt, inability to repay, and no duplicate coverage.',
        rule_ar: 'يتطلب تفريج الديون توثيق الدين وعدم القدرة على السداد وعدم وجود تغطية مكررة.',
        threshold: '25%',
        effective_date: new Date('2026-01-01'),
        status: 'active',
    },
    {
        category: 'education',
        rule_en: 'Education support is allowed only when tied to verified hardship and employability outcomes.',
        rule_ar: 'يسمح بدعم التعليم فقط عند ارتباطه بتعثر موثق ومخرجات قابلة للتوظيف.',
        threshold: '30%',
        effective_date: new Date('2026-03-01'),
        status: 'review',
    },
];

export const SEED_SHARIA_EXCEPTIONS: ExceptionInsert[] = [
    {
        title_en: 'Interest-bearing transaction detected',
        title_ar: 'رصد معاملة ذات فائدة ربوية',
        severity: 'critical',
        source: 'financials',
        linked_record: 'Bank account ****1234',
        owner: 'Finance Controller',
        status: 'open',
        created_date: new Date('2026-06-11'),
        resolution_notes_en: 'Finance is isolating the transaction and preparing purification entry.',
        resolution_notes_ar: 'تعمل المالية على عزل المعاملة وتجهيز قيد التنقية.',
        follow_up_date: new Date('2026-06-14'),
    },
    {
        title_en: 'Education zakat category approaching policy limit',
        title_ar: 'فئة تعليم الزكاة تقترب من حد السياسة',
        severity: 'high',
        source: 'zakat',
        linked_record: 'Vocational education vouchers',
        owner: 'Programs Department',
        status: 'inReview',
        created_date: new Date('2026-06-09'),
        resolution_notes_en: 'Hold further allocations until the pending ruling is issued.',
        resolution_notes_ar: 'إيقاف التخصيصات الإضافية حتى صدور الحكم المعلق.',
        follow_up_date: new Date('2026-06-18'),
    },
    {
        title_en: 'Procurement contract clause needs Sharia revision',
        title_ar: 'بند عقد مشتريات يحتاج إلى تعديل شرعي',
        severity: 'medium',
        source: 'reviews',
        linked_record: 'PO-2026-044',
        owner: 'Procurement',
        status: 'open',
        created_date: new Date('2026-06-07'),
        resolution_notes_en: 'Clarification requested from supplier.',
        resolution_notes_ar: 'تم طلب توضيح من المورد.',
        follow_up_date: null,
    },
];

export const SEED_SHARIA_ACTIVITIES: ActivityInsert[] = [
    {
        event_type: 'fatwaIssued',
        actor: 'Sheikh Fatima Al-Mansour',
        timestamp: new Date('2026-06-12T11:30:00.000Z'),
        linked_record: 'FTW-2026-009',
        description_en: 'Issued ruling for the digital wallet donation settlement.',
        description_ar: 'أصدرت الحكم الخاص بتسوية تبرعات المحفظة الرقمية.',
    },
    {
        event_type: 'reviewUpdated',
        actor: 'Dr. Abdullah Al-Fahim',
        timestamp: new Date('2026-06-11T14:10:00.000Z'),
        linked_record: 'PO-2026-044',
        description_en: 'Marked procurement contract review as needing clarification.',
        description_ar: 'صنف مراجعة عقد المشتريات على أنها تحتاج إلى توضيح.',
    },
    {
        event_type: 'zakatReviewLogged',
        actor: 'Mr. Omar Hassan',
        timestamp: new Date('2026-06-10T09:40:00.000Z'),
        linked_record: 'DISB-2026-091',
        description_en: 'Certified debt relief disbursement batch as zakat eligible.',
        description_ar: 'صدق أهلية دفعة تفريج الديون للزكاة.',
    },
    {
        event_type: 'exceptionCreated',
        actor: 'System',
        timestamp: new Date('2026-06-09T08:15:00.000Z'),
        linked_record: 'Vocational education vouchers',
        description_en: 'Opened exception for education category policy limit.',
        description_ar: 'فتح استثناء لحد سياسة فئة التعليم.',
    },
    {
        event_type: 'fatwaRequested',
        actor: 'Programs Department',
        timestamp: new Date('2026-06-08T12:20:00.000Z'),
        linked_record: 'FTW-2026-014',
        description_en: 'Requested ruling for zakat eligibility of education grants.',
        description_ar: 'طلب حكما حول أهلية الزكاة لمنح التعليم.',
    },
];

export async function seedShariaCompliance(db: Db, orgId: string) {
    for (const row of SEED_SHARIA_FATWAS) {
        await db.insert(sharia_fatwas).values({ org_id: orgId, ...row }).returning();
    }
    for (const row of SEED_SHARIA_REVIEWS) {
        await db.insert(sharia_reviews).values({ org_id: orgId, ...row }).returning();
    }
    for (const row of SEED_SHARIA_ZAKAT_REVIEWS) {
        await db.insert(sharia_zakat_reviews).values({ org_id: orgId, ...row }).returning();
    }
    for (const row of SEED_SHARIA_POLICY_RULES) {
        await db.insert(sharia_zakat_policy_rules).values({ org_id: orgId, ...row }).returning();
    }
    for (const row of SEED_SHARIA_EXCEPTIONS) {
        await db.insert(sharia_exceptions).values({ org_id: orgId, ...row }).returning();
    }
    for (const row of SEED_SHARIA_ACTIVITIES) {
        await db.insert(sharia_activities).values({ org_id: orgId, ...row }).returning();
    }
}
