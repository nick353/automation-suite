// 実行例: npx ts-node scripts/annotateTemplates.ts
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TemplateWorkflow } from './types';

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(ROOT_DIR, 'templates', 'index.json');
const MODEL_NAME = 'gpt-4.1'; // TODO: pick the best available GPT-4.x model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Annotation = {
  description: string;
  tags: string[];
};

function ensureApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure it in your .env file.');
  }
}

async function readTemplates(): Promise<TemplateWorkflow[]> {
  const raw = await fs.readFile(INDEX_FILE, 'utf-8');
  return JSON.parse(raw) as TemplateWorkflow[];
}

function buildWorkflowPreview(template: TemplateWorkflow): string {
  if (!template.workflow || !Array.isArray(template.workflow.nodes)) {
    return 'nodes: []';
  }

  const nodesPreview = template.workflow.nodes.slice(0, 5).map((node: any) => ({
    name: node?.name,
    type: node?.type,
    notes: node?.notes ?? '',
  }));

  return JSON.stringify(
    {
      name: template.workflow.name ?? template.title,
      nodes: nodesPreview,
    },
    null,
    2,
  );
}

async function annotateTemplateWithAI(template: TemplateWorkflow): Promise<Annotation> {
  const workflowPreview = buildWorkflowPreview(template);

  const completion = await openai.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'template_annotation',
        schema: {
          type: 'object',
          required: ['description', 'tags'],
          properties: {
            description: {
              type: 'string',
              description: 'Japanese explanation of the workflow (1-3 sentences).',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Japanese keywords that describe the workflow.',
            },
          },
          additionalProperties: false,
        },
        strict: true,
      },
    },
    messages: [
      {
        role: 'system',
        content:
          'あなたは n8n のワークフローを要約・タグ付けするアシスタントです。' +
          'category, title, nodeTypes, workflow 情報をもとに、日本語の description と tags を JSON のみで出力してください。' +
          '必ず {"description": string, "tags": string[]} の形式で返してください。',
      },
      {
        role: 'user',
        content: [
          `category: ${template.category}`,
          `title: ${template.title}`,
          `nodeTypes: ${template.nodeTypes.join(', ') || 'unknown'}`,
          'workflowPreview:',
          workflowPreview,
        ].join('\n'),
      },
    ],
  });

  const messageContent = completion.choices?.[0]?.message?.content;
  if (!messageContent) {
    throw new Error('OpenAI response did not include content.');
  }

  return JSON.parse(messageContent) as Annotation;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  ensureApiKey();
  const templates = await readTemplates();
  let updatedCount = 0;

  for (const template of templates) {
    const needsDescription = !template.description || template.description.trim().length === 0;
    const needsTags = !Array.isArray(template.tags) || template.tags.length === 0;
    if (!needsDescription && !needsTags) continue;

    try {
      const annotation = await annotateTemplateWithAI(template);
      template.description = annotation.description;
      template.tags = annotation.tags;
      updatedCount += 1;
    } catch (error) {
      console.error(`Failed to annotate ${template.id}:`, error);
      continue;
    }

    // 連続リクエストでのレート制限を避けるために少し待機
    await delay(1200);
  }

  await fs.writeFile(INDEX_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  console.log(`Annotated ${updatedCount} templates. Updated file: ${path.relative(ROOT_DIR, INDEX_FILE)}`);
}

main().catch((error) => {
  console.error('Failed to annotate templates:', error);
  process.exitCode = 1;
});

export { annotateTemplateWithAI };
