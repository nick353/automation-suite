import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { TemplateWorkflow, TemplateEmbedding } from '../scripts/types';

dotenv.config();

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(ROOT_DIR, 'templates', 'index.json');
const EMBEDDINGS_FILE = path.join(ROOT_DIR, 'templates', 'embeddings.json');
const MODEL_NAME = 'text-embedding-3-small';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function ensureApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please configure it in your .env file.');
  }
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i += 1) {
    const valA = a[i];
    const valB = b[i];
    dot += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embedQuery(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL_NAME,
    input: query,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error('Failed to generate embedding for query.');
  }
  return embedding;
}

export async function findSimilarTemplates(
  query: string,
  options?: { topK?: number },
): Promise<TemplateWorkflow[]> {
  ensureApiKey();

  const [templates, embeddings] = await Promise.all([
    loadJsonFile<TemplateWorkflow[]>(INDEX_FILE),
    loadJsonFile<TemplateEmbedding[]>(EMBEDDINGS_FILE),
  ]);

  const embeddingMap = new Map<string, number[]>(
    embeddings.map((entry) => [entry.id, entry.embedding]),
  );
  const queryEmbedding = await embedQuery(query);

  const scored: Array<{ template: TemplateWorkflow; score: number }> = [];

  for (const template of templates) {
    const templateEmbedding = embeddingMap.get(template.id);
    if (!templateEmbedding) continue;

    const score = cosineSimilarity(queryEmbedding, templateEmbedding);
    scored.push({ template, score });
  }

  const topK = options?.topK ?? 5;
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.template);
}

