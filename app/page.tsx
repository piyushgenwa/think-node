'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim()) {
      window.alert('Please enter a topic to explore.');
      return;
    }
    setLoading(true);
    const encoded = encodeURIComponent(topic.trim());
    router.push(`/graph?topic=${encoded}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl bg-slate-900/70 p-10 shadow-xl ring-1 ring-white/10">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Think Node</h1>
        <p className="mt-3 text-sm text-slate-300">
          Generate probing questions and structured thinking pathways for any topic.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Topic
          </label>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Launching an AI-driven product"
            className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-brand-500/60"
          >
            {loading ? 'Loading…' : 'Generate Questions'}
          </button>
        </form>
        <p className="mt-6 text-xs text-slate-500">
          Tip: Press <span className="font-semibold text-slate-300">G</span> on the canvas to regenerate the initial question set.
        </p>
      </div>
    </main>
  );
}
