import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type Db = PostgresJsDatabase<typeof schema>;

type GriStatus = 'not_started' | 'in_progress' | 'complete';

interface SeedResponse {
    disclosureNumber: string;
    narrative: string;
    status: GriStatus;
    reference: string;
}

// Demo GRI disclosure responses for the seed org. Covers the full 38-disclosure catalog
// (16 universal + 22 topic) with a realistic maturity spread: most universal/economic/social
// disclosures complete, environmental reporting still ramping up. Keeps the Overview donut
// and KPI rings populated instead of showing an all-missing chart.
export const SEED_GRI_MATERIAL_TOPICS = ['2-7', '201-1', '404-1', '405-1', '413-1', '302-1'];
export const SEED_GRI_REPORT_PERIOD = '2025';
export const SEED_GRI_FRAMEWORK_VERSION = 'GRI Standards 2021';

export const SEED_GRI_RESPONSES: SeedResponse[] = [
    // ── GRI 1: Foundation ────────────────────────────────────────────────
    { disclosureNumber: '1-1', narrative: 'أعدّت المنظمة هذا التقرير وفقاً لمعايير GRI للفترة من 1 يناير إلى 31 ديسمبر 2025.', status: 'complete', reference: 'ص. 3' },
    { disclosureNumber: '1-2', narrative: 'طُبّقت مبادئ الإبلاغ الستة: الدقة والتوازن والوضوح والقابلية للمقارنة والموثوقية والتوقيت، مع مراجعة داخلية للبيانات قبل النشر.', status: 'complete', reference: 'ص. 4' },
    // ── GRI 2: General Disclosures ───────────────────────────────────────
    { disclosureNumber: '2-1', narrative: 'مؤسسة الوقف الخيري، مؤسسة أهلية غير ربحية مسجّلة لدى المركز الوطني لتنمية القطاع غير الربحي، ومقرها الرئيسي في الرياض، المملكة العربية السعودية.', status: 'complete', reference: 'ص. 6' },
    { disclosureNumber: '2-2', narrative: 'يشمل التقرير الكيان الأم وجميع الفروع التشغيلية في مناطق الرياض ومكة المكرمة والمنطقة الشرقية.', status: 'complete', reference: 'ص. 6' },
    { disclosureNumber: '2-3', narrative: 'الفترة المشمولة هي السنة المالية 2025، بدورية إبلاغ سنوية. نُشر التقرير في مارس 2026، وجهة الاتصال: إدارة الاستدامة.', status: 'complete', reference: 'ص. 7' },
    { disclosureNumber: '2-4', narrative: 'لا توجد إعادة صياغة جوهرية لمعلومات وردت في تقارير سابقة خلال فترة الإبلاغ الحالية.', status: 'complete', reference: 'ص. 7' },
    { disclosureNumber: '2-5', narrative: 'يخضع التقرير لتحقق داخلي من إدارة المراجعة. لم يُعتمد بعد التحقق الخارجي المستقل لهذه الدورة.', status: 'in_progress', reference: '' },
    { disclosureNumber: '2-6', narrative: 'تعمل المنظمة في مجالات الأوقاف والرعاية الاجتماعية والتعليم والتمكين الاقتصادي، وتخدم المستفيدين عبر شراكات مع جهات منفّذة محلية.', status: 'complete', reference: 'ص. 9' },
    { disclosureNumber: '2-7', narrative: 'بلغ إجمالي الموظفين 240 موظفاً في نهاية 2025: 148 رجلاً و92 امرأة، منهم 205 بعقود دائمة و35 بعقود محددة المدة، موزّعين على ثلاث مناطق تشغيلية.', status: 'complete', reference: 'ص. 12' },
    { disclosureNumber: '2-8', narrative: 'يعمل مع المنظمة 34 متعاقداً و620 متطوعاً نشطاً خلال العام، معظمهم في تنفيذ البرامج الميدانية الموسمية.', status: 'complete', reference: 'ص. 13' },
    { disclosureNumber: '2-9', narrative: 'يتكوّن هيكل الحوكمة من مجلس أمناء مكوّن من 9 أعضاء وثلاث لجان دائمة: التدقيق، والاستثمار، والحوكمة والمكافآت.', status: 'complete', reference: 'ص. 15' },
    { disclosureNumber: '2-10', narrative: 'تجري عملية ترشيح واختيار أعضاء المجلس عبر لجنة الحوكمة وفق معايير الكفاءة والاستقلالية والتنوّع.', status: 'in_progress', reference: '' },
    { disclosureNumber: '2-11', narrative: 'رئيس مجلس الأمناء غير تنفيذي ومستقل، بما يضمن الفصل بين الإشراف والإدارة التنفيذية.', status: 'complete', reference: 'ص. 16' },
    // ── GRI 3: Material Topics ───────────────────────────────────────────
    { disclosureNumber: '3-1', narrative: 'حُدّدت الموضوعات الجوهرية عبر تقييم مادّية أُشرك فيه أصحاب المصلحة الرئيسيون (المستفيدون، المانحون، الموظفون، الجهات التنظيمية) من خلال استبيانات وورش عمل.', status: 'complete', reference: 'ص. 18' },
    { disclosureNumber: '3-2', narrative: 'شملت قائمة الموضوعات الجوهرية: الأثر الاقتصادي المجتمعي، تنمية رأس المال البشري، النزاهة ومكافحة الفساد، والحوكمة الشفافة.', status: 'complete', reference: 'ص. 18' },
    { disclosureNumber: '3-3', narrative: 'توثّق المنظمة نهج إدارة كل موضوع جوهري وربطه بمؤشرات الأداء عبر بوصلة الأداء الاستراتيجي (بوصلة).', status: 'in_progress', reference: '' },
    // ── GRI 200: Economic ────────────────────────────────────────────────
    { disclosureNumber: '201-1', narrative: 'بلغت القيمة الاقتصادية المباشرة المتولّدة 61,300,000 ريال، والقيمة الموزّعة 42,500,000 ريال شملت البرامج والأجور والمصروفات التشغيلية والاستثمار المجتمعي.', status: 'complete', reference: 'ص. 21' },
    { disclosureNumber: '201-2', narrative: 'جارٍ إعداد تحليل المخاطر والفرص المالية المرتبطة بتغيّر المناخ ضمن إطار إدارة المخاطر المؤسسية.', status: 'in_progress', reference: '' },
    { disclosureNumber: '201-3', narrative: 'التزامات خطط نهاية الخدمة ممولّة بالكامل وفق النظام، وتُراجَع اكتوارياً بشكل دوري.', status: 'complete', reference: 'ص. 23' },
    { disclosureNumber: '201-4', narrative: 'لم تتلقَّ المنظمة مساعدات مالية حكومية مباشرة أو إعفاءات ضريبية خلال فترة الإبلاغ.', status: 'complete', reference: 'ص. 23' },
    { disclosureNumber: '203-1', narrative: 'استثمرت المنظمة 7,800,000 ريال في مشاريع بنية تحتية مجتمعية شملت مراكز تدريب وآبار مياه في المناطق المستهدفة.', status: 'complete', reference: 'ص. 25' },
    { disclosureNumber: '203-2', narrative: 'أسهمت البرامج في خلق فرص دخل غير مباشرة لأكثر من 1,900 أسرة عبر التمكين الاقتصادي والتدريب المهني.', status: 'in_progress', reference: '' },
    { disclosureNumber: '205-1', narrative: 'خضعت 100% من الوحدات التشغيلية لتقييم مخاطر الفساد خلال العام ضمن برنامج الامتثال السنوي.', status: 'complete', reference: 'ص. 27' },
    { disclosureNumber: '205-2', narrative: 'تلقّى 96% من الموظفين و100% من أعضاء المجلس تدريباً على سياسات مكافحة الفساد وتضارب المصالح.', status: 'complete', reference: 'ص. 27' },
    { disclosureNumber: '205-3', narrative: 'لم تُسجَّل أي حوادث فساد مؤكدة خلال فترة الإبلاغ.', status: 'complete', reference: 'ص. 28' },
    // ── GRI 300: Environmental ───────────────────────────────────────────
    { disclosureNumber: '301-1', narrative: 'جارٍ حصر المواد المستهلكة (الورق والمواد التشغيلية) لإعداد بيانات كمية موثوقة للدورة القادمة.', status: 'in_progress', reference: '' },
    { disclosureNumber: '302-1', narrative: 'بلغ استهلاك الطاقة داخل المقار الرئيسية 1,240 ميجاوات/ساعة، مع خطة لتركيب أنظمة إضاءة موفّرة.', status: 'complete', reference: 'ص. 30' },
    { disclosureNumber: '303-1', narrative: 'لم تُوثَّق بعد سياسة إدارة التفاعل مع المياه بشكل رسمي؛ العمل جارٍ على إطار الحوكمة البيئية.', status: 'not_started', reference: '' },
    { disclosureNumber: '305-1', narrative: 'لم تُحتسب بعد انبعاثات النطاق الأول؛ سيُعتمد منهج حساب معياري في الدورة القادمة.', status: 'not_started', reference: '' },
    { disclosureNumber: '306-1', narrative: 'جارٍ إعداد جرد أنواع وكميات النفايات الناتجة عن الأنشطة التشغيلية.', status: 'in_progress', reference: '' },
    // ── GRI 400: Social ──────────────────────────────────────────────────
    { disclosureNumber: '401-1', narrative: 'بلغ عدد التعيينات الجديدة 38 موظفاً ومعدل دوران الموظفين 9.4% خلال العام، مع تفصيل حسب الجنس والفئة العمرية.', status: 'complete', reference: 'ص. 33' },
    { disclosureNumber: '401-2', narrative: 'تشمل مزايا الموظفين التأمين الصحي، وإجازة الوالدية، وبرامج التطوير المهني، والدعم التعليمي للأبناء.', status: 'complete', reference: 'ص. 33' },
    { disclosureNumber: '401-3', narrative: 'استفاد 18 موظفاً من إجازة الوالدية خلال العام بمعدل عودة للعمل بلغ 94%.', status: 'in_progress', reference: '' },
    { disclosureNumber: '403-1', narrative: 'تطبّق المنظمة نظاماً موثّقاً لإدارة الصحة والسلامة المهنية يغطّي جميع المواقع التشغيلية.', status: 'complete', reference: 'ص. 35' },
    { disclosureNumber: '404-1', narrative: 'بلغ متوسط ساعات التدريب 22 ساعة لكل موظف سنوياً، بإجمالي أكثر من 5,200 ساعة تدريبية.', status: 'complete', reference: 'ص. 36' },
    { disclosureNumber: '405-1', narrative: 'تمثّل النساء 38% من إجمالي الموظفين و33% من أعضاء مجلس الأمناء، مع توزيع عمري متوازن عبر الفئات.', status: 'complete', reference: 'ص. 37' },
    { disclosureNumber: '413-1', narrative: 'نُفِّذ 18 برنامجاً مجتمعياً استفاد منها أكثر من 12,000 مستفيد في المناطق المستهدفة خلال العام.', status: 'complete', reference: 'ص. 39' },
    { disclosureNumber: '414-1', narrative: 'خضع 45% من الموردين الرئيسيين لتقييم اجتماعي أولي؛ العمل جارٍ على تعميم التقييم على كامل سلسلة التوريد.', status: 'in_progress', reference: '' },
];

