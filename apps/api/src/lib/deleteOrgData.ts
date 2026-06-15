import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';

/** Deletes all domain data for one org, in reverse FK order. */
export async function deleteOrgData(orgId: string) {
    await db.delete(schema.financial_alerts).where(eq(schema.financial_alerts.org_id, orgId));
    await db.delete(schema.financial_reports).where(eq(schema.financial_reports.org_id, orgId));
    await db.delete(schema.approval_items).where(eq(schema.approval_items.org_id, orgId));
    await db.delete(schema.grant_installments).where(eq(schema.grant_installments.org_id, orgId));
    await db.delete(schema.grants).where(eq(schema.grants.org_id, orgId));
    await db.delete(schema.institutional_donor_documents).where(eq(schema.institutional_donor_documents.org_id, orgId));
    await db.delete(schema.institutional_donor_contacts).where(eq(schema.institutional_donor_contacts.org_id, orgId));
    await db.delete(schema.institutional_donors).where(eq(schema.institutional_donors.org_id, orgId));
    await db.delete(schema.disbursements).where(eq(schema.disbursements.org_id, orgId));
    await db.delete(schema.budget_lines).where(eq(schema.budget_lines.org_id, orgId));
    await db.delete(schema.project_budgets).where(eq(schema.project_budgets.org_id, orgId));
    await db.delete(schema.pledge_installments).where(eq(schema.pledge_installments.org_id, orgId));
    await db.delete(schema.financial_pledges).where(eq(schema.financial_pledges.org_id, orgId));
    await db.delete(schema.donation_records).where(eq(schema.donation_records.org_id, orgId));
    await db.delete(schema.transaction_attachments).where(eq(schema.transaction_attachments.org_id, orgId));
    await db.delete(schema.financial_transactions).where(eq(schema.financial_transactions.org_id, orgId));
    await db.delete(schema.funds).where(eq(schema.funds.org_id, orgId));
    await db.delete(schema.donor_documents).where(eq(schema.donor_documents.org_id, orgId));
    await db.delete(schema.donor_interactions).where(eq(schema.donor_interactions.org_id, orgId));
    await db.delete(schema.donor_tasks).where(eq(schema.donor_tasks.org_id, orgId));
    await db.delete(schema.donations).where(eq(schema.donations.org_id, orgId));
    await db.delete(schema.individual_donors).where(eq(schema.individual_donors.org_id, orgId));
    await db.delete(schema.partner_evaluations).where(eq(schema.partner_evaluations.org_id, orgId));
    await db.delete(schema.partner_documents).where(eq(schema.partner_documents.org_id, orgId));
    await db.delete(schema.implementing_partners).where(eq(schema.implementing_partners.org_id, orgId));
    await db.delete(schema.stakeholders).where(eq(schema.stakeholders.org_id, orgId));
    await db.delete(schema.beneficiaries).where(eq(schema.beneficiaries.org_id, orgId));
    await db.delete(schema.project_team_members).where(eq(schema.project_team_members.org_id, orgId));
    await db.delete(schema.project_risks).where(eq(schema.project_risks.org_id, orgId));
    await db.delete(schema.project_expenses).where(eq(schema.project_expenses.org_id, orgId));
    await db.delete(schema.project_budget_lines).where(eq(schema.project_budget_lines.org_id, orgId));
    await db.delete(schema.project_tasks).where(eq(schema.project_tasks.org_id, orgId));
    await db.delete(schema.project_kpis).where(eq(schema.project_kpis.org_id, orgId));
    await db.delete(schema.projects).where(eq(schema.projects.org_id, orgId));
    await db.delete(schema.bousala_tasks).where(eq(schema.bousala_tasks.org_id, orgId));
    await db.delete(schema.bousala_goal_projects).where(eq(schema.bousala_goal_projects.org_id, orgId));
    await db.delete(schema.bousala_kpis).where(eq(schema.bousala_kpis.org_id, orgId));
    await db.delete(schema.bousala_goals).where(eq(schema.bousala_goals.org_id, orgId));
    await db.delete(schema.grc_screening_alerts).where(eq(schema.grc_screening_alerts.org_id, orgId));
    await db.delete(schema.grc_screening_entities).where(eq(schema.grc_screening_entities.org_id, orgId));
    await db.delete(schema.grc_compliance_assessments).where(eq(schema.grc_compliance_assessments.org_id, orgId));
    await db.delete(schema.grc_compliance_requirements).where(eq(schema.grc_compliance_requirements.org_id, orgId));
    await db.delete(schema.grc_risks).where(eq(schema.grc_risks.org_id, orgId));
    await db.delete(schema.grc_decisions).where(eq(schema.grc_decisions.org_id, orgId));
    await db.delete(schema.grc_policies).where(eq(schema.grc_policies.org_id, orgId));
    await db.delete(schema.audit_log).where(eq(schema.audit_log.org_id, orgId));
    await db.delete(schema.modules).where(eq(schema.modules.org_id, orgId));
    await db.delete(schema.memberships).where(eq(schema.memberships.org_id, orgId));
}

export { DEFAULT_MODULE_ORDER as DEFAULT_ORG_MODULES } from './orgModules';
