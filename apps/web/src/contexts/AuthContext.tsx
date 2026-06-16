import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { api } from '../lib/api';

// export const DEMO_EMAIL = 'admin@admin.com';
// export const DEMO_PASSWORD = 'admin';

// const createDemoUser = (): User =>
//     ({
//         id: 'demo-admin-user',
//         email: DEMO_EMAIL,
//         aud: 'authenticated',
//         app_metadata: { provider: 'demo' },
//         user_metadata: { name: 'Demo Admin' },
//         created_at: new Date(0).toISOString(),
//     }) as User;

// const isDemoCredentials = (email: string, password: string) =>
//     email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isSupabaseConfigured: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const syncSession = (nextSession: Session | null) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        const token = nextSession?.access_token ?? null;
        api.setToken(token);
        if (token) {
            void queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            syncSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            syncSession(session);
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const signIn = async (email: string, password: string) => {
        // if (isDemoCredentials(email, password)) {
        //     setUser(createDemoUser());
        //     setSession(null);
        //     api.setToken(null);
        //     return { error: null };
        // }

        if (!isSupabaseConfigured || !supabase) {
            return {
                error: new Error(
                    'Supabase is not configured. Use demo sign-in (admin@admin.com / admin) or add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to apps/web/.env.',
                ),
            };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
    };

    const signUp = async (email: string, password: string) => {
        if (!isSupabaseConfigured || !supabase) {
            return {
                error: new Error(
                    'Account sign-up requires Supabase. Copy apps/web/.env.example to apps/web/.env and set your project URL and anon key.',
                ),
            };
        }

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

        if (supabase) {
            await supabase.auth.signOut();
        }
        api.setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                isSupabaseConfigured,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
