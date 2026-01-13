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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="w-full max-w-4xl space-y-6 relative z-10 py-10">
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
              <button
                onClick={handleSignOut}
                className="text-xs text-slate-500 hover:text-rose-400 font-mono transition-colors flex items-center gap-1"
              >
                <span>LOGOUT</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Control Panel - Glassmorphism Card */}
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
              {/* Status Messages for Instructions */}
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
                className={`relative group/btn px-6 py-2.5 font-semibold rounded-xl transition-all duration-300 ${isLoading || status === 'saving'
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

        {/* Active Channels Section */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-slate-950/50">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Active Channels</h2>
                  <p className="text-xs text-slate-500">Manage granted access nodes</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Add Channel Input */}
              <div className="flex gap-2">
                <div className="relative flex-1 group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                  <input
                    type="text"
                    value={newChannelInput}
                    onChange={(e) => setNewChannelInput(e.target.value)}
                    placeholder="Enter Discord Channel ID..."
                    className="relative w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-300 font-mono text-sm backdrop-blur-sm"
                  />
                </div>
                <button
                  onClick={addChannel}
                  disabled={channelStatus === 'adding' || !newChannelInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {channelStatus === 'adding' ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  Authorize
                </button>
              </div>

              {/* Channel List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="text-center py-4 text-slate-500 text-sm font-mono">Scanning network nodes...</div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-sm">No active channels found</p>
                  </div>
                ) : (
                  (channels || []).map((channel) => (
                    <div
                      key={channel.channel_id}
                      className="group flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 hover:border-emerald-500/30 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <span className="font-mono text-sm text-slate-300">{channel.channel_id}</span>
                      </div>
                      <button
                        onClick={() => removeChannel(channel.channel_id)}
                        disabled={channelStatus === 'removing'}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
                        title="Revoke Access"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Neural Link (Memory) Section */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-slate-950/50">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Neural Link</h2>
                  <p className="text-xs text-slate-500">Memory inspection and purge protocols</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Channel Selector */}
              <div className="relative group/select">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/30 to-orange-500/30 rounded-xl blur opacity-0 group-focus-within/select:opacity-100 transition-opacity duration-300" />
                <select
                  value={selectedChannelId}
                  onChange={(e) => {
                    setSelectedChannelId(e.target.value);
                    fetchLogs(e.target.value);
                  }}
                  className="relative w-full bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all duration-300 font-mono text-sm backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="">Select a neural pathway (Channel)...</option>
                  {channels.map(c => (
                    <option key={c.channel_id} value={c.channel_id}>{c.channel_id}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Log Viewer */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar font-mono text-xs space-y-3">
                {selectedChannelId ? (
                  isLoadingLogs ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      <span>Decryping memory banks...</span>
                    </div>
                  ) : chatLogs.length > 0 ? (
                    chatLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className={log.role === 'user' ? 'text-cyan-400' : 'text-emerald-400'}>
                          [{log.role.toUpperCase()}]:
                        </span>
                        <span className="text-slate-300">{log.content}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                      No memory fragments found in this sector.
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Select a channel to inspect neural logs.
                  </div>
                )}
              </div>

              {/* Purge Button */}
              <div className="flex justify-end">
                <button
                  onClick={purgeMemory}
                  disabled={!selectedChannelId || isPurging || chatLogs.length === 0}
                  className="px-4 py-2 bg-rose-900/50 hover:bg-rose-600/80 border border-rose-700/50 text-rose-200 hover:text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-rose-900/20 group/purge"
                >
                  {isPurging ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 group-hover/purge:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  Purge Memory
                </button>
              </div>
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
