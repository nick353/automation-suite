import 'dotenv/config';
import axios from 'axios';

type N8nClientOptions = {
  baseURL?: string;
  apiKey?: string;
};

const createN8nClient = (options?: N8nClientOptions) => {
  const baseURL = options?.baseURL || process.env.N8N_API_URL;
  const apiKey = options?.apiKey || process.env.N8N_API_KEY;

  if (!baseURL) {
    throw new Error('N8N_API_URL is not set. Please add it to your environment or provide it per request.');
  }

  if (!apiKey) {
    throw new Error('N8N_API_KEY is not set. Please add it to your environment or provide it per request.');
  }

  return axios.create({
    baseURL: baseURL.replace(/\/$/, ''),
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });
};

export async function createWorkflow(workflowJson: any, options?: N8nClientOptions): Promise<any> {
  const client = createN8nClient(options);
  const res = await client.post('/rest/workflows', workflowJson);
  return res.data;
}

export async function updateWorkflow(
  workflowId: string,
  workflowJson: any,
  options?: N8nClientOptions,
): Promise<any> {
  if (!workflowId) {
    throw new Error('workflowId is required for update.');
  }

  const client = createN8nClient(options);
  const res = await client.patch(`/rest/workflows/${workflowId}`, workflowJson);
  return res.data;
}

export { createN8nClient as n8nHttpClient };
