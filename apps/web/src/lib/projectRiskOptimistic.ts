import type { Risk } from '../types';
import { createOptimisticId, isOptimisticId } from './optimisticSubmit';

export const OPTIMISTIC_PROJECT_RISK_PREFIX = 'optimistic-project-risk-';

export function isOptimisticProjectRisk(id: string): boolean {
  return isOptimisticId(id, OPTIMISTIC_PROJECT_RISK_PREFIX);
}

export function buildOptimisticProjectRisk(data: Omit<Risk, 'id'>): Risk {
  return {
    ...data,
    id: createOptimisticId(OPTIMISTIC_PROJECT_RISK_PREFIX),
  };
}

/** Newest-first: optimistic and API-created risks appear at the top of the register. */
export function prependProjectRisk(risks: Risk[], risk: Risk): Risk[] {
  return [risk, ...risks];
}
