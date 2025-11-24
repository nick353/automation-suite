// 実行例: npx ts-node scripts/buildEmbeddings.ts
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { TemplateWorkflow, TemplateEmbedding } from './types';

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(ROOT_DIR, 'templates', 'index.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'templates', 'embeddings.json');
const MODEL_NAME = 'text-embedding-3-small';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function ensureApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure it in your .env file.');
  }
}

async function readTemplates(): Promise<TemplateWorkflow[]> {
  const raw = await fs.readFile(INDEX_FILE, 'utf-8');
  return JSON.parse(raw) as TemplateWorkflow[];
}

function buildEmbeddingInput(template: TemplateWorkflow): string {
  const tags = Array.isArray(template.tags) ? template.tags.join(' ') : '';
  const nodeTypes = Array.isArray(template.nodeTypes) ? template.nodeTypes.join(' ') : '';

  return [
    `Category: ${template.category}`,
    `Title: ${template.title}`,
    `Description: ${template.description ?? ''}`,
    `Tags: ${tags}`,
    `NodeTypes: ${nodeTypes}`,
  ].join('\n');
}

async function createEmbedding(input: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: MODEL_NAME,
      input,
    });
    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.error('Failed to create embedding:', error);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  ensureApiKey();
  const templates = await readTemplates();
  const embeddings: TemplateEmbedding[] = [];

  for (const template of templates) {
    const input = buildEmbeddingInput(template);
    const embedding = await createEmbedding(input);
    if (!embedding) {
      console.error(`Skipping ${template.id} due to embedding failure.`);
      continue;
    }

    embeddings.push({
      id: template.id,
      embedding,
    });

    // レート制限の緩和 (必要に応じて調整してください)
    await delay(1000);
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(embeddings, null, 2), 'utf-8');
  console.log(`Wrote ${embeddings.length} embeddings to ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main().catch((error) => {
  console.error('Failed to build embeddings:', error);
  process.exitCode = 1;
});

export type { TemplateEmbedding };
