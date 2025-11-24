// src/server.ts
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { findSimilarTemplates } from '../lib/templateSearch';
import { generateN8nWorkflowJson, chatWithAI } from './openaiClient';
import { createWorkflow, updateWorkflow } from './n8nClient';
import { buildExternalContext } from './externalContext';

const app = express();

// JSONボディと静的ファイル
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// フロントエンド（Viteビルド）の index.html を優先的に返す
app.get('/', (_req, res, next) => {
  try {
    const distIndex = path.join(__dirname, '..', 'public', 'dist', 'index.html');
    const legacyIndex = path.join(__dirname, '..', 'public', 'index.html');
    const target = fs.existsSync(distIndex) ? distIndex : legacyIndex;
    return res.sendFile(target);
  } catch (err) {
    return next(err);
  }
});

// --- チャットエンドポイント ---
app.post('/api/chat', async (req, res) => {
  try {
    const { history, message, language, openaiApiKey } = req.body ?? {};

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await chatWithAI({
      history: history || [],
      message,
      language: language || 'ja',
      openaiApiKey
    });

    return res.json({ reply: response });
  } catch (error) {
    console.error('Failed to chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- ワークフロー生成エンドポイント ---
app.post('/api/workflows/generate', async (req, res) => {
  try {
    const { description, topK, targetUrls, enableWebSearch, openaiApiKey } = req.body ?? {};

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required' });
    }

    const normalizedTargetUrls = Array.isArray(targetUrls)
      ? targetUrls.filter(
        (url: unknown): url is string =>
          typeof url === 'string' && url.trim().length > 0,
      )
      : undefined;

    // 類似テンプレート検索
    const templates = await findSimilarTemplates(description, {
      topK: typeof topK === 'number' ? topK : undefined,
    });

    // 外部コンテキスト（現時点では description + URL の簡易まとめ）
    const externalContext = await buildExternalContext({
      description,
      targetUrls: normalizedTargetUrls,
      enableWebSearch: Boolean(enableWebSearch),
    });

    // OpenAI で n8n ワークフロー JSON を生成
    const workflowJson = await generateN8nWorkflowJson({
      description,
      templates,
      externalContext,
      openaiApiKey,
    });

    const summary = templates.map((template) => ({
      id: template.id,
      title: template.title,
      category: template.category,
      tags: template.tags,
    }));

    return res.json({
      workflowJson,
      similarTemplates: summary,
    });
  } catch (error) {
    console.error('Failed to generate workflow:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- n8n へのデプロイエンドポイント ---
app.post('/api/workflows/deploy', async (req, res) => {
  try {
    const { workflowJson, mode = 'create', workflowId, n8nApiUrl, n8nApiKey } = req.body ?? {};
    if (!workflowJson) {
      return res
        .status(400)
        .json({ success: false, error: 'workflowJson is required' });
    }

    const normalizedMode: 'create' | 'update' =
      mode === 'update' ? 'update' : 'create';

    let response;

    if (normalizedMode === 'create') {
      // 新規作成
      response = await createWorkflow(workflowJson, {
        baseURL: n8nApiUrl,
        apiKey: n8nApiKey,
      });
    } else {
      // 更新モード
      if (!workflowId || typeof workflowId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'workflowId is required for update mode',
        });
      }
      response = await updateWorkflow(workflowId, workflowJson, {
        baseURL: n8nApiUrl,
        apiKey: n8nApiKey,
      });
    }

    const n8nWorkflowId = (response as any)?.id ?? null;

    return res.json({
      success: true,
      n8nWorkflowId,
      raw: response,
    });
  } catch (error) {
    console.error('Failed to deploy workflow:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- サーバー起動 ---
const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

export default app;
