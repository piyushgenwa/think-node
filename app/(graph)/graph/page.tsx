'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReactFlowProvider } from 'reactflow';
import { GraphCanvas } from '@/components/GraphCanvas';
import { Toolbar } from '@/components/Toolbar';
import { InspectorDrawer } from '@/components/InspectorDrawer';
import { MarkdownModal } from '@/components/MarkdownModal';
import { useGraphStore } from '@/lib/state';
import { toMarkdown } from '@/lib/export';
import { GraphNode, QuestionNode } from '@/lib/types';

interface ExpandResponse {
  rank: number;
  question: string;
  why: string;
  category: string;
}

function GraphPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const graph = useGraphStore((state) => state.graph);
  const initializeGraph = useGraphStore((state) => state.initializeGraph);
  const seedFromThemes = useGraphStore((state) => state.seedFromThemes);
  const markExpanded = useGraphStore((state) => state.markExpanded);
  const addChildren = useGraphStore((state) => state.addChildren);
  const upsertAnswer = useGraphStore((state) => state.upsertAnswer);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const inspectorOpen = useGraphStore((state) => state.inspectorOpen);
  const setInspectorOpen = useGraphStore((state) => state.setInspectorOpen);
  const updateNodeTitle = useGraphStore((state) => state.updateNodeTitle);
  const togglePinned = useGraphStore((state) => state.togglePinned);
  const toggleHidden = useGraphStore((state) => state.toggleHidden);
  const selectedNode = useMemo<GraphNode | undefined>(() =>
    graph?.nodes.find((node) => node.id === selectedNodeId),
  [graph, selectedNodeId]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [expandLoading, setExpandLoading] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummarizing, setSummarizing] = useState(false);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!topic) {
      router.replace('/');
    }
  }, [router, topic]);

  useEffect(() => {
    if (!topic) return;
    initializeGraph(topic);
    hasSeededRef.current = false;
  }, [initializeGraph, topic]);

  const handleGenerate = useCallback(async () => {
    if (!topic) return;
    if (loadingInitial) return;
    setLoadingInitial(true);
    try {
      const response = await fetch('/api/graphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      const data = await response.json();
      seedFromThemes(data.themes);
      hasSeededRef.current = true;
    } catch (error) {
      console.error(error);
      window.alert('Unable to generate starter questions right now.');
    } finally {
      setLoadingInitial(false);
    }
  }, [topic, seedFromThemes, loadingInitial]);

  useEffect(() => {
    if (topic && !hasSeededRef.current) {
      handleGenerate();
    }
  }, [topic, handleGenerate]);

  const handleExpand = useCallback(async (node: QuestionNode) => {
    if (!node || node.depth >= 2) return;
    if (node.expanded) {
      window.alert('This question is already expanded.');
      return;
    }
    setExpandLoading(node.id);
    try {
      const response = await fetch(`/api/nodes/${node.id}/expand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentTitle: node.title })
      });
      if (!response.ok) {
        throw new Error('Failed to expand question');
      }
      const data: ExpandResponse[] = await response.json();
      addChildren(node.id, data);
      markExpanded(node.id);
    } catch (error) {
      console.error(error);
      window.alert('Unable to expand this question right now.');
    } finally {
      setExpandLoading(null);
    }
  }, [addChildren, markExpanded]);

  const handleDraftAnswer = useCallback(async (question: QuestionNode) => {
    try {
      const response = await fetch(`/api/nodes/${question.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.title })
      });
      if (!response.ok) {
        throw new Error('Failed to draft answer');
      }
      const data = await response.json();
      upsertAnswer(question.id, data);
    } catch (error) {
      console.error(error);
      window.alert('Unable to draft an answer right now.');
    }
  }, [upsertAnswer]);

  const handleSummarize = useCallback(async () => {
    if (!graph) return;
    setSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
      });
      if (!response.ok) {
        throw new Error('Failed to summarize');
      }
      const data = await response.json();
      setSummaryContent(data.summaryMarkdown);
      setSummaryOpen(true);
    } catch (error) {
      console.error(error);
      window.alert('Unable to summarize right now.');
    } finally {
      setSummarizing(false);
    }
  }, [graph]);

  const handleExport = useCallback(() => {
    if (!graph) return;
    const markdown = toMarkdown(graph);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${graph.nodes.find((node) => node.id === graph.rootId)?.title ?? 'graph'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [graph]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if ((target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        handleGenerate();
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSummarize();
      }
      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        if (selectedNode && selectedNode.type === 'question') {
          handleExpand(selectedNode as QuestionNode);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate, handleSummarize, handleExpand, selectedNode]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        <Toolbar onSummarize={handleSummarize} onExport={handleExport} summarizing={isSummarizing} />
        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex-1">
            {loadingInitial && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 text-sm text-slate-300">
                Generating questions…
              </div>
            )}
            <GraphCanvas onExpand={handleExpand} expandLoadingId={expandLoading} />
          </div>
          <InspectorDrawer
            open={inspectorOpen}
            node={selectedNode?.type === 'question' ? (selectedNode as QuestionNode) : selectedNode}
            onClose={() => setInspectorOpen(false)}
            onTitleChange={(id, title) => updateNodeTitle(id, title)}
            onDraftAnswer={handleDraftAnswer}
            onTogglePin={(id) => togglePinned(id)}
            onToggleHidden={(id) => toggleHidden(id)}
          />
        </div>
        <MarkdownModal
          open={summaryOpen}
          content={summaryContent}
          onClose={() => setSummaryOpen(false)}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default function GraphPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading thinking canvas…
      </div>
    }>
      <GraphPageContent />
    </Suspense>
  );
}
