

// FIX: Added import for React to resolve namespace error for React.Dispatch and React.SetStateAction.
import React from 'react';

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';
export type Role = 'Admin' | 'Manager' | 'Staff' | 'Volunteer';
export type DateFormat = 'gregorian' | 'hijri';
export type TimeFormat = '12h' | '24h';

export interface LanguageOption {
  code: Language;
  name: string;
  dir: Direction;
}

export interface DashboardState {
    language: Language;
    theme: Theme;
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
}

export type DashboardAction =
    | { type: 'SET_LANGUAGE'; payload: Language }
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'TOGGLE_THEME' }
    | { type: 'SET_DATE_FORMAT'; payload: DateFormat }
    | { type: 'SET_TIME_FORMAT'; payload: TimeFormat };

// Reusable Contact Person type for both Donors and Partners
export interface ContactPerson {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  isPrimary: boolean;
  photoUrl: string;
}

// =================================================================
// START: Donor Pipeline Types (Kanban View)
// =================================================================
export type DonorStageId = 'prospect' | 'researching' | 'contacted' | 'cultivating' | 'solicited' | 'pledged' | 'donated' | 'dormant';
export type RelationshipHealth = 'Good' | 'Moderate' | 'At Risk';
export type DonorPipelineLikelihood = 'High' | 'Medium' | 'Low';
export type DonorPipelineType = 'Individual' | 'Company' | 'Foundation' | 'Major Donor' | 'Recurring';

export interface DonorTask {
  id: string;
  text: string;
  type: 'Follow-up' | 'Call' | 'Email' | 'Meeting' | 'Review' | 'Other';
  assignedTo: Role;
  dueDate: string; // ISO
  completed: boolean;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  totalDonated: number;
  donationCount: number;
  firstDonation: string; // ISO
  lastDonation: string; // ISO
  country: string;
  avatar: string;
  stage: DonorStageId;
  potentialGift: number;
  suggestedAskAmount?: number;
  relationshipHealth: RelationshipHealth;
  lastContact: string; // ISO
  stageEnteredAt?: string; // ISO
  assignedOwner?: string;
  donorType?: DonorPipelineType;
  likelihood?: DonorPipelineLikelihood;
  interestTags?: string[];
  disqualificationReason?: string;
  tasks: DonorTask[];
  // Intelligence fields can be added here for Kanban cards
  donorCategory?: DonorCategory; 
}
// =================================================================
// END: Donor Pipeline Types (Kanban View)
// =================================================================

// Donor Intelligence Types
export type DonorCategory = 'Hero Donor' | 'Recurring Donor' | 'Seasonal Donor' | 'Event Donor' | 'Dormant Donor' | 'General Donor' | 'New Donor';

export interface Donation {
  id: string;
  donorId: string; // Corresponds to IndividualDonor.id
  amount: number;
  date: string; // ISO date string
  program: string;
}

export interface Communication {
  communication_id: string;
  donor_id: string; // Corresponds to IndividualDonor.id
  communication_type: 'email' | 'whatsapp' | 'sms' | 'call';
  sent_at: string; // ISO
  opened_at?: string; // ISO
  clicked_at?: string; // ISO
  response_at?: string; // ISO
  campaign_id?: string;
  subject: string;
  status: 'sent' | 'opened' | 'clicked' | 'responded' | 'ignored';
}

export interface ProfileDonation {
  id: string;
  donor_id: string;
  amount: number;
  date: string | null;
  created_at?: string | null;
  program: string;
  campaign?: string | null;
  designation?: string | null;
  payment_method?: string | null;
  status: string;
  receipt_state: string;
  refund_state: string;
  custom_fields?: Record<string, unknown>;
}

