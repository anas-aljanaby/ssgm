import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, sql } from 'drizzle-orm';
import * as schema from './schema';
import { SEED_BENEFICIARIES } from './beneficiarySeed';
import { resolveProjectId, seedProjects } from './projectSeed';
import { seedBousala } from './bousalaSeed';
import { SEED_STAKEHOLDERS } from './stakeholderSeed';
import { supabaseAdmin } from '../lib/supabaseAdmin';

const TEST_ORG_NAME = 'Test';
const ADMIN_EMAIL = 'mostafa.almosel@gmail.com';
const STAFF_PASSWORD = 'DemoPass123!';

const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

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
        full_name_en: 'Fatima Al-Rashid',
        full_name_ar: 'فاطمة الراشد',
        email: 'fatima.r@example.com',
        phone: '+966 55 987 6543',
        status: 'Active',
        tier: 'Platinum',
        country: 'Saudi Arabia',
        tags: ['Orphan Care', 'Ramadan Campaign'],
        assigned_manager: 'Fatma Kaya',
        donor_since: new Date('2019-06-01'),
        donor_category: 'Recurring',
        total_donations: '85000.00',
        donations_count: 30,
        avg_gift: '2833.33',
        primary_program_interest: 'Orphan Care',
    },
    {
        full_name_en: 'Mohammed Al-Sayed',
        full_name_ar: 'محمد السيد',
        email: 'mohammed.s@example.com',
        phone: '+20 100 555 7890',
        status: 'Active',
        tier: 'Major Donor',
        country: 'Egypt',
        tags: ['Orphan Care', 'Education'],
        assigned_manager: 'Ahmed Hassan',
        donor_since: new Date('2018-01-05'),
        donor_category: 'Hero',
        total_donations: '250000.00',
        donations_count: 45,
        avg_gift: '5555.56',
        primary_program_interest: 'Education',
    },
];

const SEED_STAFF = [
    {
        full_name_en: 'Fatma Kaya',
        full_name_ar: 'فاطمة كايا',
        role: 'manager',
        title: 'Program Manager',
        department: 'Programs',
        email: 'fatma.kaya.programs@test.ssgm.app',
        phone: '+966 50 111 2233',
    },
    {
        full_name_en: 'Ahmed Hassan',
        full_name_ar: 'أحمد حسن',
        role: 'accountant',
        title: 'Finance Officer',
        department: 'Finance',
        email: 'ahmed.hassan.finance@test.ssgm.app',
        phone: '+966 50 222 3344',
    },
    {
        full_name_en: 'Sara Yilmaz',
        full_name_ar: 'سارة يلماز',
        role: 'staff',
        title: 'Field Coordinator',
        department: 'Operations',
        email: 'sara.yilmaz.operations@test.ssgm.app',
        phone: '+966 50 333 4455',
    },
    {
        full_name_en: 'Khalid Noor',
        full_name_ar: 'خالد نور',
        role: 'viewer',
        title: 'Board Observer',
        department: 'Board',
        email: 'khalid.noor.board@test.ssgm.app',
        phone: '+966 50 444 5566',
    },
] as const;

const SAMPLE_PROGRAMS = ['Education', 'Healthcare', 'Orphan Care', 'Water Projects'];

async function lookupUserId(email: string): Promise<string | null> {
    const rows = await client`SELECT id FROM auth.users WHERE email = ${email} LIMIT 1`;
    return rows.length ? rows[0].id : null;
}

async function countForOrg(table: keyof typeof schema, orgId: string): Promise<number> {
    const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema[table] as typeof schema.individual_donors)
        .where(eq((schema[table] as typeof schema.individual_donors).org_id, orgId));
    return rows[0]?.count ?? 0;
}

async function ensureAuthUser(email: string, password: string, name: string): Promise<string> {
    const existing = await lookupUserId(email);
    if (existing) return existing;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
    });
    if (error || !data?.user) {
        throw new Error(`Could not create auth user ${email}: ${error?.message ?? 'unknown error'}`);
    }
    return data.user.id;
}

async function seedStaff(orgId: string) {
    console.log('Seeding staff...');
    for (const member of SEED_STAFF) {
        const existing = await db
            .select({ id: schema.memberships.id })
            .from(schema.memberships)
            .where(and(eq(schema.memberships.org_id, orgId), eq(schema.memberships.email, member.email)))
            .limit(1);

        if (existing.length > 0) {
            console.log(`  Skip (exists): ${member.full_name_en}`);
            continue;
        }

        const userId = await ensureAuthUser(member.email, STAFF_PASSWORD, member.full_name_en);
        await db.insert(schema.memberships).values({
            org_id: orgId,
            user_id: userId,
            role: member.role,
            email: member.email,
            full_name_en: member.full_name_en,
            full_name_ar: member.full_name_ar,
            title: member.title,
            department: member.department,
            phone: member.phone,
            status: 'active',
            custom_fields: { demo_password: STAFF_PASSWORD },
        });
        console.log(`  Staff: ${member.full_name_en} (${member.role})`);
    }
}

