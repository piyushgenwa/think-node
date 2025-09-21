'use client';

interface ToolbarProps {
  onSummarize: () => void;
  onExport: () => void;
  summarizing?: boolean;
}

export function Toolbar({ onSummarize, onExport, summarizing }: ToolbarProps) {
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-30 flex gap-3">
      <button
        onClick={onSummarize}
        disabled={summarizing}
        className="pointer-events-auto rounded-full bg-brand-500/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-brand-500/50"
      >
        {summarizing ? 'Summarizing…' : 'Summarize'}
      </button>
      <button
        onClick={onExport}
        className="pointer-events-auto rounded-full bg-slate-900/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 shadow-lg ring-1 ring-white/10 transition hover:bg-slate-800"
      >
        Export Markdown
      </button>
    </div>
  );
}
