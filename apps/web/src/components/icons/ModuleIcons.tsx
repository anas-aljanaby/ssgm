

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * IconWrapper - غلاف مشترك لأيقونات SVG لتوفير خصائص أساسية.
 * @component
 * @param {object} props - الخصائص.
 * @param {React.ReactNode} props.children - عناصر SVG الداخلية.
 * @param {string} [props.className="w-6 h-6"] - فئات CSS لتخصيص الأيقونة.
 * @returns {JSX.Element} - أيقونة SVG مغلفة.
 */
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
    </svg>
);

/**
 * DashboardIcon - أيقونة لوحة القيادة.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></IconWrapper>;

/**
 * DonorIcon - أيقونة المانحين (قلب).
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const DonorIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></IconWrapper>;

/**
 * LeadershipIcon - أيقونة التأهيل القيادي.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const LeadershipIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></IconWrapper>;

/**
 * SponsorshipIcon - أيقونة الكفالات (قبعة تخرج).
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const SponsorshipIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></IconWrapper>;

/**
 * ProjectIcon - أيقونة المشاريع.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ProjectIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></IconWrapper>;

/**
 * BeneficiaryIcon - أيقونة المستفيدين.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const BeneficiaryIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></IconWrapper>;

/**
 * OrphanageIcon - أيقونة دور الأيتام (مبنى).
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const OrphanageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </IconWrapper>
);


/**
 * ReportsIcon - أيقونة التقارير.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ReportsIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M8 6h8"></path><path d="M8 10h8"></path><path d="M8 14h4"></path><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 2v6h6"></path></IconWrapper>;

/**
 * SettingsIcon - أيقونة الإعدادات.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></IconWrapper>;

/**
 * LogoutIcon - أيقونة تسجيل الخروج.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></IconWrapper>;

/**
 * AiIcon - أيقونة الذكاء الاصطناعي.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const AiIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73z" /><path d="M4.5 4.5l3 3" /><path d="M16.5 4.5l-3 3" /><path d="M4.5 19.5l3-3" /><path d="M16.5 19.5l-3-3" /></IconWrapper>;

/**
 * HrIcon - أيقونة الموارد البشرية.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const HrIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></IconWrapper>;

export const VolunteerIcon = HrIcon;
export const StaffIcon = HrIcon;
export const PlatformIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></IconWrapper>;

/**
 * FinancialsIcon - أيقونة الإدارة المالية.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const FinancialsIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></IconWrapper>;

/**
 * InvestmentIcon - أيقونة إدارة الاستثمار.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const InvestmentIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></IconWrapper>;

/**
 * InventoryIcon - أيقونة إدارة المخزون.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const InventoryIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></IconWrapper>;

/**
 * EducationalMaterialsIcon - أيقونة المواد التعليمية.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const EducationalMaterialsIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></IconWrapper>;

/**
 * KnowledgeIcon - أيقونة مكتبة المعرفة (كتاب مفتوح).
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const KnowledgeIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></IconWrapper>;

/**
 * MediaIcon - أيقونة توثيق الوسائط.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const MediaIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></IconWrapper>;

/**
 * GamificationIcon - أيقونة الإنجازات (الدرع).
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const GamificationIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></IconWrapper>;

export const TrophyIcon = GamificationIcon; // Alias

/**
 * AdminDashboardIcon - أيقونة لوحة تحكم المسؤول.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const AdminDashboardIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.44.25a2 2 0 0 1-2 0l-.44-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2H2.22a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.18a2 2 0 0 1 1-1.73l.44-.25a2 2 0 0 1 2 0l.44.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.78a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4.44z"></path></IconWrapper>;

/**
 * PartnerIcon - أيقونة الشركاء.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const PartnerIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></IconWrapper>;

/**
 * PartnerEvaluationIcon - أيقونة تقييم الشركاء.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const PartnerEvaluationIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m12 11.5-1.55 3.16L6 15.5l3.25 2.8-1 4.2L12 19.5l3.75 3-1-4.2L18 15.5l-4.45-.84Z"/></IconWrapper>;

/**
 * ComplianceIcon - أيقونة الامتثال.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ComplianceIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></IconWrapper>;

/**
 * GrcIcon - أيقونة الحوكمة والمخاطر والامتثال.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const GrcIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></IconWrapper>;

/**
 * GRIReportingIcon - أيقونة تقارير GRI.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const GRIReportingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <polyline points="14 2 14 8 20 8" />
        <circle cx="12" cy="15" r="2" />
        <path d="M12 11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" />
        <path d="M9.5 15h5" />
    </IconWrapper>
);


/**
 * ShariaComplianceIcon - أيقونة الامتثال الشرعي.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ShariaComplianceIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5a2.5 2.5 0 0 1 0-5H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M16.1 7.9a4.5 4.5 0 1 0-5.8 5.8 4.5 4.5 0 0 0 5.8-5.8z"/></IconWrapper>;

/**
 * ShariaBoardIcon - أيقونة إدارة الهيئة الشرعية.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ShariaBoardIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="m22 9.5-2.2-1.4-1.4-2.2-2.2 1.4-1.4 2.2 1.4 2.2 2.2-1.4Z"/></IconWrapper>;

/**
 * TimingIcon - أيقونة التوقيت الأمثل.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const TimingIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3"/><path d="M22 12.5a10 10 0 0 1-18.8 4.3"/></IconWrapper>;

/**
 * SmartMessageIcon - أيقونة حملة الرسائل الذكية.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const SmartMessageIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></IconWrapper>;

/**
 * DigitalMarketingIcon - أيقونة التسويق الرقمي.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const DigitalMarketingIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></IconWrapper>;

/**
 * DonorIntelligenceIcon - أيقونة ذكاء المانحين.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const DonorIntelligenceIcon: React.FC<{ className?: string }> = ({ className }) => <IconWrapper className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /><circle cx="12" cy="12" r="3" /></IconWrapper>;

export const AnomalyDetectionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconWrapper>
);

export const HelpSupportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </IconWrapper>
);

/**
 * BousalaIcon - أيقونة بوصلة.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const BousalaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </IconWrapper>
);

// FIX: Added the missing 'IncubationIcon' component to resolve import errors.
/**
 * IncubationIcon - أيقونة الحاضنة.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const IncubationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="16 12 12 8 8 12"></polyline>
        <line x1="12" y1="16" x2="12" y2="8"></line>
    </IconWrapper>
);

/**
 * LoansIcon - أيقونة القروض.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
// FIX: The component name was misspelled as 'Ico'. Corrected to 'IconWrapper'.
export const LoansIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="m21 16-4-4 4-4"/>
        <path d="m17 12h-6"/>
    </IconWrapper>
);

/**
 * ForumIcon - أيقونة المنتدى.
 * @component
 * @param {object} [props] - الخصائص.
 * @param {string} [props.className] - فئات CSS إضافية.
 * @returns {JSX.Element}
 */
export const ForumIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </IconWrapper>
);
