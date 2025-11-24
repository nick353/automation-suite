import { Language } from '../types';

type TranslationKey = 
  | 'header.subtitle'
  | 'input.step'
  | 'input.title'
  | 'input.subtitle'
  | 'input.refTemplates'
  | 'input.dropZone.active'
  | 'input.dropZone.idle'
  | 'input.dropZone.sub'
  | 'input.placeholder'
  | 'input.external.title'
  | 'input.external.desc'
  | 'input.external.placeholder'
  | 'input.external.info'
  | 'input.button.analyzing'
  | 'input.button.idle'
  | 'input.error'
  | 'chat.title'
  | 'chat.status.thinking'
  | 'chat.status.online'
  | 'chat.button.constructing'
  | 'chat.button.confirm'
  | 'chat.placeholder'
  | 'chat.hint'
  | 'result.step'
  | 'result.title'
  | 'result.subtitle'
  | 'result.badge'
  | 'result.strategy'
  | 'result.patterns'
  | 'result.copy'
  | 'result.copied'
  | 'deploy.step'
  | 'deploy.title'
  | 'deploy.subtitle'
  | 'deploy.success.title'
  | 'deploy.success.desc'
  | 'deploy.open'
  | 'deploy.desc'
  | 'deploy.button.deploying'
  | 'deploy.button.idle'
  | 'deploy.security'
  | 'hero.title'
  | 'hero.title.gradient'
  | 'hero.subtitle';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'header.subtitle': 'Pro Edition',
    'input.step': '1',
    'input.title': 'Workflow Scope',
    'input.subtitle': 'Define what you want to automate',
    'input.refTemplates': 'Ref. Templates',
    'input.dropZone.active': 'Drop screen recording here',
    'input.dropZone.idle': 'Drop screen recording here',
    'input.dropZone.sub': 'or click to browse (.mp4, .mov)',
    'input.placeholder': "Describe the workflow naturally...\ne.g., 'Every morning at 9 AM, scrape product prices from these URLs and send a summary to Slack if the price dropped by 10%.'",
    'input.external.title': 'External Context',
    'input.external.desc': 'Provide URLs or documentation for context',
    'input.external.placeholder': 'https://example.com/api-docs\nhttps://github.com/n8n-io/workflows',
    'input.external.info': 'The AI will use content from these URLs to better understand parameter structures.',
    'input.button.analyzing': 'Analyzing Inputs...',
    'input.button.idle': 'Generate Plan',
    'input.error': 'Analysis failed. Please check your inputs or API key.',
    'chat.title': 'Workflow Architect',
    'chat.status.thinking': 'Thinking...',
    'chat.status.online': 'Online',
    'chat.button.constructing': 'Constructing...',
    'chat.button.confirm': 'Confirm & Build',
    'chat.placeholder': "Refine the plan... (e.g., 'Add error handling to the HTTP node')",
    'chat.hint': 'Press Enter to send. AI can suggest edits before generating JSON.',
    'result.step': '2',
    'result.title': 'Workflow Blueprint',
    'result.subtitle': 'Generated based on your requirements',
    'result.badge': 'AI Generated',
    'result.strategy': 'Execution Strategy',
    'result.patterns': 'Reference Patterns',
    'result.copy': 'COPY',
    'result.copied': 'COPIED',
    'deploy.step': '3',
    'deploy.title': 'Deploy',
    'deploy.subtitle': 'Push to your instance',
    'deploy.success.title': 'Deployment Successful!',
    'deploy.success.desc': 'Your workflow is now active on your n8n instance.',
    'deploy.open': 'Open in n8n',
    'deploy.desc': 'Ready to launch? This will create a new workflow in your connected n8n instance.\nCredentials are securely handled via environment variables.',
    'deploy.button.deploying': 'Deploying...',
    'deploy.button.idle': 'Deploy to Production',
    'deploy.security': 'End-to-End Encrypted • Secure Environment',
    'hero.title': 'Automate faster with',
    'hero.title.gradient': 'Intelligent Design',
    'hero.subtitle': 'Upload a screen recording or describe your process.\nOur AI architect builds production-ready n8n workflows in seconds.'
  },
  ja: {
    'header.subtitle': 'Pro Edition',
    'input.step': '1',
    'input.title': '要件の定義',
    'input.subtitle': '自動化したいタスクの概要を入力',
    'input.refTemplates': '参照数',
    'input.dropZone.active': 'ここにファイルをドロップ',
    'input.dropZone.idle': '画面録画をここにドロップ',
    'input.dropZone.sub': 'またはクリックして選択 (.mp4, .mov)',
    'input.placeholder': "自然な言葉でワークフローを説明してください...\n例）毎朝9時に指定したURLから商品価格を取得し、10%以上値下がりしていたらSlackに通知する。",
    'input.external.title': '外部コンテキスト',
    'input.external.desc': '参考URLやドキュメントを追加',
    'input.external.placeholder': 'https://example.com/api-docs\nhttps://github.com/n8n-io/workflows',
    'input.external.info': 'AIはこれらのURLの内容を参照して、パラメータ構造をより深く理解します。',
    'input.button.analyzing': '分析中...',
    'input.button.idle': 'プランを作成',
    'input.error': '分析に失敗しました。入力内容やAPIキーを確認してください。',
    'chat.title': 'AIアーキテクト',
    'chat.status.thinking': '思考中...',
    'chat.status.online': 'オンライン',
    'chat.button.constructing': '構築中...',
    'chat.button.confirm': 'プラン確定・構築',
    'chat.placeholder': "プランを調整... (例: 'HTTPリクエストのエラー処理を追加して')",
    'chat.hint': 'Enterで送信。JSON生成前にAIと相談して詳細を詰められます。',
    'result.step': '2',
    'result.title': 'ワークフロー設計図',
    'result.subtitle': '要件に基づいて生成された青写真',
    'result.badge': 'AI生成',
    'result.strategy': '実行戦略',
    'result.patterns': '参考パターン',
    'result.copy': 'コピー',
    'result.copied': '完了',
    'deploy.step': '3',
    'deploy.title': 'デプロイ',
    'deploy.subtitle': 'インスタンスへ反映',
    'deploy.success.title': 'デプロイ完了',
    'deploy.success.desc': 'ワークフローがn8nインスタンスで有効になりました。',
    'deploy.open': 'n8nで開く',
    'deploy.desc': '準備はいいですか？ 接続されたn8nインスタンスに新しいワークフローを作成します。\n認証情報は環境変数で安全に管理されます。',
    'deploy.button.deploying': 'デプロイ中...',
    'deploy.button.idle': '本番環境へデプロイ',
    'deploy.security': 'エンドツーエンド暗号化 • セキュア環境',
    'hero.title': '圧倒的な速度で自動化',
    'hero.title.gradient': 'インテリジェントデザイン',
    'hero.subtitle': '画面録画をアップロードするか、プロセスを説明するだけ。\nAIアーキテクトが、数秒で実用的なn8nワークフローを構築します。'
  }
};

export const t = (lang: Language, key: TranslationKey): string => {
  return translations[lang][key] || key;
};
