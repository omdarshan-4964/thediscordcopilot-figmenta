'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Active Channels State
  const [channels, setChannels] = useState<{ channel_id: string }[]>([]);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [channelStatus, setChannelStatus] = useState<'idle' | 'adding' | 'removing' | 'error'>('idle');

  // Memory Control State
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [chatLogs, setChatLogs] = useState<{ role: string, content: string }[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // RAG State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<{ type: 'info' | 'success' | 'error', msg: string }>({ type: 'info', msg: '' });

  const handleTrain = async () => {
    if (!uploadFile) return;
    setIsTraining(true);
    setTrainingStatus({ type: 'info', msg: 'Uploading and processing...' });

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Training failed');
      }

      setTrainingStatus({ type: 'success', msg: `Success! Vectors: ${data.embeddedChunks}` });
      setUploadFile(null);
      // Reset status after 3s
      setTimeout(() => setTrainingStatus({ type: 'info', msg: '' }), 3000);
    } catch (error: any) {
      console.error("Training error:", error);
      setTrainingStatus({ type: 'error', msg: error.message });
    } finally {
      setIsTraining(false);
    }
  };

  const fetchLogs = async (channelId: string) => {
    if (!channelId) {
      setChatLogs([]);
      return;
    }
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('role, content')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true }) // Viewing logs chronologically
        .limit(10);

      if (error) throw error;
      setChatLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const purgeMemory = async () => {
    if (!selectedChannelId) return;
    setIsPurging(true);
    try {
      const { error } = await supabase
        .from('chat_logs')
        .delete()
        .eq('channel_id', selectedChannelId);

      if (error) throw error;

      setChatLogs([]); // clear local logs
    } catch (error) {
      console.error("Error purging memory:", error);
    } finally {
      setIsPurging(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Instructions
      try {
        const { data: instructionsData, error: instructionsError } = await supabase
          .from('system_instructions')
          .select('content')
          .eq('id', 1)
          .single();

        if (instructionsError) {
          if (instructionsError.code !== 'PGRST116') {
            console.error('Error fetching instructions:', JSON.stringify(instructionsError, null, 2));
          }
        }

        if (instructionsData) {
          setInstructions(instructionsData.content || '');
        }
      } catch (err) {
        console.error('Unexpected error fetching instructions:', err);
      }

      // Fetch Channels
      try {
        const { data: channelsData, error: channelsError } = await supabase
          .from('allowed_channels')
          .select('channel_id')
          .order('created_at', { ascending: true });

        if (channelsError) {
          console.error('Error fetching channels:', JSON.stringify(channelsError, null, 2));
        } else if (channelsData) {
          setChannels(channelsData);
        }
      } catch (err) {
        console.error('Unexpected error fetching channels:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setStatus('saving');
    try {
      const { error } = await supabase
        .from('system_instructions')
        .update({ content: instructions })
        .eq('id', 1);

      if (error) throw error;

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving instructions:', JSON.stringify(error, null, 2));
      setStatus('error');
    }
  };

  const addChannel = async () => {
    if (!newChannelInput.trim()) return;
    setChannelStatus('adding');
    try {
      const { data, error } = await supabase
        .from('allowed_channels')
        .insert([{ channel_id: newChannelInput.trim() }])
        .select()
        .single();

      if (error) throw error;

      setChannels(prev => [...prev, data]);
      setNewChannelInput('');
      setChannelStatus('idle');
    } catch (error) {
      console.error('Error adding channel:', JSON.stringify(error, null, 2));
      setChannelStatus('error');
      setTimeout(() => setChannelStatus('idle'), 3000);
    }
  };

  const removeChannel = async (channelId: string) => {
    setChannelStatus('removing');
    try {
      const { error } = await supabase
        .from('allowed_channels')
        .delete()
        .eq('channel_id', channelId);

      if (error) throw error;

      setChannels(prev => prev.filter(c => c.channel_id !== channelId));
      setChannelStatus('idle');
    } catch (error) {
      console.error('Error removing channel:', JSON.stringify(error, null, 2));
      setChannelStatus('error');
      setTimeout(() => setChannelStatus('idle'), 3000);
    }
  };

  return (
    <main className="h-screen w-full bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-purple-900/20 to-transparent z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] z-0 pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="relative z-10 flex flex-col h-full w-full">

        {/* Header Section (Fixed Height) */}
        <header className="flex-none px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              FIGMENTA CONTROL DECK
            </h1>
            <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-500/80 tracking-widest uppercase">
              <span>System.v.1.0</span>
              <span className="w-1 h-1 rounded-full bg-cyan-500/50" />
              <span>Neural Interface Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Indicators */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              SECURE
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 text-[10px] text-slate-500 hover:text-rose-400 font-mono transition-colors flex items-center gap-1 group"
            >
              <span>[LOGOUT]</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 (Span 2): System Instructions */}
            <section className="lg:col-span-2 flex flex-col">
              <div className="relative group bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden flex flex-col min-h-[450px]">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-500/10 blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-500/10 blur-3xl -z-10" />

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    SYSTEM INSTRUCTIONS
                  </h2>
                  <div className="text-[10px] font-mono text-slate-500 border border-white/5 px-2 py-1 rounded bg-black/20">
                    ID: SYS_CORE_01
                  </div>
                </div>

                <div className="flex-grow flex flex-col relative z-20">
                  {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-cyan-500/50">
                      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                      <span className="font-mono text-xs animate-pulse">ESTABLISHING UPLINK...</span>
                    </div>
                  ) : (
                    <textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="// Awaiting behavioral directive input..."
                      className="w-full flex-1 bg-black/40 border border-white/5 rounded-xl p-4 text-slate-300 placeholder-slate-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40 outline-none transition-all duration-300 resize-none font-mono text-sm leading-relaxed"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    {status === 'idle' && <span className="text-slate-500">STATUS: READY</span>}
                    {status === 'saving' && <span className="text-cyan-400 animate-pulse">STATUS: UPLOADING...</span>}
                    {status === 'success' && <span className="text-emerald-400">STATUS: SYNC_COMPLETE</span>}
                    {status === 'error' && <span className="text-rose-400">STATUS: UPLOAD_FAILED</span>}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || status === 'saving'}
                    className={`group relative px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold tracking-wider rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {status === 'saving' ? 'PROCESSING...' : 'DEPLOY PROTOCOL'}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Column 2 (Span 1): Stack */}
            <div className="flex flex-col gap-6">
              {/* Active Channels */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-300 flex flex-col h-full max-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    ACTIVE CHANNELS
                  </h2>
                </div>

                <div className="flex gap-2 mb-4 shrink-0">
                  <input
                    type="text"
                    value={newChannelInput}
                    onChange={(e) => setNewChannelInput(e.target.value)}
                    placeholder="CHANNEL_ID"
                    className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-emerald-500/40 outline-none w-full"
                  />
                  <button
                    onClick={addChannel}
                    disabled={channelStatus === 'adding' || !newChannelInput.trim()}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 bg-black/20 rounded-xl p-2 border border-white/5">
                  {isLoading ? (
                    <div className="text-center text-[10px] text-slate-600 font-mono py-4">SCANNING...</div>
                  ) : channels.length === 0 ? (
                    <div className="text-center text-[10px] text-slate-600 font-mono py-4">NO_NODES_FOUND</div>
                  ) : (
                    channels.map(channel => (
                      <div key={channel.channel_id} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-emerald-500/30 group">
                        <span className="text-[10px] font-mono text-slate-300 truncate max-w-[120px]" title={channel.channel_id}>{channel.channel_id}</span>
                        <button onClick={() => removeChannel(channel.channel_id)} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-300 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    KNOWLEDGE BASE
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="block w-full group cursor-pointer">
                    <div className="flex items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-white/10 bg-black/20 group-hover:border-purple-500/40 group-hover:bg-purple-500/5 transition-all">
                      <div className="flex flex-col items-center justify-center py-2">
                        {uploadFile ? (
                          <p className="text-xs text-purple-400 font-mono truncate max-w-[200px]">{uploadFile.name}</p>
                        ) : (
                          <>
                            <svg className="w-6 h-6 mb-1 text-slate-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="text-[10px] text-slate-500 font-mono">UPLOAD PDF_DATA</p>
                          </>
                        )}
                      </div>
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </label>

                  {trainingStatus.msg && (
                    <div className={`text-[10px] font-mono p-2 rounded border ${trainingStatus.type === 'error' ? 'border-rose-900/50 bg-rose-900/20 text-rose-400' : 'border-emerald-900/50 bg-emerald-900/20 text-emerald-400'}`}>
                      {'>'} {trainingStatus.msg}
                    </div>
                  )}

                  <button
                    onClick={handleTrain}
                    disabled={!uploadFile || isTraining}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold tracking-wider rounded-lg transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                  >
                    {isTraining ? 'INGESTING...' : 'INITIATE TRAINING'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row (Span 3): Neural Link */}
            <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  NEURAL LINK // MEMORY DUMP
                </h2>
                <div className="flex gap-4">
                  <select
                    value={selectedChannelId}
                    onChange={(e) => {
                      setSelectedChannelId(e.target.value);
                      fetchLogs(e.target.value);
                    }}
                    className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-rose-500/40 outline-none min-w-[200px]"
                  >
                    <option value="">SELECT_MEMORY_SECTOR</option>
                    {channels.map(c => (
                      <option key={c.channel_id} value={c.channel_id}>{c.channel_id}</option>
                    ))}
                  </select>
                  <button
                    onClick={purgeMemory}
                    disabled={!selectedChannelId || isPurging || chatLogs.length === 0}
                    className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-lg transition-all disabled:opacity-30 flex items-center gap-2"
                  >
                    {isPurging ? 'PURGING...' : 'PURGE_SECTOR'}
                  </button>
                </div>
              </div>

              <div className="h-48 bg-black/60 border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar font-mono text-xs">
                {selectedChannelId ? (
                  isLoadingLogs ? (
                    <div className="h-full flex items-center justify-center text-rose-500/50 animate-pulse">DECRYPTING...</div>
                  ) : chatLogs.length > 0 ? (
                    <div className="space-y-2">
                      {chatLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          <span className={`shrink-0 ${log.role === 'user' ? 'text-cyan-400' : 'text-emerald-400'} font-bold w-14`}>
                            {log.role.toUpperCase()}::
                          </span>
                          <span className="text-slate-300 break-words">{log.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-700">MEMORY_SECTOR_EMPTY</div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-700">AWAITING_SECTOR_SELECTION</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
