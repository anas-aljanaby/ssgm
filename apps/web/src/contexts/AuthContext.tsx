import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const DEMO_USERNAME = 'admin@admin.com';
const DEMO_PASSWORD = 'admin';

const createDemoUser = () =>
    ({
        id: 'demo-admin-user',
        email: `${DEMO_USERNAME}@local.demo`,
        aud: 'authenticated',
        app_metadata: { provider: 'demo' },
        user_metadata: { name: 'Demo Admin' },
        created_at: new Date(0).toISOString(),
    } as User);

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                api.setToken(session.access_token);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            api.setToken(session?.access_token ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (email.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
            setUser(createDemoUser());
            setSession(null);
            api.setToken(null);
            return { error: null };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error ? new Error(error.message) : null };
    };

    const signOut = async () => {
        if (user?.id === 'demo-admin-user') {
            setUser(null);
            setSession(null);
            api.setToken(null);
            return;
        }

        await supabase.auth.signOut();
        api.setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
