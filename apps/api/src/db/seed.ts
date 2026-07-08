import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { SEED_BENEFICIARIES } from './beneficiarySeed';
import { resolveProjectId, seedProjects } from './projectSeed';
import { seedBousala } from './bousalaSeed';
import { SEED_STAKEHOLDERS } from './stakeholderSeed';
import { SEED_IMPLEMENTING_PARTNERS } from './implementingPartnerSeed';
import { seedShariaCompliance } from './shariaSeed';
import { seedOrgModules } from '../lib/orgModules';

const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const SEED_ORG_NAME = 'MSS Test Organization';

const SEED_DONORS = [
    {
        full_name_en: 'Aisha Al-Farsi',
        full_name_ar: 'عائشة الفارسي',
        email: 'aisha.f@example.com',
        phone: '+971 50 123 4567',
        status: 'Active',
        tier: 'Gold',
        country: 'UAE',
        tags: ['Education', 'Annual Gala'],
        assigned_manager: 'Fatma Kaya',
        donor_since: new Date('2021-03-15'),
        donor_category: 'Recurring',
        total_donations: '15250.00',
        donations_count: 12,
        avg_gift: '1270.83',
        primary_program_interest: 'Education',
    },
    {
        full_name_en: 'John Smith',
        full_name_ar: 'جون سميث',
        email: 'john.smith@example.com',
        phone: '+1 202 555 0191',
        status: 'Active',
        tier: 'Silver',
        country: 'USA',
        tags: ['Healthcare'],
        assigned_manager: 'Ahmad Noor',
        donor_since: new Date('2022-01-10'),
        donor_category: 'Hero',
        total_donations: '7800.00',
        donations_count: 5,
        avg_gift: '1560.00',
        primary_program_interest: 'Healthcare',
    },
    {
        full_name_en: 'Fatima Al-Rashid',
        full_name_ar: 'فاطمة الراشد',
        email: 'fatima.r@example.com',
        phone: '+966 55 987 6543',
        status: 'Active',
        tier: 'Platinum',
        country: 'Saudi Arabia',
        tags: ['Orphan Care', 'Ramadan Campaign', 'Water Projects'],
        assigned_manager: 'Fatma Kaya',
        donor_since: new Date('2019-06-01'),
        donor_category: 'Recurring',
        total_donations: '85000.00',
        donations_count: 30,
        avg_gift: '2833.33',
        primary_program_interest: 'Orphan Care',
    },
    {
        full_name_en: 'Omar Khalil',
        full_name_ar: 'عمر خليل',
        email: 'omar.k@example.com',
        phone: '+962 79 555 1234',
        status: 'Lapsed',
        tier: 'Bronze',
        country: 'Jordan',
        tags: ['Seasonal'],
        assigned_manager: 'Ahmad Noor',
        donor_since: new Date('2023-11-20'),
        donor_category: 'Seasonal',
        total_donations: '500.00',
        donations_count: 1,
        avg_gift: '500.00',
        primary_program_interest: 'Emergency Relief',
    },
    {
        full_name_en: 'Sarah Johnson',
        full_name_ar: 'سارة جونسون',
        email: 'sarah.j@example.com',
        phone: '+44 20 7946 0958',
        status: 'Active',
        tier: 'Gold',
        country: 'UK',
        tags: ['Education', 'Water Projects'],
        assigned_manager: 'Fatma Kaya',
        donor_since: new Date('2020-09-12'),
        donor_category: 'Recurring',
        total_donations: '22400.00',
        donations_count: 18,
        avg_gift: '1244.44',
        primary_program_interest: 'Water Projects',
    },
    {
        full_name_en: 'Mohammed Al-Sayed',
        full_name_ar: 'محمد السيد',
        email: 'mohammed.s@example.com',
        phone: '+20 100 555 7890',
        status: 'Active',
        tier: 'Major Donor',
        country: 'Egypt',
        tags: ['Orphan Care', 'Education', 'Annual Gala', 'Board Member'],
        assigned_manager: 'Ahmad Noor',
        donor_since: new Date('2018-01-05'),
        donor_category: 'Hero',
        total_donations: '250000.00',
        donations_count: 45,
        avg_gift: '5555.56',
        primary_program_interest: 'Education',
    },
    {
        full_name_en: 'Layla Hassan',
        full_name_ar: 'ليلى حسن',
        email: 'layla.h@example.com',
        phone: '+971 56 789 0123',
        status: 'On Hold',
        tier: 'Silver',
        country: 'UAE',
        tags: ['Healthcare', 'Ramadan Campaign'],
        assigned_manager: 'Fatma Kaya',
        donor_since: new Date('2022-06-15'),
        donor_category: 'Event',
        total_donations: '4200.00',
        donations_count: 3,
        avg_gift: '1400.00',
        primary_program_interest: 'Healthcare',
    },
    {
        full_name_en: 'Yusuf Demir',
        full_name_ar: 'يوسف دمير',
        email: 'yusuf.d@example.com',
        phone: '+90 532 111 2233',
        status: 'Active',
        tier: 'Gold',
        country: 'Turkey',
        tags: ['Emergency Relief', 'Water Projects'],
        assigned_manager: 'Ahmad Noor',
        donor_since: new Date('2021-08-22'),
        donor_category: 'Recurring',
        total_donations: '18700.00',
        donations_count: 14,
        avg_gift: '1335.71',
        primary_program_interest: 'Emergency Relief',
    },
];