export interface DonorProfileTask {
  id: string;
  donor_id: string;
  text: string;
  type: DonorTask['type'];
  assigned_to: string;
  due_date: string | null;
  completed: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface DonorProfileInteraction {
  id: string;
  donor_id: string;
  interaction_type: 'email' | 'whatsapp' | 'sms' | 'call' | 'meeting' | 'note' | 'event';
  occurred_at: string | null;
  subject: string;
  status: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface DonorProfileDocument {
  id: string;
  donor_id: string;
  filename: string;
  file_url: string;
  label: string;
  content_type?: string | null;
  size_bytes?: number | null;
  uploaded_at: string | null;
  custom_fields?: Record<string, unknown>;
}

export interface DonorProfileActivity {
  id: string;
  type: 'donation' | 'interaction' | 'task_created' | 'task_completed';
  occurred_at: string | null;
  title: string;
  amount?: number;
  channel?: string;
  status?: string;
}

export interface DonorProfileSummary {
  donor: {
    id: string;
    full_name_en: string;
    full_name_ar?: string;
    email: string;
    phone: string;
    status: DonorStatus;
    tier: DonorTier;
    country: string;
    tags: string[];
    assigned_manager: string;
    avatar: string;
    donor_since: string | null;
    donor_category?: DonorCategory | null;
    primary_program_interest?: string | null;
    custom_fields?: Record<string, unknown>;
  };
  giving: {
    lifetimeGiving: number;
    totalGifts: number;
    lastGiftAmount: number | null;
    lastGiftDate: string | null;
    lastGiftRecordedAt?: string | null;
    averageGift: number | null;
    largestGift: number | null;
    programsSupported: string[];
    currentGivingStatus: 'active' | 'lapsed' | 'recurring' | 'pledge_open' | 'no_gifts';
  };
  relationship: {
    owner: string;
    pipelineStage: DonorStageId | string;
    stageEnteredAt: string | null;
    health: RelationshipHealth | null;
    likelihood: DonorPipelineLikelihood | null;
    lastContact: DonorProfileInteraction | null;
    openTaskCount: number;
  };
  recentActivity: DonorProfileActivity[];
  computed: {
    suggestedAskAmount: number | null;
    suggestedAskSource: 'calculated' | 'manual_override' | 'unavailable';
    suggestedAskConfidence: string;
    relationshipHealthSource: 'calculated' | 'manual_override' | 'unavailable';
  };
  sourceMeta: {
    giving: string;
    tasks: string;
    lastContact: string;
    pipeline: string;
  };
}

// Individual Donors Page Types
export type DonorStatus = 'Active' | 'Lapsed' | 'On Hold' | 'Deceased' | 'Disqualified';
export type DonorTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Major Donor';
export type SortDirection = 'asc' | 'desc';
export type FavoriteContentType = 'impact_stories' | 'statistics' | 'beneficiary_testimonials' | 'program_updates';
export type PledgeStatus = 'None' | 'Expected' | 'Pledged' | 'Partially Paid' | 'Paid' | 'Cancelled';

export interface DonorStageHistoryEntry {
  stage: DonorStageId;
  enteredAt: string;
  exitedAt?: string;
  note?: string;
}

export interface DonorDocument {
  id: string;
  title: string;
  type: 'Proposal' | 'Receipt' | 'Agreement' | 'Impact Report' | 'Thank You Letter';
  date: string;
}


export interface IndividualDonor {
  id: string;
  fullName: Record<Language, string>;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  totalDonations: number;
  lastDonationDate: string; // ISO
  status: DonorStatus;
  tier: DonorTier;
  country: string;
  city?: string;
  tags: string[];
  assignedManager: string;
  avatar: string;
  donorSince: string; // ISO
  // Fields for Donor Intelligence
  donorCategory?: DonorCategory;
  donationsCount?: number;
  avgGift?: number;
  largestGift?: number;
  recurringGiftStatus?: 'Active' | 'Paused' | 'None';
  programsSupported?: string[];
  donorType?: DonorPipelineType;
  relationshipStage?: DonorStageId;
  relationshipHealth?: RelationshipHealth;
  relationshipLikelihood?: DonorPipelineLikelihood;
  stageEnteredAt?: string;
  stageHistory?: DonorStageHistoryEntry[];
  potentialGift?: number;
  suggestedAskAmount?: number;
  currentProposal?: string;
  askDate?: string;
  pledgeAmount?: number;
  pledgeStatus?: PledgeStatus;
  expectedCloseDate?: string;
  lostReason?: string;
  relationshipTasks?: DonorTask[];
  lastContactDate?: string;
  relationshipNotes?: string;
  aiInsights?: string[];
  riskSignals?: string[];
  documents?: DonorDocument[];
  averageDaysBetweenDonations?: number;
  primaryProgramInterest?: string;
  categoryUpdatedAt?: string; // ISO

  // === NEW FIELDS for Optimal Contact Timing ===
  best_contact_day_of_month?: number; // 1-31
  best_contact_day_of_week?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  best_contact_time?: string; // HH:MM
  preferred_contact_channel?: 'email' | 'whatsapp' | 'sms' | 'call';
  next_predicted_donation_date?: string; // ISO date
  next_predicted_amount?: number;
  contact_frequency_days?: number;
  engagement_score?: number; // 0-100
  timing_updated_at?: string; // ISO datetime
  
  // === NEW FIELDS for Smart Message Campaign ===
  last_thank_you_sent?: string; // ISO date
  last_update_sent?: string; // ISO date
  last_request_sent?: string; // ISO date
  total_messages_sent?: number;
  total_messages_opened?: number;
  favorite_content_type?: FavoriteContentType;
  communication_preferences?: any; // JSON object
  preferred_language?: Language;
}

// Institutional Donors / Grantmakers Page Types
export type InstitutionType = 'Foundation' | 'Corporate' | 'Government' | 'Multilateral';
export type GrantmakerRelationshipStatus = 'Cold' | 'Prospect' | 'Cultivating' | 'Active' | 'Stewardship';
export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface InstitutionalDonor {
  id: string;
  organizationName: Record<Language, string>;
  logo: string;
  type: InstitutionType;
  primaryContact: {
      name: string;
      email: string;
  };
  totalGrantsAwarded: number;
  activeGrants: number;
  nextDeadline: string; // ISO date string
  relationshipStatus: GrantmakerRelationshipStatus;
  focusAreas: string[];
  geographicFocus: string[];
  assignedManager: string;
  priority: PriorityLevel;
  country: string;
  lastContactDate: string; // ISO date string
  createdDate: string; // ISO date string
  registrationNumber?: string;
  city?: string;
  establishmentDate?: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contacts?: ContactPerson[];
}


// Leadership Module Types
export type EventStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
export type EventCategory = 'educational' | 'leadership' | 'scout' | 'student_environment' | 'student-project';
export type EventType = 'lecture' | 'course' | 'camp' | 'workshop' | 'activity' | 'ceremony' | 'meeting' | 'event';
export type TeamMemberType = 'staff' | 'volunteer';

export interface TeamMember {
  id: string;
  name: string;
  type: TeamMemberType;
  photo: string;
}

export interface Event {
  id: string;
  title: Record<Language, string>;
  category: EventCategory;
  type: EventType;
  facilitator: TeamMember;
  date: string; // ISO 8601 format
  startTime?: string; // e.g., "10:00"
  endTime?: string; // e.g., "12:00"
  isMultiDay?: boolean;
  endDate?: string; // ISO 8601 format
  location?: string;
  description?: string;
  status: EventStatus;
  completionDate?: string; // ISO 8601 format, added for on-time calculation
  attendanceRate?: number; // Mocked data point (0-100)
  expectedParticipants?: number;
  budget?: number;
  duration?: number; // in minutes
}

export interface Stage {
  id: string;
  title: Record<Language, string>;
  events: Event[];
}

export interface Unit {
  id: string;
  name: Record<Language, string>;
  team: TeamMember[];
  stages: Stage[];
}

// Quranic Timeline Types
export type QuranicStationStatus = 'completed' | 'in-progress' | 'upcoming';
export interface QuranicStation {
    week: number;
    status: QuranicStationStatus;
    isCurrent: boolean;
    dateRange: Record<Language, string>;
    content: Record<Language, string>;
    notes: Record<Language, string>;
}

export interface LeadershipData {
    units: Unit[];
    quranicTimeline: {
        secondSemester: QuranicStation[];
        firstSemester: QuranicStation[];
        summerBreak: QuranicStation[];
    };
    studentProjects: StudentProject[];
}

export interface StudentProject {
    id: string;
    title: Record<Language, string>;
    student: { id: string, name: string, photo: string };
    category: ProjectCategory;
    status: 'active' | 'completed' | 'planned' | 'on-hold';
    startDate: string;
    endDate: string;
    mentor: string;
    description: Record<Language, string>;
    progress: number;
    impact: any;
}
export type ProjectCategory = 'community-service' | 'research' | 'innovation' | 'leadership' | 'environmental' | 'educational' | 'cultural';

export interface Alert {
    id: string;
    text: Record<Language, string>;
    priority: 'high' | 'medium' | 'low';
    timestamp: string;
    targetModule?: string;
    targetId?: string;
    targetTab?: string;
}

export interface ProgramProject {
    id: string;
    name: Record<Language, string>;
}

export type BeneficiaryType = 'student' | 'family' | 'orphan' | 'hafiz' | 'institution' | 'community';
export type BeneficiaryStatus = 'active' | 'inactive' | 'graduated' | 'suspended' | 'on-hold';
export type SupportType = 'sponsorship' | 'direct-support';

// Aid & Services Log Types
export type AidType = 'financial' | 'in-kind' | 'service';
export type AidStatus = 'Delivered' | 'Pending' | 'Scheduled';

export interface AidItem {
    id: string;
    type: AidType;
    date: string; // ISO
    description: Record<Language, string>;
    value?: number;
    unit?: string;
    status: AidStatus;
    relatedProjectId?: string;
    inventoryItemId?: string;
    disbursementId?: string;
}

export interface NeedsAssessment {
    id: string;
    date: string; // ISO
    assessor: string;
    notes?: string;
    povertyScore: number; // 1-5
    foodSecurity: 'secure' | 'at_risk' | 'insecure';
    housingStatus: 'stable' | 'unstable';
    medicalNeeds?: string;
    educationalNeeds?: string;
    suggestedPrograms?: string[];
}

export interface Milestone {
    id: string;
    title: Record<Language, string>;
    status: 'achieved' | 'in-progress' | 'pending';
    date?: string; // ISO date
}

// =================================================================
// Beneficiary Profile Discriminated Union
// =================================================================

/** Shared contact info */
export interface BeneficiaryContact {
    email?: string;
    phone?: string;
    address?: string;
}

/** Sponsorship details for sponsored beneficiaries */
export interface SponsorshipInfo {
    donorId?: number | string;
    startDate?: string; // ISO
    monthlyAmount?: number;
    currency?: string;
}

/** Student-specific profile */
export interface StudentProfile {
    type: 'student';
    dob?: string;
    gender?: string;
    contact?: BeneficiaryContact;
    academicInfo?: {
        level: Record<Language, string>;
        field?: string;
        university?: string;
        gpa?: number;
    };
    sponsorship?: SponsorshipInfo;
}

/** Orphan-specific profile */
export interface OrphanProfile {
    type: 'orphan';
    dob?: string;
    gender?: string;
    contact?: BeneficiaryContact;
    guardian?: {
        name: string;
        relation: string;
        phone?: string;
    };
    academicInfo?: {
        grade?: string;
        school?: string;
        attendance?: string;
        level?: string;
    };
    sponsorship?: SponsorshipInfo;
    familyMembers?: Array<{ relation: string; name: string; age?: number }>;
}

/** Hafiz-specific profile */
export interface HafizProfile {
    type: 'hafiz';
    dob?: string;
    gender?: string;
    contact?: BeneficiaryContact;
    memorization?: {
        level: Record<Language, string>;
        juzCompleted?: number;
        circle?: string;
    };
    sponsorship?: SponsorshipInfo;
}

/** Family profile */
export interface FamilyProfile {
    type: 'family';
    headOfHousehold?: string;
    memberCount?: number;
    monthlyIncome?: string;
    housingType?: string;
    contact?: BeneficiaryContact;
}

/** Institution profile (school, mosque, etc.) */
export interface InstitutionProfile {
    type: 'institution';
    directorName?: string;
    capacity?: number;
    institutionType?: string; // school, mosque, clinic, etc.
    contact?: BeneficiaryContact;
}

/** Community profile (camp, neighborhood, etc.) */
export interface CommunityProfile {
    type: 'community';
    populationEstimate?: number;
    fieldOfficer?: string;
    areaType?: string; // camp, neighborhood, village, etc.
    contact?: BeneficiaryContact;
}

export type BeneficiaryProfile =
    | StudentProfile
    | OrphanProfile
    | HafizProfile
    | FamilyProfile
    | InstitutionProfile
    | CommunityProfile;

// =================================================================
// Beneficiary (typed, no more `profile: any`)
// =================================================================

export interface Beneficiary {
    id: string;
    name: Record<Language, string>;
    beneficiaryType: BeneficiaryType;
    photo: string;
    status: BeneficiaryStatus;
    supportType: SupportType;
    country: string;
    projectId?: string;
    profile: BeneficiaryProfile;
    aidLog: AidItem[];
    assessments: NeedsAssessment[];
    milestones: Milestone[];
    documents: DocumentItem[];
}

export interface BeneficiaryData {
    projects: ProgramProject[];
    beneficiaries: Beneficiary[];
}

export type SponsorshipStatus = 'sponsored' | 'waiting' | 'graduate';

export interface Student {
    id: string;
    personalInfo: {
        name: { en: string, native: string };
        dateOfBirth: string;
        gender: string;
        country: string;
        city: string;
        photo: string;
        contact: { email: string, phone: string };
    };
    status: SponsorshipStatus;
    academicInfo: {
        level: string;
        field: string;
        university: string;
        gpa?: number;
    };
    story: {
        short: string;
        full: string;
        aspirations: string;
    };
    sponsorship?: {
        sponsorId: number;
        sponsorName: string;
        sponsorType: 'individual' | 'corporate';
        startDate: string;
        totalAmount: number;
        currency: 'USD';
        paidInstallments: number;
        totalInstallments: number;
        installments: any[];
        endDate?: string;
    };
    graduateInfo?: {
        graduationDate: string;
        employmentStatus: 'employed' | 'unemployed' | 'further-education';
        currentPosition?: string;
        employer?: string;
    };
    academicProgress: any[];
    communicationLog: any[];
    qualificationPrograms: any[];
    communityInitiatives: any[];
    createdAt: string;
    updatedAt: string;
}

export type SettingsCategory = 
    | 'organization'
    | 'users'
    | 'translations'
    | 'financials'
    | 'hr'
    | 'projects'
    | 'documents'
    | 'system'
    | 'reporting'
    | 'notifications'
    | 'advanced';

export type UserStatus = 'Active' | 'Invited' | 'Deactivated';

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    lastLogin: string;
    avatar: string;
}
export interface RolePermission {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}
export type RolePermissions = Record<string, RolePermission>;
export interface AppRole {
    id: string;
    name: Role;
    description: string;
    userCount: number;
    permissions: RolePermissions;
}

export type FinancialSettingsCategory = 'chartOfAccounts' | 'financialPeriods' | 'approvalWorkflows' | 'bankingAndPayments' | 'taxAndCompliance';

export type COATemplate = 'ifrs' | 'aaoifi' | 'hybrid' | 'custom';
export type FinancialPeriodStatus = 'Future' | 'Open' | 'Soft-Closed' | 'Hard-Closed';
export interface FinancialPeriod {
    id: string;
    name: Record<Language, string>;
    startDate: string;
    endDate: string;
    status: FinancialPeriodStatus;
}
export type TransactionType = 'purchaseRequisition' | 'vendorPayment' | 'expenseClaim' | 'grantDisbursement';

export interface ApprovalStep {
    id: string;
    stepNumber: number;
    approverType: 'role' | 'user' | 'reportingManager';
    approverId: string;
    condition: { field: string; operator: 'greater_than' | 'less_than' | 'equals'; value: number } | null;
}
export interface ApprovalWorkflow {
    id: TransactionType;
    name: Record<Language, string>;
    description: Record<Language, string>;
    isEnabled: boolean;
    steps: ApprovalStep[];
}
export interface AuthorizationLimit {
    id: string;
    roleId: Role;
    transactionType: TransactionType;
    limitAmount: number;
}
export type BankAccountStatus = 'Active' | 'Inactive' | 'Pending';
export interface BankAccount {
    id: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    status: BankAccountStatus;
    bankFeedConnected: boolean;
}
export interface PaymentGateway {
    id: string;
    name: string;
    isConnected: boolean;
    isLive: boolean;
}
export interface PaymentTerm {
    id: string;
    name: string;
    days: number;
}
export interface PaymentMethod {
    id: string;
    name: string;
    isEnabled: boolean;
}

export interface DocumentType { id: string; name: Record<Language, string>; icon: string; color: string; description: Record<Language, string>; }
export interface FolderTemplate { id: string; name: Record<Language, string>; description: Record<Language, string>; structure: any; }
export interface MetadataTag { id: string; name: string; color: string; }
export interface RetentionPolicy { id: string; name: string; appliesTo: any; durationYears: number; endOfLifeAction: 'archive' | 'delete' | 'review'; isEnabled: boolean; }
export type ProgramSettingsSubCategory = 'structure' | 'geography' | 'beneficiaries' | 'lifecycle' | 'frameworks' | 'indicators';
export interface ProgramCategory { id: string; name: Record<Language, string>; description: Record<Language, string>; icon: string; color: string; }
export interface ProjectLifecycleStage { id: string; name: Record<Language, string>; order: number; description: Record<Language, string>; }
export interface ProjectClassification { id: string; name: Record<Language, string>; description: Record<Language, string>; }
export interface GeographicLevel { id: string; name: string; children: GeographicLevel[]; }
export interface BeneficiaryGroup { id: string; name: Record<Language, string>; }
export interface DemographicTag { id: string; name: string; }
export interface LogFrameComponent { id: string; level: 'goal' | 'outcome' | 'output' | 'activity'; description: string; indicators: string[]; }
export interface TheoryOfChangeComponent { id: string; type: 'input' | 'activity' | 'output' | 'outcome' | 'impact'; description: string; links: string[]; }
export interface SDG { id: number; name: string; description: string; color: string; isEnabled: boolean; }
export interface Indicator { id: string; name: string; unit: 'number' | 'percentage' | 'currency'; }
export interface PartnerType { id: string; name: string; }
export interface PolicyDocument { id: string; title: string; url: string; }
export interface ReportTemplate { id: string; name: string; fields: string[]; }

export interface ProjectKPI {
    id: string;
    name: string;
    unit: 'number' | 'percentage' | 'text';
    target: string;
}
export type ProjectType = 'humanitarian' | 'development' | 'health' | 'education' | 'infrastructure';
export type ProjectLifecycleStageId = 'design' | 'planning' | 'implementation' | 'monitoring' | 'closure';

export interface Project {
    id: string;
    name: Record<Language, string>;
    type: ProjectType;
    stage: ProjectLifecycleStageId;
    sdgGoals?: number[];
    plannedStartDate: string;
    plannedEndDate: string;
    location: { country: string; city: string; region?: string };
    stakeholders: {
        donor: string;
        implementingPartner?: string;
        targetBeneficiaries: string;
        primaryContact: string;
    };
    goal: string;
    objectives: string[];
    expectedOutcomes: string[];
    kpis: ProjectKPI[];
    progress: number;
    budget: number;
    spent: number;
    documents: DocumentItem[];
    scopeStatement: {
        inScope: string[];
        outOfScope: string[];
        assumptions: string[];
        constraints: string[];
    };
    wbs: WbsNode;
    schedule: GanttTask[];
    criticalPath: string[];
    costManagement: {
        currency: string;
        budgetDetails: { category: string; planned: number; actual: number }[];
        expenseLog: ExpenseLogItem[];
        financialSummary: FinancialSummary;
    };
    humanResources: {
        projectTeam: ProjectTeamMember[];
        raciMatrix: Record<string, Record<string, RACI>>;
        timesheet: TimesheetEntry[];
    };
    riskManagement: { riskRegister: Risk[] };
    qualityManagement: { standards: QualityStandard[]; lessonsLearned: LessonLearned[] };
    monitoring: { evmHistory: EVMHistoryPoint[] };
    changeLog: ChangeRequest[];
}
export interface EVMHistoryPoint { month: string; pv: number; ev: number; ac: number; }
export interface ChangeRequest {
    id: string;
    description: string;
    requester: string;
    date: string;
    status: ChangeRequestStatus;
    impact: { scope?: string; time?: string; cost?: string; };
    approvalDate?: string;
}
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

export type SupportedFileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'png' | 'zip' | 'mp4' | 'folder' | 'generic' | 'ppt';
export type DocumentAccessLevel = 'public' | 'organization' | 'team' | 'private';
export interface FileVersion { version: string; date: string; author: string; notes: string; size: number; }
export interface DocumentFile {
    id: string;
    type: 'file';
    name: string;
    fileType: SupportedFileType;
    size: number; // in KB
    uploadedBy: string;
    uploadedDate: string;
    lastModified: string;
    tags: string[];
    description: string;
    accessLevel: DocumentAccessLevel;
    viewCount: number;
    versions: FileVersion[];
}
export interface DocumentFolder {
    id: string;
    type: 'folder';
    name: string;
    children: DocumentItem[];
    accessLevel: DocumentAccessLevel;
    lastModified: string;
}
export type DocumentItem = DocumentFile | DocumentFolder;

export type WbsNodeType = 'deliverable' | 'work-package' | 'task';
export interface WbsNode {
    id: string;
    name: string;
    type: WbsNodeType;
    children?: WbsNode[];
}
export interface GanttTask { id: string; name: string; start: string; end: string; progress: number; dependencies?: string[]; isMilestone?: boolean; }
export interface ExpenseLogItem { id: string; date: string; category: string; description: string; amount: number; wbsId: string; }
export interface FinancialSummary { burnRate: {month: string; value: number}[]; pv: number; ev: number; ac: number; spi: number; cpi: number; eac: number; etc: number; }
export interface ProjectTeamMember { userId: string; name: string; photo: string; projectRole: string; effort: number; availability: string; }
export type RACI = 'R' | 'A' | 'C' | 'I';
export interface TimesheetEntry { id: string; userId: string; wbsId: string; date: string; hours: number; }
export type RiskLevel = 'low' | 'medium' | 'high';
export interface Risk {
    id: string;
    description: string;
    category: 'financial' | 'security' | 'operational' | 'political' | 'reputational';
    probability: RiskLevel;
    impact: RiskLevel;
    responseStrategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
    contingencyPlan: string;
    owner: string;
    status: 'open' | 'in-progress' | 'closed';
}

export interface QualityStandard {
    id: string;
    name: string;
    description: string;
    type: 'process' | 'deliverable';
    checklist: { item: string; checked: boolean }[];
}
export interface LessonLearned { id: string; category: 'positive' | 'negative'; description: string; recommendation: string; }

export type GrcRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type GrcRiskStatus = 'identified' | 'mitigating' | 'monitored' | 'closed';
export interface GrcRisk {
    id: string;
    risk: string;
    category: string;
    probability: number;
    impact: number;
    score: number;
    level: GrcRiskLevel;
    scope: string;
    mitigation: string[];
    status: GrcRiskStatus;
}
export type PolicyStatus = 'draft' | 'active' | 'archived';
export interface Policy { id: string; title: Record<Language, string>; category: string; status: PolicyStatus; version: string; effectiveDate: string; reviewDate: string; ownerUserId: string; }
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'implemented';
export interface Decision { id: string; title: Record<Language, string>; date: string; status: DecisionStatus; impact: 'high' | 'medium' | 'low'; relatedPolicyId?: string; }
export type ComplianceStatus = 'compliant' | 'partially-compliant' | 'non-compliant' | 'not-assessed';
export interface ComplianceRequirement { id: string; code: string; title: Record<Language, string>; source: string; sourceName: Record<Language, string>; priority: 'high' | 'medium' | 'low'; nextDueDate: string; status: 'active' | 'inactive'; }
export interface Assessment { id: string; requirementId: string; date: string; status: ComplianceStatus; score: number; assessorId: string; findings?: Record<Language, string>; }
export interface AuditLog { id: number; module: string; recordType: string; recordId: string; action: string; userId: string; timestamp: string; }
export interface GrcData {
    policies: Policy[];
    decisions: Decision[];
    risks: GrcRisk[];
    requirements: ComplianceRequirement[];
    assessments: Assessment[];
    auditLog: AuditLog[];
}

export type MarketingMetricFormat = 'number' | 'currency' | 'percentage';
export interface MarketingMetric {
    id: string;
    value: number;
    trend: number;
    format: MarketingMetricFormat;
}
export type ActivityFeedItemType = 'donation' | 'emailSent' | 'socialPost' | 'adStarted' | 'landingPage' | 'comment' | 'formSubmission';
export interface ActivityFeedItem {
    id: string;
    type: ActivityFeedItemType;
    timestamp: string;
    description: Record<Language, string>;
    subject: string;
    link: string;
}
export interface SocialPost { id: string; platform: SocialPlatform; status: 'published' | 'scheduled' | 'draft'; scheduledTime: string; content: string; tags?: string[] }
export type EmailStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Failed' | 'Archived';
export interface Email { id: string; name: Record<Language, string>; subject: Record<Language, string>; status: EmailStatus; audience: { name: string; size: number; }; sentDate?: string; scheduledDate?: string; stats: { sent: number; delivered: number; openRate: number; clickRate: number; conversions: number; }; createdBy: string; createdAt: string; }
export type AdCampaignStatus = 'Active' | 'Paused' | 'Ended' | 'Learning' | 'In Review' | 'Rejected' | 'Scheduled';
export type AdPlatformId = 'google' | 'meta' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube';
export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatformId;
  type: 'Search' | 'Social' | 'Video';
  status: AdCampaignStatus;
  budget: { type: 'daily' | 'lifetime'; amount: number; spent: number; };
  schedule: { start: string; end: string; };
  performance: {
    impressions: number; clicks: number; ctr: number;
    conversions: number; cvr: number; cost: number; cpa: number;
    roas?: number;
  };
  optimizationScore?: number;
}
export type CampaignStatus = 'Completed' | 'Active' | 'Paused' | 'Scheduled' | 'Draft';
export interface Campaign {
  id: string;
  name: Record<Language, string>;
  type: 'Seasonal' | 'Fundraising' | 'Awareness' | 'Volunteer' | 'Event';
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  channels: string[];
  budget: number;
  spent: number;
  audience: { name: string; size: number };
  goal: { type: 'Fundraising' | 'Subscribers' | 'Registrations'; target: number; current: number };
  owner: string;
  createdAt: string;
}
export interface CampaignSegment {
  id: string;
  name: string;
  contactCount: number;
  lastUpdated: string;
  creator: string;
  type: 'dynamic' | 'static';
}
export type MessageType = 'thank_you' | 'update' | 'request' | 're_engagement' | 'milestone';
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin';
export type MarketingMetricId = 'totalSubscribers' | 'deliverability' | 'avgOpenRate' | 'avgClickRate' | 'emailConversions' | 'unsubscribeRate';
export interface MessagingCampaign {
  id: string;
  name: Record<Language, string>;
  channel: 'sms' | 'whatsapp';
  status: 'Sent' | 'Scheduled' | 'Draft';
  sentDate?: string;
  scheduledDate?: string;
  recipients: { count: number; listName: string };
  delivered: { count: number; rate: number };
  read?: { count: number; rate: number }; // WhatsApp only
  responded: { count: number; rate: number };
  optOuts: { count: number; rate: number };
  cost: { total: number; perMessage: number };
}
export type LandingPageStatus = 'Published' | 'Draft' | 'Scheduled' | 'Archived';
export type LandingPageType = 'Donation' | 'Event' | 'Volunteer' | 'Newsletter' | 'Petition' | 'General';
export interface LandingPage {
  id: string;
  name: string;
  type: LandingPageType;
  status: LandingPageStatus;
  thumbnail: string;
  url: string;
  performance: { views: number; uniqueVisitors: number; conversionRate: number; conversions: number; bounceRate: number; avgTimeOnPage: number; };
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
export type LandingPageKpi = {
    totalPages: { value: number; breakdown: { published: number; draft: number; scheduled: number; archived: number; } };
    totalViews: { value: number; unique: number; trend: number; };
    avgConversionRate: { value: number; trend: number; topPerformer: { name: string; value: number; } };
    totalConversions: { value: number; revenue: number; };
};
export interface AdPlatformAccount {
  id: AdPlatformId;
  name: string;
  status: 'connected' | 'not-connected' | 'error';
  accountName?: string;
  accountId?: string;
  metrics: { spend: number; activeCampaigns: number; impressions: number; clicks: number; ctr: number; conversions: number; cvr: number; cpc: number; cpm?: number; cpv?: number; viewRate?: number; };
  adGrant?: { status: 'active' | 'suspended' | 'pending' | 'not-enrolled'; budget: number; spend: number; };
}
export interface SocialAccount {
    id: SocialPlatform | 'youtube' | 'tiktok';
    name: string;
    status: 'connected' | 'not-connected' | 'error';
    profile: {
        name: string;
        handle: string;
        avatar: string;
    };
    stats: {
        followers: number;
        followerTrend: number;
    };
}
export type ComplianceEntityType = 'individual' | 'organization' | 'vendor' | 'partner';
export type AlertStatus = 'open' | 'in-review' | 'closed';
export interface ComplianceEntity {
  id: string;
  name: string;
  type: ComplianceEntityType;
  country: string;
  riskLevel: RiskLevel;
  lastScreened: string; // ISO
  createdAt: string; // ISO
}
export interface ComplianceAlert {
  id: string;
  entityId: string;
  entityName: string;
  matchDetails: string;
  listSource: string;
  status: AlertStatus;
  createdAt: string; // ISO
}
export type ContactChannel = 'email' | 'whatsapp' | 'sms' | 'call';
export type EngagementScoreLevel = 'High' | 'Medium' | 'Low';
export interface MessageTemplate {
  template_id: number;
  template_name: string;
  donor_category: DonorCategory;
  message_type: MessageType;
  language: Language;
  subject_template: string;
  body_template: string;
  variables_used: string[];
  tone: 'formal' | 'warm' | 'celebratory';
  created_at: string;
  success_rate?: number;
}
export type SendChannel = 'email' | 'whatsapp' | 'sms';
export interface GeneratedMessage {
    message_id: number;
    donor_id: string;
    template_id: number;
    message_type: MessageType;
    language: Language;
    generated_subject: string;
    generated_body: string;
    personalization_score: number;
    predicted_open_rate: number;
    scheduled_send_time: string; // ISO
    status: 'draft' | 'scheduled' | 'sent' | 'opened' | 'clicked' | 'responded';
    send_channel: SendChannel;
    created_at: string; // ISO
}
export type VolunteerType = 'volunteer' | 'staff';
export type VolunteerStatus = 'active' | 'inactive' | 'pending';
export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface Volunteer {
    volunteer_id: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    volunteer_type: VolunteerType;
    join_date: string;
    status: VolunteerStatus;
    preferred_language: Language;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    address: string;
    city: string;
    country: string;
    photo_url: string;
}
export interface VolunteerSkill {
    skill_id: string;
    volunteer_id: string;
    skill_name: string;
    skill_category: string;
    proficiency_level: SkillProficiency;
    years_experience: number;
    certified: boolean;
}
export interface VolunteerAvailability {
    availability_id: string;
    volunteer_id: string;
    day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    start_time: string; // "HH:MM"
    end_time: string; // "HH:MM"
    available: boolean;
}
export interface VolunteerAssignment {
    assignment_id: string;
    volunteer_id: string;
    program_id: string;
    event_name: string;
    event_type: string;
    assignment_date: string;
    start_time: string;
    end_time: string;
    location: string;
    role: string;
    required_skills: string[];
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    ai_match_score?: number;
}
export interface VolunteerHoursLog {
    log_id: string;
    volunteer_id: string;
    assignment_id?: string;
    date: string;
    hours: number;
    activity_type: string;
    program_id?: string;
    verified: boolean;
}
export interface VolunteerPerformance {
    performance_id: string;
    volunteer_id: string;
    evaluation_period_start: string;
    evaluation_period_end: string;
    total_hours: number;
    assignments_completed: number;
    no_show_count: number;
    average_rating: number;
    punctuality_score: number;
    reliability_score: number;
    overall_performance_score: number;
}
export interface HrData {
    volunteers: Volunteer[];
    skills: VolunteerSkill[];
    availability: VolunteerAvailability[];
    assignments: VolunteerAssignment[];
    hoursLog: VolunteerHoursLog[];
    performance: VolunteerPerformance[];
}
export type AssetClass = 'stocks' | 'bonds' | 'real_estate' | 'cash' | 'mutual_funds';
export interface Investment {
    id: string;
    name: string;
    ticker?: string;
    assetClass: AssetClass;
    shariahCompliant: boolean;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: string; // ISO
    currency: 'USD' | 'TRY' | 'SAR' | 'EUR';
}
export interface Portfolio {
    id: string;
    name: Record<Language, string>;
    description: Record<Language, string>;
    investments: Investment[];
}
export interface InvestmentKpi {
    portfolioValue: number;
    overallRoi: number;
    ytdReturn: number;
    riskScore: number;
    shariahPercentage: number;
    annualizedReturn: number;
}
export interface InvestmentTransaction {
    id: string;
    investmentId: string;
    investmentName: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    date: string; // ISO
    totalValue: number;
    currency: 'USD' | 'TRY' | 'SAR' | 'EUR';
}
export type InventoryCategory = 'clothing' | 'food' | 'medical' | 'education' | 'other';
export interface InventoryItem {
    id: string;
    name: Record<Language, string>;
    category: InventoryCategory;
    sku: string;
    description: Record<Language, string>;
    imageUrl: string;
    unitOfMeasure: 'pcs' | 'box' | 'kg' | 'kit';
    valuePerUnit: number;
}
export interface Warehouse {
    id: string;
    name: string;
    location: string;
}
export interface StockLevel {
    itemId: string;
    warehouseId: string;
    quantity: number;
    lowStockThreshold: number;
}
export interface InventoryTransaction {
    id: string;
    itemId: string;
    warehouseId: string;
    type: 'inbound' | 'outbound' | 'adjustment';
    quantity: number;
    date: string; // ISO
    notes: string;
    relatedProjectId?: string;
}
export interface InventoryData {
    items: InventoryItem[];
    warehouses: Warehouse[];
    stockLevels: StockLevel[];
    transactions: InventoryTransaction[];
}
export type EducationalFileType = 'pdf' | 'ppt' | 'pptx' | 'docx' | 'mp4' | 'jpg' | 'png' | 'generic' | 'zip';
export type FileCategory = 'presentations' | 'documents' | 'videos' | 'other';
export interface EducationalFile {
    id: string;
    name: string;
    type: EducationalFileType;
    category: FileCategory;
    size: number; // in bytes
    url: string;
    uploadDate: string; // ISO
}
export interface Photo {
    id: string;
    type: 'photo';
    src: string;
    width: number;
    height: number;
    title: string;
    event: string;
    date: string; // ISO
}
export interface Video {
    id: string;
    type: 'video';
    src: string;
    poster: string;
    width: number;
    height: number;
    title: string;
    duration: string; // "m:ss"
    event: string;
    date: string; // ISO
}
export type MediaItem = Photo | Video;
export type UserLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type BadgeCategory = 'Attendance' | 'Participation' | 'Evaluation' | 'Achievement';
export interface Badge {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  icon: string;
  category: BadgeCategory;
  criteria: Record<Language, string>;
  total: number;
  points: number;
}

// FIX: Added missing type definitions for various modules.
// Gamification Module
export interface UserAchievement {
    userId: string;
    totalPoints: number;
    level: UserLevel;
    earnedBadges: { badgeId: string; dateEarned: string; }[];
    badgeProgress: Record<string, number>;
    pointsBreakdown: Partial<Record<BadgeCategory, number>>;
}

export interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    points: number;
    level: UserLevel;
}

