'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'classnames';
import { GraphNode, QuestionNode } from '@/lib/types';

interface NodeData {
  node: GraphNode;
  onExpand?: (node: QuestionNode) => void;
  expandLoadingId: string | null;
}

const typeStyles: Record<string, string> = {
  topic: 'bg-brand-500/90 text-white',
  question: 'bg-slate-900/90 text-white border border-slate-700',
  answer: 'bg-emerald-900/80 text-emerald-100 border border-emerald-600/60',
  insight: 'bg-indigo-900/70 text-indigo-100',
  decision: 'bg-amber-900/70 text-amber-100',
  reference: 'bg-slate-800/70 text-slate-100'
};

const labelMap: Record<string, string> = {
  topic: 'Topic',
  question: 'Question',
  answer: 'Answer',
  insight: 'Insight',
  decision: 'Decision',
  reference: 'Reference'
};

function formatDepth(depth?: number) {
  if (depth === undefined) return '';
  if (depth === 0) return 'Root';
  return `Depth ${depth}`;
}

function NodeCardComponent({ data, selected }: NodeProps<NodeData>) {
  const node = data.node;
  const isQuestion = node.type === 'question';
  const canExpand = isQuestion && node.depth < 2 && !node.expanded;
  const isLoadingExpand = data.expandLoadingId === node.id;

  return (
    <div
      className={clsx(
        'min-w-[220px] max-w-[260px] rounded-2xl border px-4 py-3 shadow-lg transition ring-1 ring-white/5',
        typeStyles[node.type] ?? 'bg-slate-800/80 text-white',
        selected ? 'ring-2 ring-brand-300' : 'ring-1'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            {labelMap[node.type] ?? node.type}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-white">
            {node.title}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70">
          {formatDepth(node.depth)}
        </span>
      </div>
      {node.content && node.type !== 'answer' && (
        <p className="mt-2 max-h-20 overflow-hidden text-ellipsis text-xs text-white/70">
          {node.content}
        </p>
      )}
      {node.type === 'answer' && 'assumptions' in node && (
        <div className="mt-2 space-y-2 text-xs text-emerald-100/90">
          <p className="font-medium leading-snug">{node.content}</p>
          <p>Confidence: {(node.confidence * 100).toFixed(0)}%</p>
        </div>
      )}
      {node.type === 'topic' && (
        <Handle
          type="source"
          id="topic-out"
          position={Position.Bottom}
          className="!h-3 !w-3 !rounded-full !border-none !bg-brand-200"
        />
      )}
      {isQuestion && (
        <>
          <Handle
            type="target"
            id="incoming"
            position={node.depth <= 1 ? Position.Top : Position.Left}
            className="!h-3 !w-3 !rounded-full !border-none !bg-white/70"
          />
          <Handle
            type="source"
            id="expand"
            position={Position.Right}
            className="!h-3 !w-3 !rounded-full !border-none !bg-brand-200"
          />
          <Handle
            type="source"
            id="answer"
            position={Position.Bottom}
            className="!h-3 !w-3 !rounded-full !border-none !bg-emerald-300"
          />
        </>
      )}
      {node.type === 'answer' && (
        <Handle
          type="target"
          id="incoming"
          position={Position.Top}
          className="!h-3 !w-3 !rounded-full !border-none !bg-emerald-200"
        />
      )}
      {isQuestion && (
        <div className="mt-3 flex items-center justify-between text-[10px] text-white/70">
          <span>{node.pinned ? 'Pinned' : ''}</span>
          <button
            className="rounded-full bg-white/10 px-3 py-1 font-semibold uppercase tracking-wide text-[10px] text-white hover:bg-white/20 disabled:opacity-50"
            disabled={!canExpand || isLoadingExpand}
            onClick={() => data.onExpand?.(node)}
          >
            {isLoadingExpand ? 'Expanding…' : node.expanded ? 'Expanded' : 'Expand'}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(NodeCardComponent);
