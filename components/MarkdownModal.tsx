'use client';

import { useEffect } from 'react';

interface MarkdownModalProps {
  open: boolean;
  content: string;
  onClose: () => void;
}

export function MarkdownModal({ open, content, onClose }: MarkdownModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      window.alert('Summary copied to clipboard.');
    } catch (error) {
      console.error(error);
      window.alert('Unable to copy summary.');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Executive Summary</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-700"
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-400"
            >
              Close
            </button>
          </div>
        </div>
        <div className="mt-5 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {content}
        </div>
      </div>
    </div>
  );
}
