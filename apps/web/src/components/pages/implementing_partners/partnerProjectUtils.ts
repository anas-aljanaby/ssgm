import type { Language, Partner, Project } from '../../../types';
import type { PartnerProject } from './partnerStaticData';

export function projectMatchesPartner(project: Project, partner: Partner): boolean {
    const link = project.stakeholders.implementingPartner?.trim() ?? '';
    if (!link) return false;
    if (link === partner.id) return true;
    if (link === partner.nameAr.trim()) return true;
    if (link === partner.nameEn.trim()) return true;
    return link === partner.name.trim();
}

export function mapProjectStageToPartnerStatus(stage: Project['stage'], progress: number): string {
    if (stage === 'closure' || progress >= 100) return 'مكتمل';
    return 'جاري التنفيذ';
}

export function mapProjectToPartnerProject(
    project: Project,
    language: Language,
    typeLabel: string,
): PartnerProject {
    const name = language === 'ar'
        ? (project.name.ar || project.name.en)
        : (project.name.en || project.name.ar);
    const beneficiaries = parseInt(project.stakeholders.targetBeneficiaries.replace(/\D/g, ''), 10) || 0;
    const location = [project.location.city, project.location.country].filter(Boolean).join(', ')
        || project.location.country;

    return {
        id: project.id,
        status: mapProjectStageToPartnerStatus(project.stage, project.progress),
        name,
        sector: typeLabel,
        duration: `${project.plannedStartDate} - ${project.plannedEndDate}`,
        budget: project.budget,
        beneficiaries,
        location,
        progress: project.progress,
    };
}

export interface PartnerProjectStats {
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    linkedProjects: Project[];
}

export function computePartnerProjectStats(projects: Project[], partner: Partner): PartnerProjectStats {
    const linkedProjects = projects.filter((project) => projectMatchesPartner(project, partner));
    const activeProjects = linkedProjects.filter(
        (project) => project.stage === 'implementation' || project.stage === 'monitoring' || project.stage === 'planning',
    ).length;
    const completedProjects = linkedProjects.filter((project) => project.stage === 'closure').length;
    const totalBudget = linkedProjects.reduce((sum, project) => sum + project.budget, 0);

    return { activeProjects, completedProjects, totalBudget, linkedProjects };
}

export function getPartnerCustomFieldString(
    customFields: Record<string, unknown> | undefined,
    key: string,
): string | null {
    const value = customFields?.[key];
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
}
