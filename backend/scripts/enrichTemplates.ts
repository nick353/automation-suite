// 実行例: npx ts-node scripts/enrichTemplates.ts
import { promises as fs } from 'fs';
import path from 'path';
import { TemplateWorkflow } from './types';

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'templates');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.json');

async function isCategoryDirectory(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.some((entry) => {
      if (!entry.isFile()) return false;
      const lower = entry.name.toLowerCase();
      return lower.endsWith('.json') || lower === 'readme.md';
    });
  } catch (error) {
    console.error(`Failed to inspect directory ${dirPath}:`, error);
    return false;
  }
}

async function buildTemplateWorkflow(
  categoryDir: string,
  fileName: string,
): Promise<TemplateWorkflow | null> {
  const category = path.basename(categoryDir);
  const workflowPath = path.join(categoryDir, fileName);
  try {
    const raw = await fs.readFile(workflowPath, 'utf-8');
    const workflow = JSON.parse(raw);
    const title = typeof workflow.name === 'string' && workflow.name.trim().length > 0
      ? workflow.name
      : path.basename(fileName, path.extname(fileName));

    const nodeTypes: string[] = Array.isArray(workflow.nodes)
      ? Array.from(
          new Set(
            workflow.nodes
              .map((node: any) => node?.type)
              .filter((type: unknown): type is string => typeof type === 'string'),
          ),
        )
      : [];

    return {
      id: path.posix.join(category, path.basename(fileName, path.extname(fileName))),
      fileName,
      category,
      title,
      description: '',
      tags: [],
      nodeTypes,
      workflow,
    };
  } catch (error) {
    console.error(`Failed to process ${workflowPath}:`, error);
    return null;
  }
}

async function collectTemplateWorkflows(): Promise<TemplateWorkflow[]> {
  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  const templates: TemplateWorkflow[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const categoryDir = path.join(ROOT_DIR, entry.name);

    if (['scripts', 'templates', 'node_modules'].includes(entry.name)) continue;
    if (!(await isCategoryDirectory(categoryDir))) continue;

    const fileEntries = await fs.readdir(categoryDir, { withFileTypes: true });
    const jsonFiles = fileEntries
      .filter((file) => file.isFile() && file.name.toLowerCase().endsWith('.json'))
      .map((file) => file.name);

    for (const fileName of jsonFiles) {
      const template = await buildTemplateWorkflow(categoryDir, fileName);
      if (template) {
        templates.push(template);
      }
    }
  }

  return templates;
}

async function main(): Promise<void> {
  const templates = await collectTemplateWorkflows();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  console.log(`Wrote ${templates.length} templates to ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main().catch((error) => {
  console.error('Failed to enrich templates:', error);
  process.exitCode = 1;
});

export { buildTemplateWorkflow };
