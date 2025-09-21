import {
  AnswerNode,
  AnswerSuggestion,
  ExpansionSuggestion,
  Graph,
  ThemeResponse
} from '@/lib/types';

type DeepSeekRole = 'system' | 'user';

interface DeepSeekMessage {
  role: DeepSeekRole;
  content: string;
}

interface DeepSeekChatResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

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
  const themeCount = 3 + Math.floor(random() * 2);
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
  const count = 3 + Math.floor(random() * 3);
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

function hasDeepSeekKey() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const baseUrl = (process.env.DEEPSEEK_API_BASE ?? 'https://api.deepseek.com/v1').replace(/\/$/, '');
  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepSeek request failed: ${response.status} ${response.statusText} ${errorText}`);
  }

  const payload = (await response.json()) as DeepSeekChatResponse;
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek response did not include content');
  }

  return content;
}

function extractJson<T>(content: string): T | null {
  if (!content) return null;
  const trimmed = content.trim();

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    const parsed = tryParse(fenceMatch[1]);
    if (parsed) return parsed;
  }

  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    const parsed = tryParse(braceMatch[0]);
    if (parsed) return parsed;
  }

  return null;
}

function normalizeThemeResponse(topic: string, raw: ThemeResponse | null): ThemeResponse {
  if (!raw || !Array.isArray(raw.themes)) {
    return mockGenerateThemes(topic);
  }

  const sanitized: ThemeResponse['themes'] = [];

  raw.themes.forEach((theme) => {
    if (!theme) return;
    const questions = Array.isArray(theme.questions)
      ? theme.questions.map((question) => question.trim()).filter(Boolean)
      : [];
    if (!questions.length) return;

    sanitized.push({
      theme: theme.theme?.trim() || 'Exploration Theme',
      reason: theme.reason?.trim() || 'Explore this angle to make the topic actionable.',
      questions: questions.slice(0, 10)
    });
  });

  if (!sanitized.length) {
    return mockGenerateThemes(topic);
  }

  let flatQuestions = sanitized.reduce((total, theme) => total + theme.questions.length, 0);

  if (flatQuestions < 6) {
    const fallback = mockGenerateThemes(topic);
    fallback.themes.forEach((theme) => {
      theme.questions.forEach((question) => {
        if (flatQuestions >= 6) return;
        const target = sanitized[sanitized.length - 1];
        if (target) {
          target.questions.push(question);
        } else {
          sanitized.push({ theme: theme.theme, reason: theme.reason, questions: [question] });
        }
        flatQuestions += 1;
      });
    });
  }

  const contrarian = `What observable signal would prove that our approach to ${topic} is wrong?`;
  const hasContrarian = sanitized.some((theme) =>
    theme.questions.some((question) => /prove|wrong|fail|disconfirm/i.test(question))
  );
  if (!hasContrarian) {
    const last = sanitized[sanitized.length - 1];
    if (last) {
      last.questions.push(contrarian);
    } else {
      sanitized.push({
        theme: 'Contrarian Checks',
        reason: 'Add a falsification lens to avoid groupthink.',
        questions: [contrarian]
      });
    }
  }

  flatQuestions = sanitized.reduce((total, theme) => total + theme.questions.length, 0);
  if (flatQuestions > 10) {
    let toTrim = flatQuestions - 10;
    for (let i = sanitized.length - 1; i >= 0 && toTrim > 0; i -= 1) {
      const theme = sanitized[i];
      while (theme.questions.length > 0 && toTrim > 0) {
        theme.questions.pop();
        toTrim -= 1;
      }
      if (!theme.questions.length) {
        sanitized.splice(i, 1);
      }
    }
  }

  return { themes: sanitized };
}

function normalizeExpansionResponse(
  seed: string,
  parentTitle: string | undefined,
  suggestions: ExpansionSuggestion[] | null
): ExpansionSuggestion[] {
  if (!suggestions || !suggestions.length) {
    return mockExpandQuestions(seed, parentTitle);
  }

  const sanitized: ExpansionSuggestion[] = [];
  const seen = new Set<string>();

  suggestions.forEach((suggestion) => {
    if (!suggestion) return;
    const question = suggestion.question?.trim();
    if (!question || seen.has(question.toLowerCase())) return;
    seen.add(question.toLowerCase());
    sanitized.push({
      rank: sanitized.length + 1,
      question,
      why:
        suggestion.why?.trim() ||
        'Expands on nuances surfaced by the previous layer to stress-test the logic.',
      category: suggestion.category?.trim() || 'follow_up'
    });
  });

  if (sanitized.length < 3) {
    const fallback = mockExpandQuestions(seed, parentTitle);
    fallback.forEach((entry) => {
      if (sanitized.length >= 3) return;
      sanitized.push(entry);
    });
  }

  const contrarian = `What would convince us to abandon "${parentTitle ?? 'this direction'}" entirely?`;
  const hasContrarian = sanitized.some((item) =>
    /abandon|wrong|prove|fail|stop/i.test(item.question)
  );
  if (!hasContrarian) {
    sanitized.push({
      rank: sanitized.length + 1,
      question: contrarian,
      why: 'A contrarian check that actively seeks disconfirming evidence.',
      category: 'contrarian'
    });
  }

  const limited = sanitized.slice(0, 7).map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  return limited;
}

function coerceAnswerSuggestion(
  question: string,
  suggestion: Partial<AnswerSuggestion> | null
): AnswerSuggestion | null {
  if (!suggestion) return null;
  const answer = suggestion.answer?.trim();
  if (!answer) return null;
  const rawConfidence = typeof suggestion.confidence === 'number' ? suggestion.confidence : 0.6;
  const confidence = Math.min(1, Math.max(0, rawConfidence));
  const assumptions = Array.isArray(suggestion.assumptions)
    ? suggestion.assumptions.map((assumption) => assumption.trim()).filter(Boolean)
    : [];
  const nextStep = suggestion.nextStep?.trim() ||
    'Document the most critical assumption and outline the validation step.';

  return {
    answer,
    confidence,
    assumptions: assumptions.length
      ? assumptions
      : ['Identify the riskiest assumption and design a quick validation.'],
    nextStep
  };
}

function ensureSummaryMarkdown(graph: Graph, markdown: string | null): { summaryMarkdown: string } {
  if (!markdown || markdown.trim().length < 10) {
    return mockSummarize(graph);
  }
  return { summaryMarkdown: markdown.trim() };
}

export async function generateThemes(topic: string): Promise<ThemeResponse> {
  if (!hasDeepSeekKey()) {
    return mockGenerateThemes(topic);
  }

  try {
    const completion = await callDeepSeek([
      {
        role: 'system',
        content:
          'You are an expert strategy researcher who surfaces structured inquiry themes. Always respond with valid JSON matching the requested schema.'
      },
      {
        role: 'user',
        content: `Topic: ${topic}.
