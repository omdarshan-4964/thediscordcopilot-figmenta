'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const { data, error } = await supabase
          .from('system_instructions')
          .select('content')
          .eq('id', 1)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setInstructions(data.content || '');
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  const handleSave = async () => {
    setStatus('saving');
    try {
      const { error } = await supabase
        .from('system_instructions')
        .update({ content: instructions })
        .eq('id', 1);

      if (error) {
        throw error;
      }

      setStatus('success');
      // Reset success message after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      setStatus('error');
    }
  };

  return (
    <main className="h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="w-full max-w-4xl space-y-4 relative z-10">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">System Online</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
                Figmenta Control Deck
              </h1>
              <p className="text-slate-400 text-sm">
                Neural Interface • AI Command Center
              </p>
            </div>
            
            {/* Status Badge */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                  <span className="text-xs font-mono text-cyan-400">CORE_ACTIVE</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">v2.0.26</span>
            </div>
          </div>
        </div>

        {/* Main Control Panel - Glassmorphism Card */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-slate-950/50">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">System Instructions</h2>
                  <p className="text-xs text-slate-500">Configure AI behavioral parameters</p>
                </div>
              </div>
              
              {/* Mini Status Lights */}
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              </div>
            </div>

            {/* Textarea Container */}
            <div className="relative">
              {isLoading ? (
                <div className="w-full h-52 bg-slate-950/50 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-slate-500 font-mono text-sm">Initializing neural link...</span>
                </div>
              ) : (
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                  <textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Initialize AI directive protocols..."
                    className="relative w-full h-52 bg-slate-950/80 border border-slate-700/50 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-300 resize-none font-mono text-sm leading-relaxed backdrop-blur-sm"
                  />
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Status Messages */}
              <div className="flex items-center gap-3 text-sm font-medium">
                {status === 'idle' && (
                  <span className="text-slate-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Ready for input
                  </span>
                )}
                {status === 'saving' && (
                  <span className="text-cyan-400 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Transmitting data...
                  </span>
                )}
                {status === 'success' && (
                  <span className="text-emerald-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Protocol updated successfully
                  </span>
                )}
                {status === 'error' && (
                  <span className="text-rose-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transmission failed
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleSave}
                disabled={isLoading || status === 'saving'}
                className={`relative group/btn px-6 py-2.5 font-semibold rounded-xl transition-all duration-300 ${
                  isLoading || status === 'saving'
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'text-white cursor-pointer'
                }`}
              >
                {!(isLoading || status === 'saving') && (
                  <>
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl blur-md opacity-70 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl" />
                  </>
                )}
                <span className="relative flex items-center gap-2">
                  {status === 'saving' ? (
                    'Processing...'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Deploy Changes
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex justify-center gap-8 text-xs text-slate-500 font-mono">
          <span>LATENCY: &lt;50ms</span>
          <span>•</span>
          <span>UPTIME: 99.9%</span>
          <span>•</span>
          <span>REGION: GLOBAL</span>
        </div>
      </div>
    </main>
  );
}
