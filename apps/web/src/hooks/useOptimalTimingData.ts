import { useState, useEffect, useCallback } from 'react';
import type { IndividualDonor } from '../types';
import { MOCK_INDIVIDUAL_DONORS } from '../data/individualDonorsData';
import { MOCK_DONATIONS } from '../data/donationsData';
import { MOCK_COMMUNICATIONS } from '../data/communicationsData';
import { analyzeDonorTiming } from '../lib/timingAnalysis';

// In a real app, this would be persisted differently (e.g., in a DB, not just localStorage)
const LOCAL_STORAGE_KEY = 'mss2-erp-timing-data';
const LAST_ANALYSIS_KEY = 'mss2-erp-timing-last-analysis';

const getInitialState = (): IndividualDonor[] => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : MOCK_INDIVIDUAL_DONORS;
  } catch (error) {
    console.error("Failed to load timing data from localStorage:", error);
    return MOCK_INDIVIDUAL_DONORS;
  }
};

export const useOptimalTimingData = () => {
    const [donors, setDonors] = useState<IndividualDonor[]>(getInitialState());
    const [isLoading, setIsLoading] = useState(true);

    const runFullAnalysis = useCallback(() => {
        console.log("Running full donor timing analysis...");
        setIsLoading(true);
        // Simulate async operation
        setTimeout(() => {
            const analyzedDonors = donors.map(donor => {
                if (donor.status === 'Active' || donor.status === 'Lapsed') {
                     return analyzeDonorTiming(donor, MOCK_DONATIONS, MOCK_COMMUNICATIONS);
                }
                return donor;
            });
            setDonors(analyzedDonors);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(analyzedDonors));
            localStorage.setItem(LAST_ANALYSIS_KEY, new Date().toISOString());
            setIsLoading(false);
            console.log("Analysis complete.");
        }, 1000);
    }, [donors]);

    // Simulate daily scheduled task
    useEffect(() => {
        const lastAnalysis = localStorage.getItem(LAST_ANALYSIS_KEY);
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastAnalysis || (now.getTime() - new Date(lastAnalysis).getTime()) > oneDay) {
            runFullAnalysis();
        } else {
            setIsLoading(false);
        }

        // This is a rough simulation for demo purposes. A real app would use a server-side cron job.
        const interval = setInterval(() => {
            console.log("Daily analysis check...");
            runFullAnalysis();
        }, oneDay);

        return () => clearInterval(interval);
    }, []); // Run only once on mount

    return {
        donors,
        isLoading,
        runFullAnalysis,
    };
};
