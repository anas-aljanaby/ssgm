// Shared partner-evaluation score helpers for the Implementing Partners module.
// Scores use a 0–100 point system; the overall score is the average of the 7 criteria.

export interface EvaluationScores {
    // Commitment
    timeline: number;
    quality: number;
    // Cooperation
    communication: number;
    transparency: number;
    flexibility: number;
    // Efficiency
    budget: number;
    resources: number;
}

export interface PartnerEvaluation {
    id: string;
    reviewer: string;
    project: string;
    date: string; // ISO date
    scores: EvaluationScores;
    strengths: string;
    weaknesses: string;
    recommendations: string;
}

export const CRITERIA_KEYS: (keyof EvaluationScores)[] = [
    'timeline',
    'quality',
    'communication',
    'transparency',
    'flexibility',
    'budget',
    'resources',
];

/** Section → the criteria it groups, in display order. */
export const CRITERIA_GROUPS: { section: string; criteria: (keyof EvaluationScores)[] }[] = [
    { section: 'commitment', criteria: ['timeline', 'quality'] },
    { section: 'cooperation', criteria: ['communication', 'transparency', 'flexibility'] },
    { section: 'efficiency', criteria: ['budget', 'resources'] },
];

/** Overall score (0–100) — the average of the 7 criteria scores. */
export const deriveRating = (scores: EvaluationScores): number =>
    Math.round(CRITERIA_KEYS.reduce((sum, key) => sum + scores[key], 0) / CRITERIA_KEYS.length);

/** Average score per criterion across a set of evaluations (0–100). */
export const averageScores = (evaluations: { scores: EvaluationScores }[]): EvaluationScores => {
    const result = {} as EvaluationScores;
    CRITERIA_KEYS.forEach((key) => {
        result[key] = evaluations.length
            ? Math.round(evaluations.reduce((sum, e) => sum + e.scores[key], 0) / evaluations.length)
            : 0;
    });
    return result;
};

/** Map a 0–100 evaluation score to the partner's 5-star summary rating. */
export const scoreToStars = (score100: number): number => Math.round((score100 / 20) * 10) / 10;
