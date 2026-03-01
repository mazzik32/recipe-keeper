import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    initialized: boolean;
    signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    initialized: false,
    signOut: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return;

            if (!session) {
                // If no session exists on startup, request an anonymous session via Edge Function
                const { data, error } = await supabase.functions.invoke('create-anonymous-session');

                if (error || !data?.session) {
                    console.error('Failed to sign in anonymously during startup:', error || data?.error);

                    // Specific handling for rate limiting
                    if (data?.error?.includes('limit reached')) {
                        console.warn("Anonymous rate limit reached.");
                    }

                    setSession(null);
                    setUser(null);
                    setInitialized(true);
                } else {
                    // Manually set the session retrieved from the Edge Function
                    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                    });

                    if (setSessionError) {
                        console.error('Failed to set retrieved anonymous session:', setSessionError);
                    } else {
                        setSession(setSessionData.session);
                        setUser(setSessionData.user);
                    }
                    setInitialized(true);
                }
            } else {
                setSession(session);
                setUser(session?.user ?? null);
                setInitialized(true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, initialized, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
