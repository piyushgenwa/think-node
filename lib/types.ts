export type NodeType =
  | 'topic'
  | 'question'
  | 'answer'
  | 'insight'
  | 'decision'
  | 'reference';

export interface BaseNode {
  id: string;
  type: NodeType;
  title: string;
  content?: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
  author: 'user' | 'ai';
  pinned?: boolean;
  hidden?: boolean;
  expanded?: boolean;
  parentId?: string;
}

export interface TopicNode extends BaseNode {
  type: 'topic';
}

export interface QuestionNode extends BaseNode {
  type: 'question';
  framing?: string;
  priority?: number;
}

export interface AnswerNode extends BaseNode {
  type: 'answer';
  confidence: number;
  assumptions: string[];
  nextStep: string;
}

export interface InsightNode extends BaseNode {
  type: 'insight';
}

export interface DecisionNode extends BaseNode {
  type: 'decision';
}

export interface ReferenceNode extends BaseNode {
  type: 'reference';
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: 'expands' | 'answers' | 'supports' | 'refutes' | 'leads_to';
}

export interface Graph {
  id: string;
  rootId: string;
  nodes: GraphNode[];
  edges: Edge[];
}

export type GraphNode = TopicNode | QuestionNode | AnswerNode | InsightNode | DecisionNode | ReferenceNode;

export interface ThemeSuggestion {
  theme: string;
  reason: string;
  questions: string[];
}

export interface ThemeResponse {
  themes: ThemeSuggestion[];
}

export interface ExpansionSuggestion {
  rank: number;
  question: string;
  why: string;
  category: string;
}

export interface AnswerSuggestion {
  answer: string;
  confidence: number;
  assumptions: string[];
  nextStep: string;
}
