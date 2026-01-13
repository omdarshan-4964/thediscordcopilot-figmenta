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
        <main className="h-screen w-full bg-black text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Effects matching Dashboard */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-purple-900/20 to-transparent z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] z-0 pointer-events-none" />

            {/* Login Card */}
            <div className="w-full max-w-sm relative z-10">
                <div className="relative group">
                    {/* Ambient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl hover:border-cyan-500/30 transition-all duration-300">
                        {/* Header */}
                        <div className="text-center mb-10 space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
                                FIGMENTA ACCESS
                            </h1>
                            <p className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest border border-cyan-500/10 rounded-full py-0.5 px-3 inline-block bg-cyan-900/10">
                                Identity Verification Protocol
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono text-slate-500 ml-1 uppercase tracking-wider">Agent Identity (Email)</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="relative w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-3 text-cyan-400 placeholder-slate-700 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm shadow-inner"
                                        placeholder="USR-ID@FIGMENTA.SYS"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono text-slate-500 ml-1 uppercase tracking-wider">Security Passphrase</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="relative w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-3 text-cyan-400 placeholder-slate-700 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm shadow-inner"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded-lg text-rose-400 text-xs text-center font-mono flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    ACCESS_DENIED: {errorMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 transform active:scale-[0.98] duration-100"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2 font-mono text-xs">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        VERIFYING_CREDENTIALS...
                                    </span>
                                ) : (
                                    'INITIATE UPLINK'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-8 text-center space-y-1 opacity-40">
                    <p className="text-[9px] font-mono text-slate-500">FIGMENTA SECURE GATEWAY v2.4.0</p>
                    <p className="text-[9px] font-mono text-slate-600">UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE</p>
                </div>
            </div>
        </main>
    );
}
