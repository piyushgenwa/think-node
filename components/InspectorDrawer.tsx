'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'classnames';
import { useGraphStore } from '@/lib/state';
import { AnswerNode, GraphNode, QuestionNode } from '@/lib/types';

interface InspectorDrawerProps {
  open: boolean;
  node?: GraphNode;
  onClose: () => void;
  onTitleChange: (id: string, title: string) => void;
  onDraftAnswer: (node: QuestionNode) => void;
  onTogglePin: (id: string) => void;
  onToggleHidden: (id: string) => void;
}

export function InspectorDrawer({
  open,
  node,
  onClose,
  onTitleChange,
  onDraftAnswer,
  onTogglePin,
  onToggleHidden
}: InspectorDrawerProps) {
  const [draftTitle, setDraftTitle] = useState(node?.title ?? '');
  const graph = useGraphStore((state) => state.graph);

  useEffect(() => {
    setDraftTitle(node?.title ?? '');
  }, [node?.id, node?.title]);

  const answerNode = useMemo<AnswerNode | undefined>(() => {
    if (!graph || !node || node.type !== 'question') return undefined;
    const edge = graph.edges.find((item) => item.sourceId === node.id && item.relation === 'answers');
    if (!edge) return undefined;
    const target = graph.nodes.find((item) => item.id === edge.targetId);
    return target && target.type === 'answer' ? (target as AnswerNode) : undefined;
  }, [graph, node]);

  const handleTitleBlur = () => {
    if (node && draftTitle.trim() && draftTitle !== node.title) {
      onTitleChange(node.id, draftTitle.trim());
    }
  };

  const metaRows: { label: string; value: string }[] = [];
  if (node) {
    metaRows.push({ label: 'Type', value: node.type });
    metaRows.push({ label: 'Depth', value: String(node.depth) });
    metaRows.push({ label: 'Author', value: node.author });
    metaRows.push({ label: 'Updated', value: new Date(node.updatedAt).toLocaleString() });
    if ('framing' in node && node.framing) {
      metaRows.push({ label: 'Framing', value: node.framing });
    }
    if ('priority' in node && typeof node.priority === 'number') {
      metaRows.push({ label: 'Priority', value: `#${node.priority}` });
    }
  }

  return (
    <div
      className={clsx(
        'pointer-events-none fixed inset-y-0 right-0 z-30 flex w-96 max-w-full flex-col border-l border-slate-800 bg-slate-950/95 text-sm text-white shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="pointer-events-auto flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <button
          onClick={onClose}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 hover:bg-slate-800"
        >
          Close
        </button>
      </div>
      {node ? (
        <div className="pointer-events-auto flex-1 overflow-y-auto px-6 py-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title</label>
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleTitleBlur();
              }
            }}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <div className="mt-6 space-y-3">
            {metaRows.map((row) => (
              <div key={row.label} className="flex justify-between text-xs text-slate-300">
                <span className="font-semibold uppercase tracking-wide text-slate-500">{row.label}</span>
                <span className="text-right text-slate-200">{row.value}</span>
              </div>
            ))}
          </div>
          {node.type === 'question' && (
            <div className="mt-8 space-y-3">
              <button
                onClick={() => onDraftAnswer(node as QuestionNode)}
                className="w-full rounded-2xl bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-400"
              >
                Draft Answer
              </button>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Pin Node</span>
                <button
                  onClick={() => onTogglePin(node.id)}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold uppercase tracking-wide',
                    node.pinned
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  )}
                >
                  {node.pinned ? 'Pinned' : 'Pin'}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{node.hidden ? 'Hidden' : 'Hide Node'}</span>
                <button
                  onClick={() => onToggleHidden(node.id)}
                  className={clsx(
                    'rounded-full px-3 py-1 font-semibold uppercase tracking-wide',
                    node.hidden
                      ? 'bg-rose-500/20 text-rose-200'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  )}
                >
                  {node.hidden ? 'Hidden' : 'Hide'}
                </button>
              </div>
            </div>
          )}
          {answerNode && (
            <div className="mt-10 rounded-2xl border border-emerald-600/50 bg-emerald-950/40 p-4 text-emerald-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Draft Answer</h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">{answerNode.content}</p>
              <p className="mt-4 text-xs text-emerald-200">Confidence: {(answerNode.confidence * 100).toFixed(0)}%</p>
              {answerNode.assumptions.length > 0 && (
                <div className="mt-3 text-xs">
                  <p className="font-semibold uppercase tracking-wide text-emerald-200">Assumptions</p>
                  <ul className="mt-1 space-y-1 list-disc pl-4">
                    {answerNode.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 text-xs">
                <p className="font-semibold uppercase tracking-wide text-emerald-200">Next Step</p>
                <p className="mt-1 text-emerald-100/90">{answerNode.nextStep}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pointer-events-auto flex flex-1 items-center justify-center text-xs text-slate-500">
          Select a node to inspect details.
        </div>
      )}
    </div>
  );
}
