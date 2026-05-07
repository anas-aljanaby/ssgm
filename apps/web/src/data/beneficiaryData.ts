import type { BeneficiaryData, Beneficiary, NeedsAssessment } from '../types';

// =================================================================
// Shared Assessments
// =================================================================
const MOCK_ASSESSMENTS: NeedsAssessment[] = [
    {
        id: 'asm-001',
        date: '2024-07-10T10:00:00Z',
        assessor: 'Fatma Kaya',
        povertyScore: 3,
        foodSecurity: 'at_risk',
        housingStatus: 'stable',
        educationalNeeds: 'Needs support for university textbooks and a laptop for studies.',
        suggestedPrograms: ['PROGRAM_EDU_SUPPORT', 'PROGRAM_TECH_GRANT'],
    },
    {
        id: 'asm-002',
        date: '2024-06-20T14:00:00Z',
        assessor: 'System',
        povertyScore: 4,
        foodSecurity: 'insecure',
        housingStatus: 'unstable',
        medicalNeeds: 'Requires regular check-ups for two children.',
        suggestedPrograms: ['PROGRAM_FOOD_AID', 'PROGRAM_HOUSING_SUPPORT', 'PROGRAM_HEALTH_CARE'],
    },
    {
        id: 'asm-003',
        date: '2024-05-15T09:00:00Z',
        assessor: 'Ali Veli',
        povertyScore: 2,
        foodSecurity: 'secure',
        housingStatus: 'stable',
        educationalNeeds: 'None reported.',
        suggestedPrograms: [],
    },
    {
        id: 'asm-004',
        date: '2024-04-10T11:00:00Z',
        assessor: 'John Doe',
        povertyScore: 5,
        foodSecurity: 'insecure',
        housingStatus: 'unstable',
        medicalNeeds: 'Chronic illness support',
        suggestedPrograms: ['PROGRAM_FOOD_AID', 'PROGRAM_HEALTH_CARE'],
    },
];