export interface GamificationData {
    allBadges: Badge[];
    userAchievement: UserAchievement;
    leaderboard: LeaderboardUser[];
}

// Knowledge Module
export interface KnowledgeArticle {
    id: string;
    title: Record<Language, string>;
    content: Record<Language, string>;
    category: Record<Language, string>;
    author_id: string;
    author_name: string;
    created_date: string; // ISO
    views: number;
    tags: string[];
}

export interface KnowledgeUserPoints {
    user_id: string;
    user_name: string;
    avatar: string;
    total_points: number;
    contributions: number;
    last_contribution: string; // ISO
}

export interface KnowledgeData {
    articles: KnowledgeArticle[];
    points: KnowledgeUserPoints[];
    // FIX: Added setKnowledgeData to the KnowledgeData type to resolve type errors in IncubationSuccessMetricsPage.
    setKnowledgeData?: React.Dispatch<React.SetStateAction<KnowledgeData>>;
}

// Incubation Module
export interface Mentor {
    id: string;
    name: string;
    specialty: string;
    photoUrl: string;
}

export interface Investor {
    id: string;
    name: string;
    type: string;
    logoUrl: string;
    investmentFocus: string[];
    lastInteraction: string; // ISO
}

export interface Startup {
    id: string;
    name: string;
    sector: string;
    description: string;
    logo: string;
    stage: 'idea' | 'mvp' | 'growth';
    founder: { name: string; email: string };
    cohortId: string;
    mentorIds: string[];
    investorIds: string[];
    funding: number;
    status: 'active' | 'graduated' | 'failed';
    jobsCreated?: number;
    postProgramFunding?: number;
    financials: { plannedBudget: number, actualSpent: number };
}

