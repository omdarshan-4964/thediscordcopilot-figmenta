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
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-400 bg-clip-text text-transparent">
            Discord Copilot
          </h1>
          <p className="text-neutral-400">
            Configure your bot's system instructions below.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <label htmlFor="instructions" className="block text-sm font-medium text-neutral-300 mb-2">
            System Instructions
          </label>

          {isLoading ? (
            <div className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex items-center justify-center text-neutral-500">
              Loading...
            </div>
          ) : (
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are a helpful Discord bot..."
              className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-neutral-200 placeholder-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          )}

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm">
              {status === 'saving' && <span className="text-blue-400">Saving...</span>}
              {status === 'success' && <span className="text-green-400">Saved successfully!</span>}
              {status === 'error' && <span className="text-red-400">Error saving changes.</span>}
            </div>
            <button
              onClick={handleSave}
              disabled={isLoading || status === 'saving'}
              className={`px-6 py-2.5 font-medium rounded-lg transition-colors duration-200 shadow-lg ${isLoading || status === 'saving'
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                }`}
            >
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
