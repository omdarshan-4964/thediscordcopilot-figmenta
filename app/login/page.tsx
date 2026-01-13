'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrorMsg(error.message);
            } else {
                router.push('/');
                router.refresh(); // Refresh to ensure middleware/server components update
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrorMsg('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            <div className="w-full max-w-md relative z-10">
                <div className="relative group">
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                        <div className="space-y-6 text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-2">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    Authenticate
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">Enter credentials to access Neural Link</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-slate-400 ml-1">IDENTITY (EMAIL)</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                                    placeholder="agent@figmenta.sys"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-slate-400 ml-1">PASSPHRASE</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-mono">
                                    ERROR: {errorMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? 'VERIFYING...' : 'INITIALIZE SESSION'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