export interface Cohort {
    id: string;
    name: string;
    startDate: string; // ISO
    endDate: string; // ISO
    status: 'recruiting' | 'in-progress' | 'completed';
}

export type ApplicationStatus = 'Pending' | 'Under Review' | 'Accepted' | 'Rejected';

export interface Review {
    reviewerName: string;
    comment: string;
    score: number;
    date: string; // ISO
}

export interface IncubationApplication {
    id: string;
    date: string; // ISO
    founderName: string;
    founderEmail: string;
    projectName: string;
    projectDescription: string;
    sector: string;
    fundingNeed: number;
    status: ApplicationStatus;
    autoScore: number;
    reviews: Review[];
}

export interface MentorshipSession {
    id: string;
    startupId: string;
    mentorId: string;
    date: string; // ISO
    topic: string;
    notes: string;
    rating: number; // 1-5
}

export interface CurriculumMilestone {
    id: string;
    title: Record<Language, string>;
    description: Record<Language, string>;
}

export interface CurriculumModule {
    week: number;
    title: Record<Language, string>;
    description: Record<Language, string>;
    milestones: CurriculumMilestone[];
}

export type MilestoneStatus = 'completed' | 'pending' | 'delayed';

export interface MilestoneProgress {
    milestoneId: string;
    status: MilestoneStatus;
    completionDate?: string; // ISO
    dueDate: string; // ISO
}

