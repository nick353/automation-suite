export type TemplateWorkflow = {
  id: string;
  fileName: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  nodeTypes: string[];
  workflow: Record<string, any>;
};

export type TemplateEmbedding = {
  id: string;
  embedding: number[];
};

