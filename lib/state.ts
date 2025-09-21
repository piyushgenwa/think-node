'use client';

import { create } from 'zustand';
import { AnswerSuggestion, ExpansionSuggestion, Graph, GraphNode, QuestionNode, ThemeSuggestion, TopicNode } from '@/lib/types';

interface GraphStoreState {
  graph: Graph | null;
  positions: Record<string, { x: number; y: number }>;
  selectedNodeId?: string;
  inspectorOpen: boolean;
  initializeGraph: (topic: string) => void;
  seedFromThemes: (themes: ThemeSuggestion[]) => void;
  addChildren: (parentId: string, expansions: ExpansionSuggestion[]) => void;
  markExpanded: (nodeId: string) => void;
  upsertAnswer: (questionId: string, suggestion: AnswerSuggestion) => void;
  updateNodeTitle: (nodeId: string, title: string) => void;
  togglePinned: (nodeId: string) => void;
  toggleHidden: (nodeId: string) => void;
  setSelectedNode: (nodeId?: string) => void;
  setInspectorOpen: (open: boolean) => void;
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
}

let idCounter = 0;
const nextId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

function layoutChildren(graph: Graph, positions: Record<string, { x: number; y: number }>, parentId: string) {
  const parent = graph.nodes.find((node) => node.id === parentId);
  if (!parent) return;
  const parentPos = positions[parentId] ?? { x: 0, y: 0 };
  const edges = graph.edges.filter((edge) => edge.sourceId === parentId && edge.relation === 'expands');
  const children = edges
    .map((edge) => graph.nodes.find((node) => node.id === edge.targetId))
    .filter((node): node is GraphNode => Boolean(node));

  if (!children.length) return;

  if (parent.depth === 0) {
    const spacing = 280;
    children.forEach((child, index) => {
      const offset = index - (children.length - 1) / 2;
      positions[child.id] = {
        x: parentPos.x + offset * spacing,
        y: parentPos.y + 260
      };
    });
  } else {
    const spacingY = 180;
    children.forEach((child, index) => {
      const offset = index - (children.length - 1) / 2;
      positions[child.id] = {
        x: parentPos.x + 320,
        y: parentPos.y + offset * spacingY
      };
    });
  }
}