export interface StartupProgress {
    startupId: string;
    milestoneProgress: MilestoneProgress[];
}

export interface StageData {
    id: string;
    icon: string;
    title: Record<Language, string>;
    description: Record<Language, string>;
    keyActivities: Record<Language, string[]>;
    linkedModule: string;
    progress: number;
}


export interface IncubationData {
    mentors: Mentor[];
    investors: Investor[];
    startups: Startup[];
    cohorts: Cohort[];
    applications: IncubationApplication[];
    mentorshipSessions: MentorshipSession[];
    curriculum: CurriculumModule[];
    startupProgress: StartupProgress[];
}

// Admin Dashboard Module
export interface Participant {
    id: string;
    name: string;
    registrationDate: string; // ISO
    attendanceStatus: 'Attended' | 'Absent' | 'Registered';
    rating?: number;
    event: string;
    email: string;
}
export interface AdminDashboardData {
    totalRegistrations: { value: number; trend: number };
    totalAttendees: { value: number; total: number };
    averageRating: { value: number; count: number };
    budgetUtilization: { used: number; total: number };
    attendanceOverTime: { date: string; attendees: number }[];
    registrationVsAttendance: { event: string; registrations: number; attendees: number }[];
    eventTypeDistribution: { name: string; value: number }[];
    ratingDistribution: { rating: number; count: number }[];
    participants: Participant[];
}

