export type ExternalContextOptions = {
  description: string;
  targetUrls?: string[];
  enableWebSearch?: boolean;
};

export async function buildExternalContext(
  options: ExternalContextOptions
): Promise<string | undefined> {
  const { description, targetUrls, enableWebSearch } = options;

  // ★現時点ではスタブ実装：
  // - 実際のWeb検索やスクレイピングは行わない
  // - description と URL一覧を1つのテキストにまとめるだけ
  // - 将来的にここに Apify や Web検索のロジックを追加する

  const lines: string[] = [];
  lines.push("【ユーザー要件の概要】");
  lines.push(description);

  if (targetUrls && targetUrls.length > 0) {
    lines.push("");
    lines.push("【ユーザーが重要だと指定したURL】");
    for (const url of targetUrls) {
      lines.push("- " + url);
    }
  }

  if (enableWebSearch) {
    lines.push("");
    lines.push("【メモ】将来的にここでWeb検索結果を要約して追加する予定です。");
  }

  // TODO:
  //  - enableWebSearch が true の場合、Apify や独自のWeb検索APIを呼び出して、
  //    その結果を要約して context に追加する。
  //  - Playwright MCP を導入した場合は、ここから MCP クライアントを呼び出して
  //    サイトのスクリーンショットや DOM 情報を取得し、その要約を含める。

  return lines.join("\n");
}
