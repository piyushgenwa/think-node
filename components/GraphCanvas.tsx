'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge as FlowEdge,
  MarkerType,
  MiniMap,
  Node as FlowNode,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '@/lib/state';
import { GraphNode, QuestionNode } from '@/lib/types';
import NodeCard from './NodeCard';

type NodeData = {
  node: GraphNode;
  onExpand?: (node: QuestionNode) => void;
  expandLoadingId: string | null;
};

const nodeTypes = {
  card: NodeCard
};

interface GraphCanvasProps {
  onExpand: (node: QuestionNode) => void;
  expandLoadingId: string | null;
}

export function GraphCanvas({ onExpand, expandLoadingId }: GraphCanvasProps) {
  const graph = useGraphStore((state) => state.graph);
  const positions = useGraphStore((state) => state.positions);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const setInspectorOpen = useGraphStore((state) => state.setInspectorOpen);

  const nodes: FlowNode<NodeData>[] = useMemo(() => {
    if (!graph) return [];
    return graph.nodes
      .filter((node) => !node.hidden)
      .map((node) => {
        const position = positions[node.id] ?? { x: 0, y: 0 };
        const data: NodeData = {
          node,
          onExpand,
          expandLoadingId
        };
        const base = {
          id: node.id,
          type: 'card' as const,
          data,
          position,
          draggable: node.type !== 'topic'
        };
        switch (node.type) {
          case 'topic':
            return {
              ...base,
              sourcePosition: Position.Bottom
            };
          case 'question':
            return {
              ...base,
              sourcePosition: node.depth <= 1 ? Position.Right : Position.Bottom,
              targetPosition: node.depth === 1 ? Position.Top : Position.Left
            };
          case 'answer':
            return {
              ...base,
              targetPosition: Position.Top
            };
          default:
            return base;
        }
      });
  }, [graph, positions, onExpand, expandLoadingId]);

  const edges: FlowEdge[] = useMemo(() => {
    if (!graph) return [];
    return graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.relation,
      type: 'smoothstep',
      animated: edge.relation === 'expands',
      markerEnd: {
        type: MarkerType.ArrowClosed
      }
    }));
  }, [graph]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        onNodeClick={(_, node) => {
          setSelectedNode(node.id);
          setInspectorOpen(true);
        }}
        onPaneClick={() => {
          setSelectedNode(undefined);
          setInspectorOpen(false);
        }}
        onSelectionChange={(params) => {
          const first = params?.nodes?.[0];
          setSelectedNode(first?.id);
          if (first) {
            setInspectorOpen(true);
          }
        }}
        panOnScroll
        minZoom={0.2}
        maxZoom={1.5}
      >
        <MiniMap pannable zoomable className="!bg-slate-900/80 !text-slate-100" />
        <Controls className="!bg-slate-900/90 !text-slate-100" />
        <Background color="#1f2937" gap={24} />
      </ReactFlow>
    </div>
  );
}
