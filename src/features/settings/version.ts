export const APP_VERSION = '0.10.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.10.0',
    date: '2026-02-15',
    changes: [
      'Obsidian風のマークダウンプレビューを改善',
      'PC版サイドバーのクリック外閉じに対応',
      '設定画面とバージョン情報を追加',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-14',
    changes: [
      'ファイルツリーのドラッグ＆ドロップ並び替え',
      'ノートの複数選択・一括削除',
      'コンテキストメニューの改善',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-02-13',
    changes: [
      'マークダウンエディタの実装',
      '画像のペースト・ドラッグ＆ドロップアップロード',
      'PWA対応（オフライン動作）',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-02-12',
    changes: [
      'フォルダ構造の実装',
      'ノートの移動・コピー・貼り付け',
      'パンくずリストの追加',
    ],
  },
];