export const useGraphStore = create<GraphStoreState>((set) => ({
  graph: null,
  positions: {},
  selectedNodeId: undefined,
  inspectorOpen: false,
  initializeGraph: (topic: string) => {
    const now = new Date().toISOString();
    const rootId = nextId('topic');
    const graphId = nextId('graph');
    const rootNode: TopicNode = {
      id: rootId,
      type: 'topic',
      title: topic,
      content: `Central topic: ${topic}`,
      depth: 0,
      createdAt: now,
      updatedAt: now,
      author: 'user'
    };
    set({
      graph: {
        id: graphId,
        rootId,
        nodes: [rootNode],
        edges: []
      },
      positions: {
        [rootId]: { x: 0, y: 0 }
      },
      selectedNodeId: rootId,
      inspectorOpen: true
    });
  },
  seedFromThemes: (themes: ThemeSuggestion[]) => {
    set((state) => {
      if (!state.graph) return state;
      const currentGraph = state.graph;
      const now = new Date().toISOString();
      const existingRoot = currentGraph.nodes.find(
        (node) => node.id === currentGraph.rootId && node.type === 'topic'
      ) as TopicNode | undefined;
      if (!existingRoot) return state;

      const rootNode: TopicNode = {
        ...existingRoot,
        updatedAt: now
      };

      const nodes: GraphNode[] = [rootNode];
      const edges = [] as Graph['edges'];
      let totalQuestions = 0;
      themes.forEach((theme) => {
        theme.questions.forEach((question, index) => {
          if (totalQuestions >= 10) return;
          const id = nextId('q');
          const node: QuestionNode = {
            id,
            type: 'question',
            title: question,
            content: theme.reason,
            depth: 1,
            createdAt: now,
            updatedAt: now,
            author: 'ai',
            framing: theme.theme,
            priority: totalQuestions + index + 1,
            parentId: rootNode.id
          };
          nodes.push(node);
          edges.push({
            id: nextId('edge'),
            sourceId: rootNode.id,
            targetId: id,
            relation: 'expands'
          });
          totalQuestions += 1;
        });
      });
      const graph: Graph = {
        ...currentGraph,
        nodes,
        edges
      };
      const rootPosition = state.positions[rootNode.id] ?? { x: 0, y: 0 };
      const positions: Record<string, { x: number; y: number }> = {
        [rootNode.id]: rootPosition
      };
      layoutChildren(graph, positions, rootNode.id);
      return {
        graph,
        positions,
        selectedNodeId: rootNode.id,
        inspectorOpen: true
      };
    });
  },
  addChildren: (parentId: string, expansions: ExpansionSuggestion[]) => {
    set((state) => {
      if (!state.graph) return state;
      const currentGraph = state.graph;
      const parent = currentGraph.nodes.find((node) => node.id === parentId) as QuestionNode | undefined;
      if (!parent) return state;
      const now = new Date().toISOString();
      const nodes = [...currentGraph.nodes];
      const edges = [...currentGraph.edges];
      expansions.forEach((expansion) => {
        const id = nextId('q');
        const node: QuestionNode = {
          id,
          type: 'question',
          title: expansion.question,
          content: expansion.why,
          depth: parent.depth + 1,
          createdAt: now,
          updatedAt: now,
          author: 'ai',
          framing: expansion.category,
          priority: expansion.rank,
          parentId
        };
        nodes.push(node);
        edges.push({
          id: nextId('edge'),
          sourceId: parentId,
          targetId: id,
          relation: 'expands'
        });
      });
      const graph: Graph = {
        ...currentGraph,
        nodes,
        edges
      };
      const positions = { ...state.positions };
      layoutChildren(graph, positions, parentId);
      return {
        graph,
        positions
      };
    });
  },
  markExpanded: (nodeId: string) => {
    set((state) => {
      if (!state.graph) return state;
      const nodes = state.graph.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              expanded: true,
              updatedAt: new Date().toISOString()
            }
          : node
      );
      return {
        graph: {
          ...state.graph,
          nodes
        }
      };
    });
  },
  upsertAnswer: (questionId: string, suggestion: AnswerSuggestion) => {
    set((state) => {
      if (!state.graph) return state;
      const now = new Date().toISOString();
      const nodes = [...state.graph.nodes];
      const edges = [...state.graph.edges];
      const question = nodes.find((node) => node.id === questionId && node.type === 'question') as QuestionNode | undefined;
      if (!question) return state;
      const answerEdge = edges.find((edge) => edge.sourceId === questionId && edge.relation === 'answers');
      const positions = { ...state.positions };
      if (answerEdge) {
        const answerNode = nodes.find((node) => node.id === answerEdge.targetId && node.type === 'answer');
        if (answerNode && answerNode.type === 'answer') {
          Object.assign(answerNode, {
            title: answerNode.title || `Answer to ${question.title}`,
            content: suggestion.answer,
            confidence: suggestion.confidence,
            assumptions: suggestion.assumptions,
            nextStep: suggestion.nextStep,
            updatedAt: now
          });
        }
      } else {
        const answerId = nextId('ans');
        const answerNode = {
          id: answerId,
          type: 'answer' as const,
          title: `Answer to ${question.title}`,
          content: suggestion.answer,
          depth: question.depth + 1,
          createdAt: now,
          updatedAt: now,
          author: 'ai' as const,
          confidence: suggestion.confidence,
          assumptions: suggestion.assumptions,
          nextStep: suggestion.nextStep,
          parentId: questionId
        };
        nodes.push(answerNode);
        edges.push({
          id: nextId('edge'),
          sourceId: questionId,
          targetId: answerId,
          relation: 'answers'
        });
        const parentPos = positions[questionId] ?? { x: 0, y: 0 };
        positions[answerId] = {
          x: parentPos.x,
          y: parentPos.y + 160
        };
      }
      const graph: Graph = {
        ...state.graph,
        nodes,
        edges
      };
      return {
        graph,
        positions
      };
    });
  },
  updateNodeTitle: (nodeId: string, title: string) => {
    set((state) => {
      if (!state.graph) return state;
      const nodes = state.graph.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              title,
              updatedAt: new Date().toISOString()
            }
          : node
      );
      return {
        graph: {
          ...state.graph,
          nodes
        }
      };
    });
  },
  togglePinned: (nodeId: string) => {
    set((state) => {
      if (!state.graph) return state;
      const nodes = state.graph.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              pinned: !node.pinned,
              updatedAt: new Date().toISOString()
            }
          : node
      );
      return {
        graph: {
          ...state.graph,
          nodes
        }
      };
    });
  },
  toggleHidden: (nodeId: string) => {
    set((state) => {
      if (!state.graph) return state;
      const nodes = state.graph.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              hidden: !node.hidden,
              updatedAt: new Date().toISOString()
            }
          : node
      );
      const nextSelected = state.selectedNodeId === nodeId ? undefined : state.selectedNodeId;
      return {
        graph: {
          ...state.graph,
          nodes
        },
        selectedNodeId: nextSelected,
        inspectorOpen: nextSelected ? state.inspectorOpen : false
      };
    });
  },
  setSelectedNode: (nodeId?: string) => {
    set({ selectedNodeId: nodeId, inspectorOpen: Boolean(nodeId) });
  },
  setInspectorOpen: (open: boolean) => {
    set({ inspectorOpen: open });
  },
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set((state) => {
      if (!state.graph) return state;
      const exists = state.graph.nodes.some((node) => node.id === nodeId);
      if (!exists) {
        return state;
      }
      return {
        positions: {
          ...state.positions,
          [nodeId]: { x: position.x, y: position.y }
        }
      };
    });
  }
}));
