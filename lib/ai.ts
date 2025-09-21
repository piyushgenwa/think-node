import { AnswerNode, AnswerSuggestion, ExpansionSuggestion, Graph, ThemeResponse } from '@/lib/types';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function createRandom(seedSource: string): () => number {
  let seed = hashString(seedSource) || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const baseThemes = [
  {
    theme: 'Strategy & Positioning',
    reason: 'Clarify how the initiative creates distinctive value and where it competes.'
  },
  {
    theme: 'Customer Insight',
    reason: 'Understand the people affected, their unmet needs, and adoption barriers.'
  },
  {
    theme: 'Execution & Delivery',
    reason: 'Translate the ambition into operating models, teams, and milestones.'
  },
  {
    theme: 'Risks & Resilience',
    reason: 'Surface blind spots, dependencies, and failure modes early.'
  },
  {
    theme: 'Metrics & Outcomes',
    reason: 'Define what success means and how it will be measured.'
  }
];

const questionTemplates = [
  'What would an ambitious yet plausible win for {topic} look like in 18 months?',
  'Which stakeholder feels the most pain today related to {topic}, and why?',
  'Where could momentum for {topic} stall because of structural resistance?',
  'How might we prototype {topic} in a way that de-risks the riskiest assumption?',
  'If {topic} succeeds wildly, what second-order effects appear?',
  'What evidence would convince a skeptic that {topic} matters now?',
  'Which leading indicator tells us early that {topic} is working?',
  'What existing behaviors can we leverage to accelerate {topic}?',
  'Where are we most likely to overspend or overbuild for {topic}?',
  'What would make {topic} obsolete faster than expected?'
];

const expansionTemplates = [
  'Which constraint makes this angle fragile?',
  'What supporting data would strengthen this direction?',
  'Who needs to be convinced first and how do we earn their trust?',
  'What assumption is everyone making here that might be wrong?',
  'Which small experiment would create clarity quickly?',
  'How does this connect to broader portfolio priorities?',
  'If we reversed this idea, what new possibility emerges?'
];

export function mockGenerateThemes(topic: string): ThemeResponse {
  const random = createRandom(topic.toLowerCase());
  const themeCount = 3 + Math.floor(random() * 2); // 3-4 themes
  const themePool = [...baseThemes];
  const selectedThemes = [] as { theme: string; reason: string }[];
  while (selectedThemes.length < themeCount && themePool.length) {
    const index = Math.floor(random() * themePool.length);
    selectedThemes.push(themePool.splice(index, 1)[0]);
  }

  let questionsRemaining = 10;
  const themes = selectedThemes.map((entry, themeIndex) => {
    const maxForTheme = Math.min(questionsRemaining, 3 + Math.floor(random() * 2));
    const count = Math.max(2, Math.min(maxForTheme, 3));
    questionsRemaining -= count;
    const questions: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const template = questionTemplates[(themeIndex * 3 + i) % questionTemplates.length];
      const variant = template.replace(/{topic}/g, topic);
      questions.push(variant);
    }
    return {
      theme: entry.theme,
      reason: `${entry.reason}`,
      questions
    };
  });

  const flatQuestions = themes.reduce((acc, theme) => acc + theme.questions.length, 0);
  if (flatQuestions < 6) {
    const generalTemplates = questionTemplates.slice(flatQuestions, flatQuestions + (6 - flatQuestions));
    if (themes[0]) {
      generalTemplates.forEach((template) => {
        themes[0].questions.push(template.replace(/{topic}/g, topic));
      });
    }
  }

  const falsifier = `What observable signal would prove that our approach to ${topic} is wrong?`;
  if (!themes.some((theme) => theme.questions.some((question) => question.includes('prove')))) {
    themes[themes.length - 1]?.questions.push(falsifier);
  }

  let total = 0;
  themes.forEach((theme) => {
    theme.questions = theme.questions.slice(0, Math.min(questionsRemaining + theme.questions.length, 10 - total));
    total += theme.questions.length;
  });

  return { themes };
}

export function mockExpandQuestions(seed: string, parentTitle: string | undefined): ExpansionSuggestion[] {
  const basis = `${seed}:${parentTitle ?? ''}`;
  const random = createRandom(basis);
  const count = 3 + Math.floor(random() * 3); // 3-5
  const results: ExpansionSuggestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const template = expansionTemplates[(i + Math.floor(random() * expansionTemplates.length)) % expansionTemplates.length];
    results.push({
      rank: i + 1,
      question: `${template} (${parentTitle ?? 'this idea'})`,
      why: 'Expands on nuances surfaced by the previous layer to stress-test the logic.',
      category: 'follow_up'
    });
  }

  results.push({
    rank: results.length + 1,
    question: `What would convince us to abandon "${parentTitle ?? 'this direction'}" entirely?`,
    why: 'A contrarian check that actively seeks disconfirming evidence.',
    category: 'contrarian'
  });

  return results.slice(0, 7);
}

export function mockDraftAnswer(seed: string): AnswerSuggestion {
  const random = createRandom(seed);
  const confidence = 0.55 + random() * 0.35;
  const patterns = [
    'Frame a pilot with a narrow scope and explicit success criteria.',
    'Co-create with lead users to validate desirability before scaling.',
    'Sequence the work so the riskiest dependencies are addressed first.'
  ];
  const assumptions = [
    'Stakeholders will share candid feedback quickly.',
    'Budget for experimentation is protected.',
    'Data needed for evaluation is accessible and reliable.'
  ];

  return {
    answer: patterns[Math.floor(random() * patterns.length)],
    confidence,
    assumptions: assumptions.slice(0, 2 + Math.floor(random() * 2)),
    nextStep: 'Draft a concise decision memo outlining scope, timeline, and owner.'
  };
}

export function mockSummarize(graph: Graph): { summaryMarkdown: string } {
  const root = graph.nodes.find((node) => node.id === graph.rootId);
  const questions = graph.nodes.filter((node) => node.type === 'question');
  const answers = graph.nodes.filter((node) => node.type === 'answer') as AnswerNode[];
  const answeredQuestions = new Set(
    graph.edges.filter((edge) => edge.relation === 'answers').map((edge) => edge.sourceId)
  );
  const openQuestions = questions.filter((question) => !answeredQuestions.has(question.id));

  const contextLines = [
    root ? `Exploring **${root.title}** with ${questions.length} guiding questions.` : 'Exploration snapshot.'
  ];
  const insightLines = questions
    .slice(0, 5)
    .map((question) => `- ${question.title}`);
  const decisionLines = answers.map((answer) => `- ${answer.title}: ${answer.content}`);
  const openLines = openQuestions.slice(0, 5).map((question) => `- ${question.title}`);
  const nextSteps = answers.map((answer) => `- ${answer.nextStep}`);
  nextSteps.push('- Schedule a synthesis session to align on decisions.');

  const summaryMarkdown = [
    '## Context',
    contextLines.join('\n'),
    '\n## Key Insights',
    insightLines.length ? insightLines.join('\n') : '- Insights will appear once questions are expanded.',
    '\n## Decisions',
    decisionLines.length ? decisionLines.join('\n') : '- No decisions drafted yet.',
    '\n## Open Questions',
    openLines.length ? openLines.join('\n') : '- All surfaced questions have draft answers.',
    '\n## Next Actions',
    nextSteps.join('\n')
  ].join('\n');

  return { summaryMarkdown };
}
