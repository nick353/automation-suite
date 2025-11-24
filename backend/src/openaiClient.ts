// src/openaiClient.ts
import "dotenv/config";
import OpenAI from "openai";

/**
 * n8n テンプレの簡易型（構造が合っていればOK）
 */
type TemplateWorkflow = {
  id: string;
  fileName?: string;
  category?: string;
  title?: string;
  description?: string;
  tags?: string[];
  nodeTypes?: string[];
  workflow: any;
};

const defaultApiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_MODEL || "gpt-4o";

const createOpenAIClient = (apiKeyOverride?: string) => {
  const apiKey = apiKeyOverride?.trim() || defaultApiKey;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY が指定されていません。（.env またはリクエストで渡してください）");
    throw new Error("OPENAI_API_KEY is required");
  }
  return new OpenAI({ apiKey });
};

/**
 * ユーザーの要件＋類似テンプレをもとに、
 * n8n にインポート可能なワークフロー JSON を生成する関数
 */
export async function generateN8nWorkflowJson(args: {
  description: string;
  templates: TemplateWorkflow[];
  externalContext?: string;
  openaiApiKey?: string;
}): Promise<any> {
  const { description, templates, externalContext, openaiApiKey } = args;

  if (!description || description.trim().length === 0) {
    throw new Error("description is required");
  }

  const client = createOpenAIClient(openaiApiKey);

  // --- System プロンプト（n8n 用ワークフロー設計ルール） ---
  const systemPrompt = `
あなたは「n8n 用ワークフロー設計アシスタント」です。

目的：
- ユーザーが自然言語で説明した自動化フローと、
  参考として渡された既存の n8n ワークフロー JSON をもとに、
  n8n にインポート可能なワークフロー JSON を生成してください。

利用可能な入力：
- task_description: ユーザーがやりたいことの説明
- reference_workflows: 参考の n8n ワークフロー JSON 一覧
- external_context: 事前に Web検索やスクレイピングで取得した補助情報（あれば）

重要なルール：
- 出力は **有効な JSON オブジェクト 1つだけ** です。
- \`\`\` やコメント、説明文は絶対に付けないでください。
- JSON は少なくとも以下のプロパティを含めてください：
  - "name": string
  - "nodes": Node[]
  - "connections": object
- 各 Node は、少なくとも以下のプロパティを持ちます：
  - "id": string
  - "name": string
  - "type": string（例: "n8n-nodes-base.webhook"）
  - "typeVersion": number
  - "position": [number, number]
  - "parameters": object

参考ワークフローの使い方：
- 渡された reference_workflows の "workflow" オブジェクトは、ユーザー環境で実際に動いている n8n ワークフローです。
- ノードの type, typeVersion, parameters, connections の構造は、できるだけそれらに合わせてください。
- 似たユースケースのテンプレがあれば、それをベースにして修正するイメージで新しい JSON を構築してください。

Webアクセス / 外部サービス活用の指針：
1. ユーザー要件に「サイトから情報を取得したい」「スクレイピングしたい」「外部Webサービスからデータを取りたい」が含まれる場合は、ワークフロー内に Web アクセス用ノードを必ず含めてください。
2. 具体例:
   - 単純な HTTP / API 呼び出し: "n8n-nodes-base.httpRequest" ノードを使用し、parameters.url / method / headers / body を適切に設定する。
   - Apify 等のスクレイピングサービス: HTTP Request ノードで "https://api.apify.com/v2/acts/{ACTOR_ID}/run-sync?token=TODO_APIFY_TOKEN" などを呼び出す。"TODO_APIFY_TOKEN" や "TODO_ACTOR_ID" などのプレースホルダ文字列を使う。
   - ユーザー環境に専用ノードがある前提なら "n8n-nodes-base.apify" のようなノードタイプを使ってもよい。
3. URL や token などセンシティブな値は絶対にハードコードせず、"TODO_TARGET_URL" や "TODO_API_TOKEN" のようなプレースホルダ文字列を入れる。
4. external_context がある場合は、それを「事前に検索/スクレイピングした要約情報」とみなし、可能ならレスポンスのパースやノードのパラメータ設計に活用する。

その他の注意：
- 不明な URL や認証情報、Webhook パスなどは、"TODO_xxx" のようなプレースホルダ文字列を入れてください。
- JSON は n8n にそのまま Import できる形を目指してください。
  `;

  // 注意:
  //  - externalContext は、Web検索やスクレイピングから得られた補助情報です。
  //  - モデルは externalContext を参考にしつつ、n8n の HTTP Request / Apify ノードなどを
  //    組み合わせてワークフローを設計します。

  // --- ユーザー入力＋参照テンプレを JSON にまとめる ---
  const userPayload = {
    task_description: description,
    reference_workflows: templates.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      description: t.description,
      tags: t.tags,
      nodeTypes: t.nodeTypes,
      workflow: t.workflow,
    })),
    external_context: externalContext ?? null,
  };

  // --- Responses API を呼び出す ---
  const response = await client.responses.create({
    model: defaultModel,
    instructions: systemPrompt,
    input: JSON.stringify(userPayload),
  } as any); // 型の厳しさを避けるために as any を付けておく

  // --- テキスト出力を取り出す（output_text ヘルパー優先） ---
  let text: string | undefined;

  const outputText = (response as any).output_text;
  if (typeof outputText === "string") {
    text = outputText;
  } else if (Array.isArray(outputText) && outputText.length > 0) {
    text = outputText.join("\n");
  } else {
    // 古い or 変則形のレスポンス向けフォールバック
    const output = (response as any).output;
    if (Array.isArray(output) && output.length > 0) {
      const firstContent = output[0]?.content?.[0];
      // Responses API の "output_text" 形式
      if (
        firstContent &&
        firstContent.type === "output_text" &&
        firstContent.text &&
        typeof firstContent.text.value === "string"
      ) {
        text = firstContent.text.value;
      } else if (firstContent && typeof firstContent.text === "string") {
        text = firstContent.text;
      }
    }
  }

  if (!text || text.trim().length === 0) {
    console.error("❌ OpenAI response had no textual output. Raw response (truncated):");
    console.error(JSON.stringify(response, null, 2).slice(0, 2000));
    throw new Error("OpenAI response did not include textual output.");
  }

  // --- JSON パース ---
  let workflowJson: any;
  try {
    workflowJson = JSON.parse(text);
  } catch (err: any) {
    console.error("❌ Failed to parse OpenAI JSON. Raw text:");
    console.error(text);
    throw new Error(`Failed to parse workflow JSON from OpenAI: ${err.message}`);
  }

  return workflowJson;
}

/**
 * ユーザーとのチャットを行う関数
 */
export async function chatWithAI(args: {
  history: { role: string; content: string }[];
  message: string;
  language: 'ja' | 'en';
  openaiApiKey?: string;
}): Promise<string> {
  const { history, message, language, openaiApiKey } = args;
  const client = createOpenAIClient(openaiApiKey);

  const langInstruction = language === 'ja' ? 'Respond in Japanese.' : 'Respond in English.';

  const systemPrompt = `
    You are an expert n8n Consultant.
    The user wants to build an automation workflow.
    
    Your goal is to:
    1. Analyze the user's request.
    2. Outline a step-by-step plan for the n8n workflow.
    3. Ask clarifying questions if any details are missing.
    
    Do NOT generate JSON yet. Just provide a natural language plan and questions.
    Keep the tone professional, helpful, and concise.
    ${langInstruction}
  `;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: message }
  ];

  const response = await client.chat.completions.create({
    model: defaultModel,
    messages: messages,
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response.";
}