const SAMPLE_PROGRAMS = ['Education', 'Healthcare', 'Orphan Care', 'Water Projects', 'Emergency Relief', 'Ramadan Campaign'];

const SEED_INSTITUTIONAL_DONORS = [
    {
        key: 'qatar_charity',
        name_en: 'Qatar Charity',
        name_ar: 'قطر الخيرية',
        type: 'Foundation',
        relationship_status: 'Active',
        priority: 'High',
        assigned_manager: 'Fatma Kaya',
        primary_contact_name: 'Yousef Al-Kuwari',
        primary_contact_email: 'info@qcharity.org',
        focus_areas: ['Humanitarian Aid', 'Education'],
        geographic_focus: ['Global'],
        country: 'Qatar',
        custom_fields: { city: 'Doha', registration_number: 'QC-REG-1992', website: 'https://www.qcharity.org' },
    },
    {
        key: 'eda',
        name_en: 'European Development Agency',
        name_ar: 'وكالة التنمية الأوروبية',
        type: 'Government',
        relationship_status: 'Active',
        priority: 'High',
        assigned_manager: 'Ali Veli',
        primary_contact_name: 'Sophie Dubois',
        primary_contact_email: 's.dubois@eda.eu',
        focus_areas: ['Humanitarian Aid', 'Refugee Support'],
        geographic_focus: ['MENA', 'Eastern Europe'],
        country: 'Belgium',
        custom_fields: { city: 'Brussels', registration_number: 'EU-DA-54321' },
    },
    {
        key: 'unicef',
        name_en: 'UNICEF',
        name_ar: 'اليونيسف',
        type: 'Multilateral',
        relationship_status: 'Active',
        priority: 'High',
        assigned_manager: 'System Admin',
        primary_contact_name: 'Grants Division',
        primary_contact_email: 'grants@unicef.org',
        focus_areas: ['Child Protection', 'Education'],
        geographic_focus: ['Global'],
        country: 'USA',
        custom_fields: { city: 'New York', website: 'https://www.unicef.org' },
    },
] as const;

function randomDonations(donorId: string, orgId: string, count: number) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 730) + 30;
        rows.push({
            org_id: orgId,
            donor_id: donorId,
            amount: String((Math.floor(Math.random() * 5000) + 100).toFixed(2)),
            date: new Date(Date.now() - daysAgo * 86400000),
            program: SAMPLE_PROGRAMS[Math.floor(Math.random() * SAMPLE_PROGRAMS.length)],
        });
    }
    return rows;
}

async function lookupUserId(email: string): Promise<string> {
    const rows = await client`SELECT id FROM auth.users WHERE email = ${email} LIMIT 1`;
    if (!rows.length) throw new Error(`No Supabase user found with email: ${email}`);
    return rows[0].id;
}

