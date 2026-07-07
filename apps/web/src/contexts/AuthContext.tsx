import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { api } from '../lib/api';

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

        let cancelled = false;

        const initSession = async () => {
            const SESSION_INIT_TIMEOUT_MS = 10_000;

            try {
                const result = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Session init timed out')), SESSION_INIT_TIMEOUT_MS),
                    ),
                ]);

                if (cancelled) return;

                const { data: { session }, error } = result;
                if (error) throw error;
                syncSession(session);
            } catch (err) {
                if (cancelled) return;
                console.warn('Failed to restore auth session:', err);
                try {
                    await supabase.auth.signOut({ scope: 'local' });
                } catch {
                    // ignore — local cleanup is best-effort when Supabase is unreachable
                }
                syncSession(null);
            } finally {
                setLoading(false);
            }
        };

        void initSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            syncSession(session);
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, [queryClient]);

    const signIn = async (email: string, password: string) => {
        if (!isSupabaseConfigured || !supabase) {
            return {
                error: new Error(
                    'Supabase is not configured. add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to apps/web/.env.',
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
