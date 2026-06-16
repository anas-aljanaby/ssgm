import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { signIn, signUp, isSupabaseConfigured } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const action = isSignUp ? signUp : signIn;
        const { error } = await action(email, password);

        if (error) {
            setError(error.message);
        } else if (isSignUp) {
            setMessage('Check your email for the confirmation link.');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background dark:bg-dark-background">
            <div className="w-full max-w-md rounded-xl bg-card dark:bg-dark-card p-8 shadow-lg">
                <h1 className="mb-6 text-center text-2xl font-bold text-foreground dark:text-dark-foreground">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                </h1>

                {!isSupabaseConfigured && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                        <p className="font-semibold">Supabase is not configured</p>
                        <p className="mt-1 text-amber-800 dark:text-amber-200">
                            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to apps/web/.env.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-muted dark:text-dark-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background px-4 py-2 text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-muted dark:text-dark-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background px-4 py-2 text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {message && <p className="text-sm text-green-500">{message}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                    className="mt-4 w-full text-center text-sm text-primary hover:underline"
                >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