// Partner Module
export type PartnerStatus = 'نشط' | 'غير نشط' | 'قيد المراجعة';
export type PartnerSector = 'التعليم' | 'الصحة' | 'الإغاثة' | 'التنمية' | 'البيئة';
export interface Partner {
    id: string;
    name: string;
    logo: string;
    country: string;
    sector: PartnerSector;
    status: PartnerStatus;
    projectsCompleted: number;
    projectsInProgress: number;
    rating: number;
    budget: number;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    coordinates?: { lat: number, lng: number } | null;
    contacts?: ContactPerson[];
}

// Anomaly Detection
export interface KpiDataPoint {
    date: string; // YYYY-MM-DD
    value: number;
}
export interface Anomaly {
    date: string;
    value: number;
    reason: 'spike' | 'drop' | 'missing';
    expectedRange: [number, number];
}

// Help & Announcements
export interface Announcement {
    id: string;
    date: string; // ISO
    title: Record<Language, string>;
    content: Record<Language, string>;
    isNew: boolean;
    tag: {
        text: Record<Language, string>;
        color: string;
    };
}
export interface TourStep {
    selector: string;
    titleKey: string;
    contentKey: string;
}
export interface FaqItem {
    id: string;
    category: 'general' | 'donors' | 'projects';
    question: Record<Language, string>;
    answer: Record<Language, string>;
}
export interface Tutorial {
    id: string;
    title: Record<Language, string>;
    description: Record<Language, string>;
    duration: number; // in minutes
    type: 'video' | 'interactive';
    videoUrl?: string;
}

