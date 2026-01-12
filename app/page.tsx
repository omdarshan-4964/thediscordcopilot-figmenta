'use client';

import { useState } from 'react';

export default function Home() {
  const [instructions, setInstructions] = useState('');

  const handleSave = () => {
    console.log('Saving instructions:', instructions);
    // Mock save functionality
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
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="You are a helpful Discord bot..."
            className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-neutral-200 placeholder-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg shadow-blue-900/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
