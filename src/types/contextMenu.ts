import type { ReactNode } from 'react';

/**
 * コンテキストメニューのアクション種別
 * ロジックとUIを分離するために使用
 */
export type ContextMenuActionType =
    | 'OPEN_NEW_TAB'
    | 'COPY'
    | 'DUPLICATE'
    | 'MOVE'
    | 'PASTE' // "ここに移動"
    | 'DOWNLOAD_MD'
    | 'DOWNLOAD_TXT'
    | 'SHARE'
    | 'RENAME'
    | 'DELETE'
    | 'COPY_PATH'
    | 'HISTORY'
    | 'CREATE_NOTE'
    | 'CREATE_FOLDER'
    | 'IMPORT_FILES';

/**
 * コンテキストメニューの各アイテム定義
 */
export interface ContextMenuItem {
    label: string;
    icon?: ReactNode;
    action?: ContextMenuActionType;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    group?: 'primary' | 'file-ops' | 'export' | 'system' | 'danger' | string; // グルーピング用
    disabled?: boolean;
}

/**
 * コンテキストメニューの状態（表示位置、内容）
 */
export interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
    // ヘッダー情報 (Obsidian風UI用)
    headerInfo?: {
        title: string;
        type: 'file' | 'folder';
        updatedAt?: string;
        createdAt?: string;
    };
}

/**
 * クリップボード操作モード
 */
export type ClipboardMode = 'copy' | 'move';

/**
 * アプリケーション全体のクリップボード状態（移動/コピー操作用）
 */
export interface ClipboardState {
    mode: ClipboardMode | null;
    type: 'file' | 'folder' | null;
    path: string | null; // 対象のパス
    id?: string;         // ノートの場合のID
    timestamp?: number;  // 操作開始時刻 (有効期限判定など将来用)
}