async function reset() {
    console.log('Resetting: deleting all seed data...');
    // Financial tables (reverse FK order)
    await db.delete(schema.financial_alerts);
    await db.delete(schema.financial_reports);
    await db.delete(schema.approval_items);
    await db.delete(schema.grant_installments);
    await db.delete(schema.grants);
    await db.delete(schema.institutional_donor_documents);
    await db.delete(schema.institutional_donor_contacts);
    await db.delete(schema.institutional_donors);
    await db.delete(schema.disbursements);
    await db.delete(schema.budget_lines);
    await db.delete(schema.project_budgets);
    await db.delete(schema.pledge_installments);
    await db.delete(schema.financial_pledges);
    await db.delete(schema.donation_records);
    await db.delete(schema.transaction_attachments);
    await db.delete(schema.financial_transactions);
    await db.delete(schema.funds);
    // Donor tables
    await db.delete(schema.donor_documents);
    await db.delete(schema.donor_interactions);
    await db.delete(schema.donor_tasks);
    await db.delete(schema.donations);
    await db.delete(schema.individual_donors);
    await db.delete(schema.partner_evaluations);
    await db.delete(schema.partner_documents);
    await db.delete(schema.implementing_partners);
    await db.delete(schema.stakeholders);
    await db.delete(schema.beneficiaries);
    await db.delete(schema.project_team_members);
    await db.delete(schema.project_risks);
    await db.delete(schema.project_expenses);
    await db.delete(schema.project_budget_lines);
    await db.delete(schema.project_tasks);
    await db.delete(schema.project_kpis);
    await db.delete(schema.projects);
    await db.delete(schema.bousala_tasks);
    await db.delete(schema.bousala_goal_projects);
    await db.delete(schema.bousala_kpis);
    await db.delete(schema.bousala_goals);
    await db.delete(schema.grc_screening_alerts);
    await db.delete(schema.grc_screening_entities);
    await db.delete(schema.grc_compliance_assessments);
    await db.delete(schema.grc_compliance_requirements);
    await db.delete(schema.grc_risks);
    await db.delete(schema.grc_decisions);
    await db.delete(schema.grc_policies);
    await db.delete(schema.sharia_activities);
    await db.delete(schema.sharia_exceptions);
    await db.delete(schema.sharia_zakat_policy_rules);
    await db.delete(schema.sharia_zakat_reviews);
    await db.delete(schema.sharia_reviews);
    await db.delete(schema.sharia_fatwas);
    await db.delete(schema.audit_log);
    await db.delete(schema.modules);
    await db.delete(schema.memberships);
    await db.delete(schema.platform_admins);
    await db.delete(schema.organizations);
    console.log('All tables truncated.');
}