Return a JSON object with this shape:
{
  "themes": [
    {
      "theme": string,
      "reason": string,
      "questions": string[]
    }
  ]
}
Provide between 6 and 10 total questions across 3-4 themes. Include at least one contrarian or falsification question.`
      }
    ]);
    const parsed = extractJson<ThemeResponse>(completion);
    return normalizeThemeResponse(topic, parsed);
  } catch (error) {
    console.error('DeepSeek generateThemes error', error);
    return mockGenerateThemes(topic);
  }
}

export async function expandQuestions(
  seed: string,
  parentTitle: string | undefined
): Promise<ExpansionSuggestion[]> {
  if (!hasDeepSeekKey()) {
    return mockExpandQuestions(seed, parentTitle);
  }

  try {
    const completion = await callDeepSeek([
      {
        role: 'system',
        content:
          'You are a facilitation coach who breaks complex questions into sharper follow-ups. Always respond with JSON.'
      },
      {
        role: 'user',
        content: `We are exploring: "${parentTitle ?? 'this question'}".
Return a JSON array (not wrapped in extra text) of follow-up question objects with this shape:
[
  {
    "rank": number,
    "question": string,
    "why": string,
    "category": string
  }
]
Provide 3-7 items and ensure one explicitly challenges our assumptions.`
      }
    ]);
    const parsed = extractJson<ExpansionSuggestion[]>(completion);
    return normalizeExpansionResponse(seed, parentTitle, parsed);
  } catch (error) {
    console.error('DeepSeek expandQuestions error', error);
    return mockExpandQuestions(seed, parentTitle);
  }
}

export async function draftAnswer(
  seed: string,
  question: string,
  notes?: string
): Promise<AnswerSuggestion> {
  if (!hasDeepSeekKey()) {
    return mockDraftAnswer(seed);
  }

  try {
    const completion = await callDeepSeek([
      {
        role: 'system',
        content:
          'You are a pragmatic strategist who drafts crisp answers. Always return JSON with answer, confidence (0-1), assumptions, nextStep.'
      },
      {
        role: 'user',
        content: `Draft a concise answer to the question: "${question}".
Context: ${notes ?? 'No additional notes provided.'}
Return JSON like:
{
  "answer": string,
  "confidence": number between 0 and 1,
  "assumptions": string[],
  "nextStep": string
}`
      }
    ]);
    const parsed = extractJson<AnswerSuggestion>(completion);
    const coerced = coerceAnswerSuggestion(question, parsed);
    return coerced ?? mockDraftAnswer(seed);
  } catch (error) {
    console.error('DeepSeek draftAnswer error', error);
    return mockDraftAnswer(seed);
  }
}

export async function summarizeGraph(graph: Graph): Promise<{ summaryMarkdown: string }> {
  if (!hasDeepSeekKey()) {
    return mockSummarize(graph);
  }

  try {
    const completion = await callDeepSeek([
      {
        role: 'system',
        content:
          'You are an executive summarizer. Produce a crisp Markdown summary covering Context, Key Insights, Decisions, Open Questions, Next Actions. Respond with JSON.'
      },
      {
        role: 'user',
        content: `Here is the graph data in JSON:
${JSON.stringify(graph)}
Return JSON like { "summaryMarkdown": string } where the string already contains the Markdown sections.`
      }
    ]);
    const parsed = extractJson<{ summaryMarkdown: string }>(completion);
    return ensureSummaryMarkdown(graph, parsed?.summaryMarkdown ?? null);
  } catch (error) {
    console.error('DeepSeek summarizeGraph error', error);
    return mockSummarize(graph);
  }
}