export async function seedGri(db: Db, orgId: string) {
    // Reuse an existing report for the org if present, otherwise create one.
    const existing = await db
        .select({ id: schema.gri_reports.id })
        .from(schema.gri_reports)
        .where(eq(schema.gri_reports.org_id, orgId))
        .limit(1);

    let reportId: string;
    if (existing[0]) {
        reportId = existing[0].id;
        await db
            .update(schema.gri_reports)
            .set({
                report_period: SEED_GRI_REPORT_PERIOD,
                framework_version: SEED_GRI_FRAMEWORK_VERSION,
                material_topics: SEED_GRI_MATERIAL_TOPICS,
                updated_at: new Date(),
            })
            .where(eq(schema.gri_reports.id, reportId));
    } else {
        const [created] = await db
            .insert(schema.gri_reports)
            .values({
                org_id: orgId,
                report_period: SEED_GRI_REPORT_PERIOD,
                framework_version: SEED_GRI_FRAMEWORK_VERSION,
                material_topics: SEED_GRI_MATERIAL_TOPICS,
            })
            .returning();
        reportId = created.id;
    }

    for (const response of SEED_GRI_RESPONSES) {
        const found = await db
            .select({ id: schema.gri_disclosure_responses.id })
            .from(schema.gri_disclosure_responses)
            .where(and(
                eq(schema.gri_disclosure_responses.report_id, reportId),
                eq(schema.gri_disclosure_responses.disclosure_number, response.disclosureNumber),
            ))
            .limit(1);

        if (found[0]) {
            await db
                .update(schema.gri_disclosure_responses)
                .set({
                    narrative: response.narrative,
                    status: response.status,
                    reference: response.reference,
                    updated_at: new Date(),
                })
                .where(eq(schema.gri_disclosure_responses.id, found[0].id));
        } else {
            await db.insert(schema.gri_disclosure_responses).values({
                org_id: orgId,
                report_id: reportId,
                disclosure_number: response.disclosureNumber,
                narrative: response.narrative,
                status: response.status,
                reference: response.reference,
            });
        }
    }

    return { reportId, count: SEED_GRI_RESPONSES.length };
}