async function seedDonors(orgId: string) {
    if ((await countForOrg('individual_donors', orgId)) > 0) {
        console.log('Donors already seeded — skipping.');
        return;
    }

    console.log('Seeding donors...');
    for (const donor of SEED_DONORS) {
        const [inserted] = await db
            .insert(schema.individual_donors)
            .values({ org_id: orgId, ...donor })
            .returning();

        const donationCount = 3;
        const donations = Array.from({ length: donationCount }, (_, i) => ({
            org_id: orgId,
            donor_id: inserted.id,
            amount: String((Math.floor(Math.random() * 3000) + 200).toFixed(2)),
            date: new Date(Date.now() - (i + 1) * 45 * 86400000),
            program: SAMPLE_PROGRAMS[i % SAMPLE_PROGRAMS.length],
        }));
        await db.insert(schema.donations).values(donations);
        console.log(`  Donor: ${inserted.full_name_en}`);
    }
}

async function seedBeneficiaries(orgId: string, projectLegacyMap: Record<string, string>) {
    if ((await countForOrg('beneficiaries', orgId)) > 0) {
        console.log('Beneficiaries already seeded — skipping.');
        return;
    }

    console.log('Seeding beneficiaries...');
    for (const beneficiary of SEED_BENEFICIARIES.slice(0, 3)) {
        const projectId = resolveProjectId(beneficiary.project_id, projectLegacyMap);
        const [inserted] = await db
            .insert(schema.beneficiaries)
            .values({ org_id: orgId, ...beneficiary, project_id: projectId })
            .returning();
        console.log(`  Beneficiary: ${inserted.name_en}`);
    }
}

async function seedStakeholders(orgId: string) {
    if ((await countForOrg('stakeholders', orgId)) > 0) {
        console.log('Stakeholders already seeded — skipping.');
        return;
    }

    console.log('Seeding stakeholders...');
    for (const stakeholder of SEED_STAKEHOLDERS.slice(0, 2)) {
        const [inserted] = await db
            .insert(schema.stakeholders)
            .values({ org_id: orgId, ...stakeholder })
            .returning();
        const label = inserted.name_ar?.trim() || inserted.name_en;
        console.log(`  Stakeholder: ${label}`);
    }
}

async function seedFinancials(orgId: string) {
    if ((await countForOrg('funds', orgId)) > 0) {
        console.log('Financials already seeded — skipping.');
        return;
    }

    console.log('Seeding financials...');
    const [generalFund] = await db.insert(schema.funds).values({
        org_id: orgId,
        name_en: 'General Operating Fund',
        name_ar: 'صندوق التشغيل العام',
        type: 'unrestricted',
        balance: '125000',
        currency: 'USD',
        start_date: new Date('2024-01-01'),
        total_received: '250000',
        total_spent: '125000',
        total_committed: '15000',
    }).returning();

    await db.insert(schema.financial_transactions).values([
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
            reference: 'DON-TEST-0042',
            fund_id: generalFund.id,
            posted_by: 'Ahmed Hassan',
            posted_date: new Date('2024-12-15'),
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
            reference: 'EXP-TEST-0117',
            fund_id: generalFund.id,
            posted_by: 'Ahmed Hassan',
            posted_date: new Date('2024-12-10'),
        },
    ]);
    console.log('  Fund + 2 transactions');
}

async function seed() {
    const [org] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.name, TEST_ORG_NAME))
        .limit(1);

    if (!org) {
        throw new Error(`Organization "${TEST_ORG_NAME}" not found. Create it first.`);
    }

    const adminUserId = await lookupUserId(ADMIN_EMAIL);
    if (!adminUserId) {
        throw new Error(`No Supabase user found for ${ADMIN_EMAIL}`);
    }

    console.log(`Seeding org: ${org.name} (${org.id})`);
    console.log(`Admin: ${ADMIN_EMAIL}`);

    await db
        .update(schema.memberships)
        .set({
            full_name_en: 'Mostafa Al-Mosel',
            full_name_ar: 'مصطفى الموسل',
            title: 'Executive Director',
            department: 'Executive',
            phone: '+966 50 900 1122',
            status: 'active',
        })
        .where(and(eq(schema.memberships.org_id, org.id), eq(schema.memberships.user_id, adminUserId)));
    console.log('Updated admin profile');

    await seedStaff(org.id);

    let projectLegacyMap: Record<string, string> = {};
    if ((await countForOrg('projects', org.id)) === 0) {
        console.log('Seeding projects...');
        projectLegacyMap = await seedProjects(db, org.id);
        console.log('Seeding Bousala...');
        await seedBousala(db, org.id, projectLegacyMap);
    } else {
        console.log('Projects already seeded — skipping project/Bousala seed.');
        const projects = await db
            .select({ id: schema.projects.id, name_en: schema.projects.name_en })
            .from(schema.projects)
            .where(eq(schema.projects.org_id, org.id));
        for (const p of projects) {
            if (p.name_en.includes('Education')) projectLegacyMap['proj-educ'] = p.id;
            if (p.name_en.includes('Leadership')) projectLegacyMap['proj-lead'] = p.id;
        }
    }

    await seedDonors(org.id);
    await seedBeneficiaries(org.id, projectLegacyMap);
    await seedStakeholders(org.id);
    await seedFinancials(org.id);

    const staffCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.memberships)
        .where(eq(schema.memberships.org_id, org.id));

    console.log(`\nSeed complete for "${TEST_ORG_NAME}" (${staffCount[0]?.count ?? 0} staff members).`);
    console.log(`Log in as ${ADMIN_EMAIL} / Pass.admin123`);
    console.log(`Demo staff password: ${STAFF_PASSWORD}`);
}

(async () => {
    try {
        await seed();
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