// Sharia Module
export type ShariaBoardRole = 'Chairman' | 'Member' | 'Secretary' | 'Observer';
export type ShariaMemberStatus = 'Active' | 'On Leave' | 'Inactive';
export interface ShariaBoardMember {
    id: string;
    name: Record<Language, string>;
    title: Record<Language, string>;
    photoUrl: string;
    role: ShariaBoardRole;
    status: ShariaMemberStatus;
    email: string;
    bio: Record<Language, string>;
    credentials: string[];
}
export interface ShariaMeeting {
    id: string;
    title: Record<Language, string>;
    date: string; // ISO
    startTime: string;
    endTime: string;
    location: string;
    attendees?: string[]; // array of member IDs
    agenda?: {
        topic: Record<Language, string>;
        presenter: string;
    }[];
    minutesUrl?: string;
}

// Stakeholder Module
export type StakeholderType = 'donor' | 'beneficiary' | 'partner' | 'volunteer' | 'mentor' | 'expert' | 'investor' | 'board_member' | 'government' | 'supplier' | 'community' | 'media';
export type StakeholderCategoryKey = 'foundation' | 'family' | 'company';

export interface Stakeholder {
    id: number | string;
    name: Record<Language, string>;
    type: StakeholderType;
    category: StakeholderCategoryKey;
    status: 'active' | 'inactive' | 'pending';
    healthScore: number; // 0-100
    relationshipLevel: 'strategic' | 'core' | 'important';
    riskLevel: 'low' | 'medium' | 'high';
    lastContact: string; // ISO
    aiInsights: string; // key for translation
    email: string;
    phone: string;
    country: string;
    engagementScore: number;
    totalDonations?: number;
    supportReceived?: number;
    partnershipValue?: number;
    power: number; // 0-100
    interest: number; // 0-100
    classification: 'primary' | 'secondary';
    riskProfile: 'supporter' | 'neutral' | 'blocker';
    needs: string[];
}

