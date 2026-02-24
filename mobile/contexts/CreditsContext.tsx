import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CreditsContextType {
    /** Current credit balance */
    credits: number;
    /** Re-fetch credit balance from Supabase */
    refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
    credits: 0,
    refreshCredits: async () => { },
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);

    // Fetch credits from Supabase
    const refreshCredits = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (data) {
            setCredits(data.credits ?? 0);
        }
    }, [user]);

    // Fetch credits when user changes
    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    return (
        <CreditsContext.Provider
            value={{
                credits,
                refreshCredits,
            }}
        >
            {children}
        </CreditsContext.Provider>
    );
}

export const useCredits = () => useContext(CreditsContext);
