document.addEventListener("DOMContentLoaded", () => {
  const descriptionInput = document.getElementById("descriptionInput");
  const topKInput = document.getElementById("topKInput");
  const enableWebSearchInput = document.getElementById("enableWebSearchInput");
  const targetUrlsInput = document.getElementById("targetUrlsInput");

  const generateButton = document.getElementById("generateButton");
  const generateStatus = document.getElementById("generateStatus");
  const similarTemplatesDiv = document.getElementById("similarTemplates");
  const workflowJsonPreview = document.getElementById("workflowJsonPreview");
  const copyJsonButton = document.getElementById("copyJsonButton");
  const deployButton = document.getElementById("deployButton");
  const deployResult = document.getElementById("deployResult");
  const apiBaseInput = document.getElementById("apiBaseInput");
  const openaiApiKeyInput = document.getElementById("openaiApiKeyInput");
  const n8nApiUrlInput = document.getElementById("n8nApiUrlInput");
  const n8nApiKeyInput = document.getElementById("n8nApiKeyInput");

  let currentWorkflowJson = null;

  deployButton.disabled = true;
  copyJsonButton.disabled = true;

  const buildApiUrl = (path) => {
    const base = (apiBaseInput?.value || "").trim();
    if (!base) return path;
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  };

  const renderSimilarTemplates = (templates) => {
    similarTemplatesDiv.innerHTML = "";

    if (!templates || templates.length === 0) {
      similarTemplatesDiv.textContent = "参考テンプレートが見つかりませんでした。";
      return;
    }

    templates.forEach((tpl) => {
      const card = document.createElement("div");
      card.className = "template-card";

      const title = document.createElement("h4");
      title.textContent = tpl.title || "No title";
      card.appendChild(title);

      if (tpl.category) {
        const category = document.createElement("div");
        category.className = "category";
        category.textContent = tpl.category;
        card.appendChild(category);
      }

      if (tpl.tags && tpl.tags.length > 0) {
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "tags";
        tpl.tags.forEach((tag) => {
          const tagEl = document.createElement("span");
          tagEl.className = "tag";
          tagEl.textContent = tag;
          tagsContainer.appendChild(tagEl);
        });
        card.appendChild(tagsContainer);
      }

      similarTemplatesDiv.appendChild(card);
    });
  };

  generateButton.addEventListener("click", async () => {
    if (!descriptionInput.value.trim()) {
      generateStatus.textContent = "説明を入力してください。";
      return;
    }

    generateButton.disabled = true;
    deployButton.disabled = true;
    copyJsonButton.disabled = true;
    generateStatus.textContent = "生成中...";

    const targetUrlsArray = (targetUrlsInput.value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const body = {
      description: descriptionInput.value,
      topK: Number(topKInput.value) || 5,
      targetUrls: targetUrlsArray.length > 0 ? targetUrlsArray : undefined,
      enableWebSearch: Boolean(enableWebSearchInput.checked),
    };

    const openaiKey = (openaiApiKeyInput?.value || "").trim();
    if (openaiKey) {
      body.openaiApiKey = openaiKey;
    }

    try {
      const response = await fetch(buildApiUrl("/api/workflows/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      currentWorkflowJson = data.workflowJson;
      workflowJsonPreview.textContent = JSON.stringify(data.workflowJson, null, 2);
      renderSimilarTemplates(data.similarTemplates);

      deployButton.disabled = false;
      copyJsonButton.disabled = false;
      generateStatus.textContent = "ワークフロー案の生成が完了しました。";
    } catch (err) {
      console.error("Failed to generate workflow", err);
      generateStatus.textContent = "生成中にエラーが発生しました。";
      deployButton.disabled = true;
      copyJsonButton.disabled = true;
    } finally {
      generateButton.disabled = false;
    }
  });

  copyJsonButton.addEventListener("click", async () => {
    if (!currentWorkflowJson) {
      generateStatus.textContent = "先にワークフローを生成してください。";
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(currentWorkflowJson, null, 2));
      generateStatus.textContent = "JSONをクリップボードにコピーしました。";
    } catch (err) {
      console.error("Failed to copy JSON", err);
      generateStatus.textContent = "JSONのコピーに失敗しました。";
    }
  });

  deployButton.addEventListener("click", async () => {
    if (!currentWorkflowJson) {
      deployResult.textContent = "先にワークフローを生成してください。";
      return;
    }

    deployButton.disabled = true;
    deployResult.textContent = "n8n にデプロイ中...";

    const body = {
      workflowJson: currentWorkflowJson,
      mode: "create",
      workflowId: null,
    };

    const n8nApiUrl = (n8nApiUrlInput?.value || "").trim();
    const n8nApiKey = (n8nApiKeyInput?.value || "").trim();
    if (n8nApiUrl) body.n8nApiUrl = n8nApiUrl;
    if (n8nApiKey) body.n8nApiKey = n8nApiKey;

    try {
      const response = await fetch(buildApiUrl("/api/workflows/deploy"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        deployResult.textContent = `デプロイ成功: workflowId = ${data.n8nWorkflowId || "不明"}`;
      } else {
        deployResult.textContent = `デプロイに失敗しました: ${data.error || "Unknown error"}`;
      }
    } catch (err) {
      console.error("Failed to deploy workflow", err);
      deployResult.textContent = "デプロイに失敗しました: サーバーエラー";
    } finally {
      deployButton.disabled = false;
    }
  });
});
