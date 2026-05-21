import type { Donor, DonorStageId, IndividualDonor } from '../types';

const VALID_PIPELINE_STAGES: DonorStageId[] = [
    'prospect',
    'researching',
    'contacted',
    'cultivating',
    'solicited',
    'pledged',
    'donated',
    'dormant',
];

const legacyStageMap: Record<string, DonorStageId> = {
    stewardship: 'donated',
};

export const resolvePipelineStage = (stage?: string): DonorStageId => {
    if (stage && VALID_PIPELINE_STAGES.includes(stage as DonorStageId)) {
        return stage as DonorStageId;
    }
    return legacyStageMap[String(stage)] || 'prospect';
};

export const individualDonorToKanbanDonor = (donor: IndividualDonor): Donor => {
    const stage = resolvePipelineStage(donor.relationshipStage);
    const relationshipHealth = donor.relationshipHealth || 'Moderate';

    return {
        id: donor.id,
        name: donor.fullName.en,
        email: donor.email,
        totalDonated: donor.totalDonations,
        donationCount: donor.donationsCount || 0,
        firstDonation: donor.donorSince,
        lastDonation: donor.lastDonationDate,
        country: donor.country,
        avatar: donor.avatar,
        stage,
        potentialGift: donor.potentialGift ?? donor.suggestedAskAmount ?? 0,
        suggestedAskAmount: donor.suggestedAskAmount,
        relationshipHealth,
        lastContact: donor.lastContactDate || donor.lastDonationDate || '',
        stageEnteredAt: donor.stageEnteredAt || donor.donorSince,
        assignedOwner: donor.assignedManager || 'Unassigned',
        donorType: donor.donorType,
        likelihood: donor.relationshipLikelihood,
        interestTags: donor.tags,
        tasks: donor.relationshipTasks || [],
        donorCategory: donor.donorCategory,
    };
};