// Orphanage Module
export type OrphanageStatus = 'Active' | 'Under Review' | 'Inactive';

export interface Orphanage {
    id: string;
    name: Record<Language, string>;
    country: string;
    city: string;
    logo: string;
    status: OrphanageStatus;
    capacity: number;
    beneficiaryCount: number;
    budget: number;
    manager: string;
}

// Bousala (Goals) Module
export interface BousalaKpi {
    id: string;
    title: string;
    value: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: string; // ISO
    description?: string;
    prediction?: {
        probability: number;
        status: 'On Track' | 'At Risk' | 'Unlikely';
    };
}
export interface BousalaGoal {
    id: string;
    title: string;
    description: string;
    progress: number;
    linkedProjects: string[];
    responsiblePerson: string;
    deadline?: string; // ISO
    status?: string;
    kpis?: BousalaKpi[];
    prediction?: {
        probability: number;
        trend: 'up' | 'down' | 'stable';
        recommendation: string;
    };
}
export interface BousalaProject {
    id: string;
    title: string;
    description: string;
    progress: number;
    linkedGoal: string;
    linkedTasks: string[];
    status?: string;
    /** Main Projects module id when linked from execution projects. */
    sourceProjectId?: string;
}
export interface BousalaTask {
    id: string;
    title: string;
    description: string;
    status: 'in-progress' | 'completed';
    linkedProject: string;
    assignee: string;
    dueDate?: string;
    priority?: 'high' | 'medium' | 'low';
}

export interface BousalaDirection {
    vision: string;
    mission: string;
    general: string;
}

// Loans Module
export type LoanStatus = 'Active' | 'Paid Off' | 'Default';
export type RepaymentStatus = 'Paid' | 'Due' | 'Overdue';
export type LoanType = 'educational' | 'operational';
export interface RepaymentInstallment {
    id: string;
    loanId: string;
    installmentNumber: number;
    dueDate: string; // ISO
    amount: number;
    status: RepaymentStatus;
    paidDate?: string; // ISO
}
export interface Loan {
    id: string;
    borrowerName: string;
    type: LoanType;
    amount: number;
    currency: 'USD' | 'TRY' | 'SAR' | 'EUR';
    issueDate: string; // ISO
    status: LoanStatus;
    repaymentSchedule: RepaymentInstallment[];
    donorId?: string;
    stakeholderId?: number;
    projectId?: string;
    financeEntryId?: string;
    riskLevel?: 'Low' | 'Medium' | 'High';
    recommendedActionKey?: 'monitorClosely' | 'sendReminder' | 'offerCounseling';
}
export interface LoansData {
    loans: Loan[];
}

// Forum Module
export interface ForumCategory {
    id: string;
    name: Record<Language, string>;
    description: Record<Language, string>;
}
export interface ForumReply {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: string; // ISO
}
export interface ForumPost {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    categoryId: string;
    createdAt: string; // ISO
    lastActivity: string; // ISO
    replies: ForumReply[];
    tags: string[];
}

// Admin dashboard
export interface Participant {
    id: string;
    name: string;
    registrationDate: string;
    attendanceStatus: 'Attended' | 'Absent' | 'Registered';
    rating?: number;
    event: string;
    email: string;
}

export interface AdminDashboardData {
    totalRegistrations: { value: number, trend: number };
    totalAttendees: { value: number, total: number };
    averageRating: { value: number, count: number };
    budgetUtilization: { used: number, total: number };
    attendanceOverTime: { date: string, attendees: number }[];
    registrationVsAttendance: { event: string, registrations: number, attendees: number }[];
    eventTypeDistribution: { name: string, value: number }[];
    ratingDistribution: { rating: number, count: number }[];
    participants: Participant[];
}

// Financials Module
export type { FinancialTransaction, TransactionStatus, TransactionDirection, TransactionCategory } from './types/financials';
export type { DonationRecord, DonationMethod, ReceiptStatus } from './types/financials';
export type { FinancialPledge, FinancialPledgeStatus, PledgeInstallment } from './types/financials';
export type { ProjectBudget, BudgetStatus, BudgetLine } from './types/financials';
export type { Disbursement, DisbursementType, DisbursementStatus } from './types/financials';
export type { Fund, FundType, Grant, GrantInstallment } from './types/financials';
export type { ApprovalItem, ApprovalItemType } from './types/financials';
export type { FinancialReport, FinancialReportType } from './types/financials';
export type { FinancialAlert, MonthlyFinancialData } from './types/financials';
