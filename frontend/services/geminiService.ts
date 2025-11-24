import { WorkflowData, ChatMessage, Language } from "../types";

// Helper to convert File to Base64 (kept for future use if backend supports it)
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 1. Analyze inputs and start a chat plan
export const analyzeRequest = async (
  prompt: string,
  externalUrls: string[],
  language: Language,
  videoFile?: File | null
): Promise<string> => {

  // Note: Video file support is currently limited in this backend integration.
  // We will send the prompt and URLs to the chat endpoint.

  const history: ChatMessage[] = [];
  let message = prompt || "Please analyze the context to build a workflow.";

  if (externalUrls.length > 0) {
    message += `\nContext URLs: ${externalUrls.join(", ")}`;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history,
        message,
        language
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze request');
    }

    const data = await response.json();
    return data.reply || "I couldn't analyze the input. Please try again.";
  } catch (error) {
    console.error("Backend Analysis Error:", error);
    throw error;
  }
};

// 2. Continue chat
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  language: Language
): Promise<string> => {

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history,
        message: newMessage,
        language
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.reply || "Error responding.";
  } catch (error) {
    console.error("Backend Chat Error:", error);
    throw error;
  }
};

// 3. Final JSON Generation based on history
export const generateFinalWorkflow = async (
  history: ChatMessage[],
  topK: number,
  language: Language
): Promise<WorkflowData> => {

  // Collapse history into a description for the backend
  const description = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  try {
    const response = await fetch('/api/workflows/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        topK,
        enableWebSearch: false // Default to false for now
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate workflow');
    }

    const data = await response.json();

    // Map backend response to WorkflowData
    return {
      workflowJson: data.workflowJson,
      templates: data.similarTemplates || [],
      summary: "Workflow generated successfully."
    };

  } catch (error) {
    console.error("Backend JSON Error:", error);
    throw error;
  }
};

export interface DeployOptions {
  mode?: 'create' | 'update';
  workflowId?: string;
  n8nApiUrl?: string;
  n8nApiKey?: string;
}

export const deployWorkflow = async (
  workflowJson: Record<string, any>,
  options?: DeployOptions
): Promise<{ success: boolean; n8nWorkflowId: string | null }> => {
  const env = (import.meta as any).env || {};
  const body = {
    workflowJson,
    mode: options?.mode || 'create',
    workflowId: options?.workflowId,
    n8nApiUrl: options?.n8nApiUrl || env.VITE_N8N_API_URL,
    n8nApiKey: options?.n8nApiKey || env.VITE_N8N_API_KEY,
  };

  const response = await fetch('/api/workflows/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deployment failed: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Deployment rejected by server.');
  }

  return {
    success: true,
    n8nWorkflowId: data.n8nWorkflowId ?? null,
  };
};