async function seedFinancials(orgId: string, requestedBy: string, institutionalDonorIds: Record<string, string>) {
    const now = new Date();

    const fundRows = await db.insert(schema.funds).values([
        {
            org_id: orgId,
            name_en: 'General Operating Fund',
            name_ar: 'صندوق التشغيل العام',
            type: 'unrestricted',
            balance: '187500',
            currency: 'USD',
            start_date: new Date('2024-01-01'),
            total_received: '425000',
            total_spent: '215000',
            total_committed: '22500',
        },
        {
            org_id: orgId,
            name_en: 'Education Fund',
            name_ar: 'صندوق التعليم',
            type: 'temporarily_restricted',
            balance: '92300',
            currency: 'USD',
            donor_restriction: 'Must be used for education programs',
            start_date: new Date('2024-01-01'),
            total_received: '185000',
            total_spent: '78700',
            total_committed: '14000',
        },
        {
            org_id: orgId,
            name_en: 'Emergency Relief Fund',
            name_ar: 'صندوق الإغاثة الطارئة',
            type: 'temporarily_restricted',
            balance: '15450',
            currency: 'USD',
            donor_restriction: 'Restricted to emergency relief only',
            start_date: new Date('2024-01-01'),
            total_received: '35000',
            total_spent: '18550',
            total_committed: '1000',
        },
        {
            org_id: orgId,
            name_en: 'Zakat Distribution Fund',
            name_ar: 'صندوق توزيع الزكاة',
            type: 'zakat',
            balance: '112000',
            currency: 'USD',
            donor_restriction: 'Zakat funds only',
            start_date: new Date('2024-01-01'),
            total_received: '250000',
            total_spent: '138000',
            total_committed: '22000',
        },
    ]).returning();
    const generalFund = fundRows[0];
    const educationFund = fundRows[1];
    const emergencyFund = fundRows[2];

    const transactionRows = await db.insert(schema.financial_transactions).values([
        {
            org_id: orgId,
            date: new Date('2024-12-15'),
            description_en: 'Monthly donation from Aisha Al-Farsi',
            description_ar: 'تبرع شهري من عائشة الفارسي',
            amount: '1500',
            currency: 'USD',
            direction: 'inflow',
            category: 'donation',
            status: 'posted',
            reference: 'DON-2024-0042',
            related_entity_id: 'DN-001',
            related_entity_type: 'donor',
            related_entity_name: 'Aisha Al-Farsi',
            fund_id: educationFund.id,
            posted_by: 'System',
            posted_date: new Date('2024-12-15'),
        },
        {
            org_id: orgId,
            date: new Date('2024-12-14'),
            description_en: 'Construction materials for Albania IC',
            description_ar: 'مواد بناء لمركز ألبانيا الإسلامي',
            amount: '12500',
            currency: 'USD',
            direction: 'outflow',
            category: 'project_expense',
            status: 'posted',
            reference: 'EXP-2024-0118',
            related_entity_id: 'PROJ-2024-004',
            related_entity_type: 'project',
            related_entity_name: 'Albania Islamic Center',
            fund_id: generalFund.id,
            approved_by: 'Fatma Kaya',
            approved_date: new Date('2024-12-14'),
            posted_by: 'Ahmed Hassan',
            posted_date: new Date('2024-12-14'),
        },
        {
            org_id: orgId,
            date: new Date('2024-12-12'),
            description_en: 'Qatar Charity grant installment Q4',
            description_ar: 'قسط منحة قطر الخيرية الربع الرابع',
            amount: '28000',
            currency: 'USD',
            direction: 'inflow',
            category: 'grant_income',
            status: 'posted',
            reference: 'GRT-2024-0012',
            related_entity_id: 'QA-001',
            related_entity_type: 'institutional_donor',
            related_entity_name: 'Qatar Charity',
            fund_id: educationFund.id,
            posted_by: 'System',
            posted_date: new Date('2024-12-12'),
        },
        {
            org_id: orgId,
            date: new Date('2024-12-11'),
            description_en: 'Monthly stipend for Yusuf Al-Ahmad',
            description_ar: 'راتب شهري ليوسف الأحمد',
            amount: '250',
            currency: 'USD',
            direction: 'outflow',
            category: 'disbursement',
            status: 'posted',
            reference: 'DIS-2024-0067',
            related_entity_id: 'BEN-001',
            related_entity_type: 'beneficiary',
            related_entity_name: 'Yusuf Al-Ahmad',
            fund_id: educationFund.id,
            approved_by: 'Fatma Kaya',
            approved_date: new Date('2024-12-10'),
            posted_by: 'Ahmed Hassan',
            posted_date: new Date('2024-12-11'),
        },
        {
            org_id: orgId,
            date: new Date('2024-12-10'),
            description_en: 'Office rent payment - December',
            description_ar: 'دفع إيجار المكتب - ديسمبر',
            amount: '3200',
            currency: 'USD',
            direction: 'outflow',
            category: 'operational_expense',
            status: 'posted',
            reference: 'EXP-2024-0117',
            approved_by: 'Ahmed Hassan',
            approved_date: new Date('2024-12-09'),
            posted_by: 'System',
            posted_date: new Date('2024-12-10'),
        },
    ]).returning();

    await db.insert(schema.donation_records).values([
        {
            org_id: orgId,
            donor_id: 'DN-001',
            donor_name_en: 'Aisha Al-Farsi',
            donor_name_ar: 'عائشة الفارسي',
            donor_type: 'individual',
            date: new Date('2024-12-15'),
            amount: '1500',
            currency: 'USD',
            method: 'bank_transfer',
            designation: 'Education Fund',
            fund_id: educationFund.id,
            receipt_status: 'generated',
            receipt_number: 'RCT-2024-0042',
            is_recurring: true,
            recurring_frequency: 'monthly',
            transaction_id: transactionRows[0].id,
        },
        {
            org_id: orgId,
            donor_id: institutionalDonorIds.qatar_charity,
            donor_name_en: 'Qatar Charity',
            donor_name_ar: 'قطر الخيرية',
            donor_type: 'institutional',
            date: new Date('2024-12-12'),
            amount: '28000',
            currency: 'USD',
            method: 'bank_transfer',
            designation: 'Albania Islamic Center',
            fund_id: educationFund.id,
            receipt_status: 'sent',
            receipt_number: 'RCT-INST-2024-001',
            is_recurring: false,
            transaction_id: transactionRows[2].id,
        },
    ]);

    const [pledge] = await db.insert(schema.financial_pledges).values({
        org_id: orgId,
        donor_id: 'DN-001',
        donor_name_en: 'Aisha Al-Farsi',
        donor_name_ar: 'عائشة الفارسي',
        donor_type: 'individual',
        pledge_date: new Date('2024-01-15'),
        total_amount: '24000',
        paid_amount: '18000',
        currency: 'USD',
        status: 'active',
        designation: 'Education Fund',
        fund_id: educationFund.id,
        start_date: new Date('2024-01-15'),
        end_date: new Date('2025-12-15'),
        frequency: 'monthly',
    }).returning();

    await db.insert(schema.pledge_installments).values([
        {
            org_id: orgId,
            pledge_id: pledge.id,
            due_date: new Date('2024-10-15'),
            amount: '1500',
            paid_amount: '1500',
            paid_date: new Date('2024-10-15'),
            status: 'paid',
        },
        {
            org_id: orgId,
            pledge_id: pledge.id,
            due_date: new Date('2024-11-15'),
            amount: '1500',
            paid_amount: '1500',
            paid_date: new Date('2024-11-15'),
            status: 'paid',
        },
        {
            org_id: orgId,
            pledge_id: pledge.id,
            due_date: new Date('2024-12-15'),
            amount: '1500',
            paid_amount: '1500',
            paid_date: new Date('2024-12-15'),
            status: 'paid',
            transaction_id: transactionRows[0].id,
        },
        {
            org_id: orgId,
            pledge_id: pledge.id,
            due_date: new Date('2025-01-15'),
            amount: '1500',
            paid_amount: '0',
            status: 'pending',
        },
    ]);

    const [grant] = await db.insert(schema.grants).values({
        org_id: orgId,
        grantor_id: institutionalDonorIds.qatar_charity,
        grantor_name: 'Qatar Charity',
        grant_number: 'QC-ALB-2024-001',
        title_en: 'Albania Islamic Center Construction Grant',
        title_ar: 'منحة بناء مركز ألبانيا الإسلامي',
        total_amount: '85000',
        received_amount: '56000',
        currency: 'USD',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2025-06-30'),
        status: 'active',
        fund_id: educationFund.id,
        project_id: 'PROJ-2024-004',
        project_name_en: 'Albania Islamic Center',
        project_name_ar: 'مركز ألبانيا الإسلامي',
        reporting_requirements: 'Quarterly progress reports due within 30 days of quarter end',
    }).returning();

    await db.insert(schema.grant_installments).values([
        {
            org_id: orgId,
            grant_id: grant.id,
            due_date: new Date('2024-03-15'),
            amount: '28000',
            received_amount: '28000',
            received_date: new Date('2024-03-18'),
            status: 'received',
        },
        {
            org_id: orgId,
            grant_id: grant.id,
            due_date: new Date('2024-09-15'),
            amount: '28000',
            received_amount: '28000',
            received_date: new Date('2024-12-12'),
            status: 'received',
        },
        {
            org_id: orgId,
            grant_id: grant.id,
            due_date: new Date('2025-03-15'),
            amount: '29000',
            received_amount: '0',
            status: 'pending',
        },
    ]);

    const beneficiaryRows = await db
        .select({ id: schema.beneficiaries.id, name_en: schema.beneficiaries.name_en, name_ar: schema.beneficiaries.name_ar })
        .from(schema.beneficiaries)
        .where(eq(schema.beneficiaries.org_id, orgId));
    const beneficiaryIdByName = Object.fromEntries(beneficiaryRows.map((row) => [row.name_en, row.id]));
    const beneficiaryNameByEn = Object.fromEntries(beneficiaryRows.map((row) => [row.name_en, row.name_ar || '']));

    const [completedDisbursement, pendingDisbursement] = await db.insert(schema.disbursements).values([
        {
            org_id: orgId,
            beneficiary_id: beneficiaryIdByName['Yusuf Al-Ahmad'] ?? '',
            beneficiary_name_en: 'Yusuf Al-Ahmad',
            beneficiary_name_ar: 'يوسف الأحمد',
            type: 'sponsorship_stipend',
            amount: '250',
            currency: 'USD',
            status: 'completed',
            scheduled_date: new Date('2024-12-01'),
            processed_date: new Date('2024-12-11'),
            fund_id: educationFund.id,
            method: 'bank_transfer',
            approved_by: 'Fatma Kaya',
            transaction_id: transactionRows[3].id,
        },
        {
            org_id: orgId,
            beneficiary_id: beneficiaryIdByName['Ahmad Hussein'] ?? '',
            beneficiary_name_en: 'Ahmad Hussein',
            beneficiary_name_ar: beneficiaryNameByEn['Ahmad Hussein'] || 'أحمد حسين',
            type: 'emergency_relief',
            amount: '800',
            currency: 'USD',
            status: 'pending_approval',
            scheduled_date: new Date('2024-12-20'),
            fund_id: emergencyFund.id,
            method: 'mobile_money',
        },
    ]).returning();

    await db.insert(schema.approval_items).values([
        {
            org_id: orgId,
            type: 'disbursement',
            title: 'Emergency relief disbursement for Ahmad Hussein',
            description: 'Approve mobile money emergency disbursement',
            amount: '800',
            currency: 'USD',
            requested_by: requestedBy,
            requested_date: now,
            priority: 'high',
            status: 'pending',
            related_entity_id: pendingDisbursement.id,
            related_entity_name: pendingDisbursement.beneficiary_name_en,
            current_step: 1,
            total_steps: 1,
            workflow_id: 'disbursement_approval',
            due_date: new Date('2024-12-20'),
            custom_fields: {
                beneficiary_id: pendingDisbursement.beneficiary_id,
                beneficiary_name_en: pendingDisbursement.beneficiary_name_en,
                beneficiary_name_ar: pendingDisbursement.beneficiary_name_ar,
                disbursement_type: pendingDisbursement.type,
            },
        },
        {
            org_id: orgId,
            type: 'expense',
            title: 'NGO conference registration and travel',
            description: 'Annual NGO conference in Geneva for two staff members',
            amount: '3500',
            currency: 'USD',
            requested_by: requestedBy,
            requested_date: new Date('2024-12-16'),
            priority: 'medium',
            status: 'pending',
            current_step: 1,
            total_steps: 2,
            workflow_id: 'expense_claim',
            due_date: new Date('2024-12-20'),
        },
    ]);

    const [budget] = await db.insert(schema.project_budgets).values({
        org_id: orgId,
        project_id: 'PROJ-2024-004',
        project_name_en: 'Albania Islamic Center',
        project_name_ar: 'مركز ألبانيا الإسلامي',
        fiscal_year: '2024-2025',
        total_planned: '55250',
        total_actual: '17100',
        total_committed: '8500',
        currency: 'USD',
        status: 'active',
    }).returning();

    await db.insert(schema.budget_lines).values([
        {
            org_id: orgId,
            budget_id: budget.id,
            account_code: '6210',
            account_name_en: 'Construction & Materials',
            account_name_ar: 'البناء والمواد',
            category: 'Construction',
            planned: '30000',
            actual: '12500',
            committed: '5000',
        },
        {
            org_id: orgId,
            budget_id: budget.id,
            account_code: '6220',
            account_name_en: 'Travel & Field Visits',
            account_name_ar: 'السفر والزيارات الميدانية',
            category: 'Travel',
            planned: '8000',
            actual: '2300',
            committed: '1500',
        },
    ]);

    await db.insert(schema.financial_reports).values([
        {
            org_id: orgId,
            type: 'income_statement',
            name_en: 'Income Statement',
            name_ar: 'قائمة الدخل',
            description_en: 'Revenue and expenses summary for the fiscal period',
            description_ar: 'ملخص الإيرادات والمصروفات للفترة المالية',
            last_generated: new Date('2024-12-01'),
            format: 'pdf',
            period: 'Q4 2024',
            file_url: '/reports/income-statement-q4-2024.pdf',
        },
        {
            org_id: orgId,
            type: 'cash_flow',
            name_en: 'Cash Flow Statement',
            name_ar: 'قائمة التدفقات النقدية',
            description_en: 'Cash inflows and outflows from operations, investing, and financing',
            description_ar: 'التدفقات النقدية الداخلة والخارجة من العمليات والاستثمار والتمويل',
            format: 'xlsx',
            period: 'Nov 2024',
        },
    ]);

    await db.insert(schema.financial_alerts).values([
        {
            org_id: orgId,
            type: 'danger',
            message_en: 'Overdue pledge from Fatma Yilmaz — $6,000 outstanding since September',
            message_ar: 'تعهد متأخر من فاطمة يلماز — 6,000 دولار مستحقة منذ سبتمبر',
            date: new Date('2024-12-15'),
            related_entity_id: pledge.id,
            action_required: true,
        },
        {
            org_id: orgId,
            type: 'warning',
            message_en: 'Emergency Relief Fund balance below $20,000 threshold',
            message_ar: 'رصيد صندوق الإغاثة الطارئة أقل من حد 20,000 دولار',
            date: new Date('2024-12-12'),
            related_entity_id: emergencyFund.id,
            action_required: false,
        },
    ]);

    console.log(`Seeded financials data (${transactionRows.length} transactions, 3 funds, 1 pledge, 1 grant, 2 disbursements).`);
    void completedDisbursement;
}

