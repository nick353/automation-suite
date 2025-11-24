import { AppStatus, ChatMessage, GenerationRequest, Language, WorkflowData } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const N8N_API_URL = import.meta.env.VITE_N8N_API_URL;
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY;

type GenerateResponse = {
  workflowJson: Record<string, unknown> | null;
  similarTemplates?: Array<{
    id?: string;
    title?: string;
    category?: string;
    tags?: string[];
  }>;
};

type DeployResponse = {
  success: boolean;
  n8nWorkflowId?: string | null;
  raw?: unknown;
  error?: string;
};

const buildApiUrl = (path: string) => `${API_BASE}${path}`;

const parseTargetUrls = (raw: string): string[] => {
  return raw
    .split('\n')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
};

const scoreFromIndex = (index: number): number => {
  // Give the first template the highest score and taper off
  const base = Math.max(0, 100 - index * 12);
  return Math.max(30, Math.min(100, base));
};

const summarize = (
  description: string,
  templates: GenerateResponse['similarTemplates'],
  language: Language,
): string => {
  const intro =
    language === 'ja'
      ? 'バックエンドでワークフローを生成しました。'
      : 'Generated a workflow from the backend.';

  if (!templates || templates.length === 0) {
    return `${intro} ${description || ''}`.trim();
  }

  const bulletPrefix = language === 'ja' ? '参考テンプレート:' : 'Reference templates:';
  const bullets = templates
    .slice(0, 3)
    .map((tpl) => `- ${tpl.title ?? 'Template'} (${tpl.category ?? 'General'})`)
    .join('\n');

  return `${intro}\n${bulletPrefix}\n${bullets}`;
};

export const buildDescriptionFromHistory = (
  request: GenerationRequest | null,
  history: ChatMessage[],
  appendMessage?: string,
): string => {
  const userMessages = history.filter((m) => m.role === 'user').map((m) => m.content.trim()).filter(Boolean);
  const [firstUser, ...rest] = userMessages;

  const base = firstUser || request?.prompt || '';
  const refinements = [...rest, appendMessage].filter((v) => v && v.trim().length > 0);

  if (refinements.length === 0) {
    return base;
  }

  const refinementBlock = refinements.map((line) => `- ${line}`).join('\n');
  return `${base}\n\nAdditional instructions:\n${refinementBlock}`;
};

export const generateWorkflow = async (
  request: GenerationRequest,
  language: Language,
  descriptionOverride?: string,
): Promise<{ workflow: WorkflowData; raw: GenerateResponse }> => {
  const description = (descriptionOverride ?? request.prompt ?? '').trim();
  if (!description) {
    throw new Error('Please provide a workflow description.');
  }

  const payload: Record<string, unknown> = {
    description,
    topK: request.topK,
    enableWebSearch: request.useExternalInfo,
  };

  if (request.useExternalInfo) {
    const urls = parseTargetUrls(request.externalUrls);
    if (urls.length > 0) payload.targetUrls = urls;
  }

  if (OPENAI_API_KEY) {
    payload.openaiApiKey = OPENAI_API_KEY;
  }

  const response = await fetch(buildApiUrl('/api/workflows/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to generate workflow');
  }

  const data = (await response.json()) as GenerateResponse;

  const templates = (data.similarTemplates ?? []).map((tpl, idx) => ({
    title: tpl.title ?? `Template ${idx + 1}`,
    category: tpl.category ?? 'General',
    tags: tpl.tags ?? [],
    relevanceScore: scoreFromIndex(idx),
  }));

  const workflow: WorkflowData = {
    workflowJson: data.workflowJson ?? {},
    templates,
    summary: summarize(description, data.similarTemplates, language),
  };

  return { workflow, raw: data };
};

export const deployWorkflow = async (params: {
  workflowJson: Record<string, unknown>;
  workflowId?: string;
  mode?: 'create' | 'update';
  n8nApiUrl?: string;
  n8nApiKey?: string;
}): Promise<DeployResponse> => {
  const body = {
    workflowJson: params.workflowJson,
    workflowId: params.workflowId,
    mode: params.mode ?? 'create',
    n8nApiUrl: params.n8nApiUrl || N8N_API_URL,
    n8nApiKey: params.n8nApiKey || N8N_API_KEY,
  };

  const response = await fetch(buildApiUrl('/api/workflows/deploy'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Deployment failed');
  }

  return (await response.json()) as DeployResponse;
};
