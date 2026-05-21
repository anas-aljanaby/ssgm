import { useDonors } from './useDonors';

export const useDonorIntelligenceData = () => {
    const { data, isLoading, refetch, isError, error } = useDonors();

    return {
        donors: data || [],
        isLoading,
        isError,
        error,
        updateClassifications: refetch,
    };
};