// =================================================================
// Beneficiaries
// =================================================================
const beneficiaries: Beneficiary[] = [
    // --- Students ---
    {
        id: 'ben-001',
        name: { en: 'Yusuf Al-Ahmad', ar: 'يوسف الأحمد' },
        beneficiaryType: 'student',
        photo: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'sponsorship',
        country: 'Turkey',
        projectId: 'proj-educ',
        profile: {
            type: 'student',
            dob: '2004-08-15',
            gender: 'Male',
            contact: { email: 'yusuf.a@example.com', phone: '+90 555 123 4567', address: 'Istanbul, Turkey' },
            academicInfo: {
                level: { en: 'University - 2nd Year', ar: 'جامعة - سنة ثانية' },
                field: 'Computer Engineering',
                university: 'Istanbul University',
                gpa: 3.4,
            },
            sponsorship: { donorId: 2, startDate: '2023-09-01', monthlyAmount: 250, currency: 'USD' },
        },
        aidLog: [
            { id: 'aid-b1-1', type: 'financial', date: '2024-07-01T00:00:00Z', description: { en: 'Monthly Stipend', ar: 'مخصص شهري' }, value: 250, unit: 'USD', status: 'Delivered', relatedProjectId: 'proj-educ' },
            { id: 'aid-b1-2', type: 'in-kind', date: '2024-06-15T00:00:00Z', description: { en: 'Laptop for Studies', ar: 'جهاز كمبيوتر محمول للدراسة' }, value: 1, unit: 'pcs', status: 'Delivered', inventoryItemId: 'ELEC-LAP-01' },
            { id: 'aid-b1-3', type: 'service', date: '2024-05-20T00:00:00Z', description: { en: 'Leadership Workshop Attendance', ar: 'حضور ورشة عمل القيادة' }, value: 8, unit: 'hours', status: 'Delivered' },
            { id: 'aid-b1-4', type: 'financial', date: '2024-08-01T00:00:00Z', description: { en: 'August Stipend', ar: 'مخصص أغسطس' }, value: 250, unit: 'USD', status: 'Scheduled' },
        ],
        assessments: [MOCK_ASSESSMENTS[0]],
        milestones: [
            { id: 'm1', title: { en: 'Enrolled in University', ar: 'الالتحاق بالجامعة' }, status: 'achieved', date: '2023-09-01' },
            { id: 'm2', title: { en: 'Completed First Year', ar: 'إكمال السنة الأولى' }, status: 'achieved', date: '2024-06-15' },
            { id: 'm3', title: { en: 'Internship', ar: 'تدريب عملي' }, status: 'in-progress', date: '2024-09-01' },
            { id: 'm4', title: { en: 'Graduation', ar: 'التخرج' }, status: 'pending' },
        ],
        documents: [],
    },
    {
        id: 'ben-002',
        name: { en: 'Fatima Al-Jamil', ar: 'فاطمة الجميل' },
        beneficiaryType: 'student',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'direct-support',
        country: 'Lebanon',
        projectId: 'proj-educ',
        profile: {
            type: 'student',
            dob: '2007-03-22',
            gender: 'Female',
            contact: { email: 'fatima.j@example.com', phone: '+961 3 987 654', address: 'Beirut, Lebanon' },
            academicInfo: {
                level: { en: 'High School - 11th Grade', ar: 'ثانوية - صف حادي عشر' },
                field: 'Science Stream',
                university: 'Beirut International School',
                gpa: 3.8,
            },
            sponsorship: { startDate: '2024-01-15', monthlyAmount: 100, currency: 'USD' },
        },
        aidLog: [
            { id: 'aid-b2-1', type: 'financial', date: '2024-07-05T00:00:00Z', description: { en: 'School Fees', ar: 'رسوم مدرسية' }, value: 100, unit: 'USD', status: 'Delivered', relatedProjectId: 'proj-educ' },
        ],
        assessments: [MOCK_ASSESSMENTS[2]],
        milestones: [],
        documents: [],
    },
    {
        id: 'ben-003',
        name: { en: 'Ahmad Hussein', ar: 'أحمد حسين' },
        beneficiaryType: 'student',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'direct-support',
        country: 'Turkey',
        projectId: 'proj-lead',
        profile: {
            type: 'student',
            dob: '2002-11-05',
            gender: 'Male',
            contact: { email: 'ahmad.h@example.com', phone: '+90 555 234 5678', address: 'Ankara, Turkey' },
            academicInfo: {
                level: { en: 'University - 4th Year', ar: 'جامعة - سنة رابعة' },
                field: 'Business Administration',
                university: 'METU',
                gpa: 3.1,
            },
            sponsorship: { startDate: '2024-02-01' },
        },
        aidLog: [],
        assessments: [MOCK_ASSESSMENTS[3]],
        milestones: [],
        documents: [],
    },

    // --- Orphan ---
    {
        id: 'ben-orp-001',
        name: { en: 'Ali Khaled', ar: 'علي خالد' },
        beneficiaryType: 'orphan',
        photo: 'https://images.unsplash.com/photo-1519985359926-d63c467a5ee2?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'sponsorship',
        country: 'Jordan',
        profile: {
            type: 'orphan',
            dob: '2012-05-10',
            gender: 'Male',
            contact: { phone: '+962 7 1234 5678', address: 'Amman, Jordan' },
            guardian: { name: 'Maryam Abdullah', relation: 'Mother', phone: '+962 7 1234 5678' },
            academicInfo: { grade: '6th Grade', school: 'Al-Amal School', attendance: '98%', level: 'Excellent' },
            sponsorship: { donorId: 'DN-001', startDate: '2024-01-01', monthlyAmount: 150, currency: 'USD' },
            familyMembers: [
                { relation: 'Mother', name: 'Maryam Abdullah', age: 38 },
                { relation: 'Brother', name: 'Hassan', age: 9 },
                { relation: 'Sister', name: 'Sara', age: 7 },
            ],
        },
        aidLog: [
            { id: 'aid-o1-1', type: 'financial', date: '2024-07-01T00:00:00Z', description: { en: 'July Sponsorship Payment', ar: 'دفعة كفالة يوليو' }, value: 150, unit: 'USD', status: 'Delivered' },
            { id: 'aid-o1-2', type: 'in-kind', date: '2024-07-10T00:00:00Z', description: { en: 'Eid Clothing', ar: 'ملابس العيد' }, value: 1, unit: 'package', status: 'Delivered', inventoryItemId: 'CL-KID-01' },
            { id: 'aid-o1-3', type: 'service', date: '2024-06-05T00:00:00Z', description: { en: 'Psychological Support Session', ar: 'جلسة دعم نفسي' }, value: 1, unit: 'session', status: 'Delivered' },
            { id: 'aid-o1-4', type: 'financial', date: '2024-08-01T00:00:00Z', description: { en: 'August Sponsorship Payment', ar: 'دفعة كفالة أغسطس' }, value: 150, unit: 'USD', status: 'Scheduled' },
        ],
        assessments: [],
        milestones: [
            { id: 'om1', title: { en: '1st Place in Reading Contest', ar: 'المركز الأول في مسابقة القراءة' }, status: 'achieved', date: '2024-07-22' },
        ],
        documents: [],
    },

    // --- Family ---
    {
        id: 'ben-fam-001',
        name: { en: 'Al-Ahmad Family', ar: 'عائلة الأحمد' },
        beneficiaryType: 'family',
        photo: 'https://images.unsplash.com/photo-1555952494-033f74201b56?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'direct-support',
        country: 'Syria',
        projectId: 'proj-comm',
        profile: {
            type: 'family',
            headOfHousehold: 'Khaled Al-Ahmad',
            memberCount: 5,
            monthlyIncome: '150 USD',
            housingType: 'Rental',
            contact: { email: 'family.ahmad@example.com', phone: '+963 912345678', address: 'Damascus, Syria' },
        },
        aidLog: [
            { id: 'aid-f1-1', type: 'in-kind', date: '2024-07-01T00:00:00Z', description: { en: 'Monthly Food Basket', ar: 'سلة غذائية شهرية' }, value: 75, unit: 'USD', status: 'Delivered', relatedProjectId: 'proj-comm' },
        ],
        assessments: [MOCK_ASSESSMENTS[1]],
        milestones: [],
        documents: [],
    },

    // --- Hafiz ---
    {
        id: 'ben-haf-001',
        name: { en: 'Abdulrahman Mahmoud', ar: 'عبد الرحمن محمود' },
        beneficiaryType: 'hafiz',
        photo: 'https://images.unsplash.com/photo-1601053706996-5c5188f57f6a?q=80&w=200&auto=format&fit=crop',
        status: 'active',
        supportType: 'sponsorship',
        country: 'Egypt',
        profile: {
            type: 'hafiz',
            dob: '2010-03-15',
            gender: 'Male',
            contact: { phone: '+20 100 1234 567' },
            memorization: {
                level: { en: 'Quran Memorization Circle', ar: 'حلقة تحفيظ قرآن' },
                juzCompleted: 18,
                circle: 'Al-Noor Circle',
            },
            sponsorship: { monthlyAmount: 80, currency: 'USD', startDate: '2023-06-01' },
        },
        aidLog: [],
        assessments: [],
        milestones: [
            { id: 'hm1', title: { en: 'Completed 15 Juz', ar: 'إكمال 15 جزءاً' }, status: 'achieved', date: '2024-03-01' },
            { id: 'hm2', title: { en: 'Complete 20 Juz', ar: 'إكمال 20 جزءاً' }, status: 'in-progress' },
            { id: 'hm3', title: { en: 'Full Quran Memorization', ar: 'ختم القرآن الكريم' }, status: 'pending' },
        ],
        documents: [],
    },

    // --- Institution ---
    {
        id: 'ben-inst-001',
        name: { en: 'Al-Amal School', ar: 'مدرسة الأمل' },
        beneficiaryType: 'institution',
        photo: 'https://picsum.photos/seed/school/200/200',
        status: 'active',
        supportType: 'direct-support',
        country: 'Turkey',
        projectId: 'proj-educ',
        profile: {
            type: 'institution',
            directorName: 'Ahmad Yilmaz',
            capacity: 250,
            institutionType: 'school',
            contact: { email: 'info@alamal.edu.tr', phone: '+90 212 555 0000' },
        },
        aidLog: [],
        assessments: [],
        milestones: [],
        documents: [],
    },

    // --- Community ---
    {
        id: 'ben-comm-001',
        name: { en: 'Zaatari Refugee Camp', ar: 'مخيم الزعتري للاجئين' },
        beneficiaryType: 'community',
        photo: 'https://picsum.photos/seed/zaatari/200/200',
        status: 'active',
        supportType: 'direct-support',
        country: 'Jordan',
        projectId: 'proj-comm',
        profile: {
            type: 'community',
            populationEstimate: 80000,
            fieldOfficer: 'Ali Hassan',
            areaType: 'refugee camp',
            contact: { email: 'field@zaatari.org', phone: '+962 6 000 0000' },
        },
        aidLog: [
            { id: 'aid-c1-1', type: 'in-kind', date: '2024-06-01T00:00:00Z', description: { en: 'Water Supply Delivery', ar: 'توصيل مياه' }, value: 5000, unit: 'liters', status: 'Delivered', relatedProjectId: 'proj-comm' },
        ],
        assessments: [],
        milestones: [],
        documents: [],
    },
];

export const INITIAL_BENEFICIARY_DATA: BeneficiaryData = {
    projects: [
        { id: 'proj-lead', name: { en: 'Leadership Building Project', ar: 'مشروع البناء القيادي' } },
        { id: 'proj-educ', name: { en: 'Educational Support Initiative', ar: 'مبادرة الدعم التعليمي' } },
        { id: 'proj-comm', name: { en: 'Community Service Program', ar: 'برنامج خدمة المجتمع' } },
    ],
    beneficiaries,
};