async function seed() {
    const userEmail = process.env.SEED_USER_EMAIL;
    if (!userEmail) {
        throw new Error('Set SEED_USER_EMAIL in .env (the email you sign in with)');
    }

    const userId = await lookupUserId(userEmail);
    console.log(`Found user: ${userEmail} → ${userId}`);

    const [org] = await db
        .insert(schema.organizations)
        .values({
            name: SEED_ORG_NAME,
            custom_fields: {
                bousala: {
                    direction: {
                        vision: 'تنمية مجتمعية مستدامة تقوم على التعليم والتمكين والشراكة',
                        mission: 'تقديم برامج نوعية تربط الاحتياج الميداني بالأثر القابل للقياس',
                        general: 'تحسين جودة التنفيذ ورفع كفاءة المتابعة وتعزيز الأثر طويل المدى',
                    },
                },
            },
        })
        .returning();
    console.log(`Created org: ${org.name} (${org.id})`);

    await db.insert(schema.memberships).values({
        org_id: org.id,
        user_id: userId,
        role: 'admin',
        full_name_en: 'System Admin',
        full_name_ar: 'مدير النظام',
        email: userEmail,
        title: 'Administrator',
        department: 'IT',
        status: 'active',
    });
    console.log(`Created membership for ${userEmail} as admin`);

    // Make the seed user a platform admin (super admin for cross-org access).
    await db.insert(schema.platform_admins).values({ user_id: userId }).onConflictDoNothing();
    console.log('Set as platform admin');

    await seedOrgModules(org.id, db);
    console.log('Registered org module catalog');

    console.log('Seeding projects...');
    const projectLegacyMap = await seedProjects(db, org.id);

    console.log('Seeding Bousala...');
    await seedBousala(db, org.id, projectLegacyMap);

    const seededDonorIds: string[] = [];
    for (const donor of SEED_DONORS) {
        const [inserted] = await db
            .insert(schema.individual_donors)
            .values({ org_id: org.id, ...donor })
            .returning();
        seededDonorIds.push(inserted.id);

        const donationCount = Math.floor(Math.random() * 5) + 2;
        await db.insert(schema.donations).values(
            randomDonations(inserted.id, org.id, donationCount),
        );
        await db.insert(schema.donor_tasks).values({
            org_id: org.id,
            donor_id: inserted.id,
            text: donor.status === 'Lapsed' ? 'Schedule re-engagement call' : 'Send latest impact update',
            type: donor.status === 'Lapsed' ? 'Call' : 'Email',
            assigned_to: donor.assigned_manager,
            due_date: new Date(Date.now() + (donor.status === 'Lapsed' ? 3 : 10) * 86400000),
            completed: false,
        });
        await db.insert(schema.donor_interactions).values({
            org_id: org.id,
            donor_id: inserted.id,
            interaction_type: 'email',
            occurred_at: new Date(Date.now() - Math.floor(Math.random() * 45 + 5) * 86400000),
            subject: 'Impact update sent',
            status: 'logged',
            notes: `Latest stewardship touchpoint for ${donor.full_name_en}.`,
        });
        console.log(`  Donor: ${inserted.full_name_en} + ${donationCount} donations`);
    }

    const institutionalDonorIdByKey: Record<string, string> = {};
    for (const donor of SEED_INSTITUTIONAL_DONORS) {
        const { key, ...values } = donor;
        const [inserted] = await db
            .insert(schema.institutional_donors)
            .values({ org_id: org.id, ...values })
            .returning();
        institutionalDonorIdByKey[key] = inserted.id;
        console.log(`  Institutional Donor: ${inserted.name_en}`);
    }

    const resolveSponsorshipDonorId = (raw: unknown): string | undefined => {
        if (raw == null) return undefined;
        if (raw === 'DN-001') return seededDonorIds[0];
        const asNumber = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
        if (Number.isInteger(asNumber) && asNumber > 0 && asNumber <= seededDonorIds.length) {
            return seededDonorIds[asNumber - 1];
        }
        return undefined;
    };

    const patchBeneficiaryProfile = (profile: Record<string, unknown>) => {
        const sponsorship = profile.sponsorship as { donorId?: unknown } | undefined;
        if (!sponsorship?.donorId) return profile;
        const resolvedDonorId = resolveSponsorshipDonorId(sponsorship.donorId);
        if (!resolvedDonorId) return profile;
        return {
            ...profile,
            sponsorship: { ...sponsorship, donorId: resolvedDonorId },
        };
    };

    for (const beneficiary of SEED_BENEFICIARIES) {
        const profile = patchBeneficiaryProfile(beneficiary.profile as Record<string, unknown>);
        const projectId = resolveProjectId(beneficiary.project_id, projectLegacyMap);
        const [inserted] = await db
            .insert(schema.beneficiaries)
            .values({ org_id: org.id, ...beneficiary, project_id: projectId, profile })
            .returning();
        console.log(`  Beneficiary: ${inserted.name_en} (${inserted.beneficiary_type})`);
    }

    console.log('Seeding stakeholders...');
    for (const stakeholder of SEED_STAKEHOLDERS) {
        const [inserted] = await db
            .insert(schema.stakeholders)
            .values({ org_id: org.id, ...stakeholder })
            .returning();
        const label = inserted.name_ar?.trim() || inserted.name_en;
        console.log(`  Stakeholder: ${label} (${inserted.type})`);
    }

    console.log('Seeding implementing partners...');
    for (const partner of SEED_IMPLEMENTING_PARTNERS) {
        const [inserted] = await db
            .insert(schema.implementing_partners)
            .values({ org_id: org.id, ...partner })
            .returning();
        const label = inserted.name_ar?.trim() || inserted.name_en;
        console.log(`  Implementing Partner: ${label} (${inserted.sector})`);
    }

    await seedFinancials(org.id, userEmail, institutionalDonorIdByKey);

    console.log('Seeding sharia compliance...');
    await seedShariaCompliance(db, org.id);
    console.log('  Sharia compliance data seeded');

    // ── Sample staff (demo memberships with different roles) ────────────
    const sampleStaff = [
        { full_name_en: 'Fatma Kaya', full_name_ar: 'فاطمة كايا', role: 'manager', title: 'Program Manager', department: 'Programs', email: 'fatma@example.com' },
        { full_name_en: 'Ahmed Hassan', full_name_ar: 'أحمد حسن', role: 'accountant', title: 'Finance Officer', department: 'Finance', email: 'ahmed@example.com' },
        { full_name_en: 'Sara Yilmaz', full_name_ar: 'سارة يلماز', role: 'staff', title: 'Field Coordinator', department: 'Operations', email: 'sara@example.com' },
        { full_name_en: 'Khalid Noor', full_name_ar: 'خالد نور', role: 'viewer', title: 'Board Observer', department: 'Board', email: 'khalid@example.com' },
    ];
    for (const s of sampleStaff) {
        // Look up or skip — these are display-only staff rows with placeholder user_ids.
        await db.insert(schema.memberships).values({
            org_id: org.id,
            user_id: '00000000-0000-0000-0000-000000000000',
            ...s,
            status: 'active',
            custom_fields: {},
        });
    }
    console.log(`Added ${sampleStaff.length} sample staff members`);

    // ── Second organization (so the platform console shows > 1 org) ────
    const [org2] = await db.insert(schema.organizations).values({ name: 'Al-Khair Foundation', custom_fields: {} }).returning();
    await db.insert(schema.memberships).values({
        org_id: org2.id,
        user_id: userId,
        role: 'admin',
        full_name_en: 'System Admin',
        full_name_ar: 'مدير النظام',
        email: userEmail,
        title: 'Administrator',
        department: 'IT',
        status: 'active',
    });
    await seedOrgModules(org2.id, db);
    console.log(`Created second org: ${org2.name}`);

    console.log('\nSeed complete.');
}

const isReset = process.argv.includes('--reset');

(async () => {
    try {
        if (isReset) await reset();
        await seed();
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
