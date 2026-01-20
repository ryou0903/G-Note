import { useMemo } from 'react';
import {
    FileText,
    Copy,
    FolderInput,
    Share2,
    Download,
    Trash2,
    Pencil,
    FilePlus2,
    Clipboard,
    ExternalLink
} from 'lucide-react';
import type { ContextMenuItem, ClipboardState } from '../../../types/contextMenu';

interface UseContextMenuActionsProps {
    type: 'file' | 'folder';
    id: string;
    path: string; // folder path (e.g. /A/B/) or note folder
    name: string;
    clipboard?: ClipboardState;
    handlers: {
        onCopy: () => void;
        onPaste?: () => void;
        onMove: () => void;     // Cut / Start Move
        onRename: () => void;
        onShare?: () => void;
        onDownloadMD?: () => void;
        onDownloadTXT?: () => void;
        onDelete: () => void;
        onDuplicate?: () => void;
        onOpenNewTab?: () => void;
        onCreateNote?: () => void;
        onCreateFolder?: () => void;
        onImportFiles?: () => void;
    };
    isMobile?: boolean;
}

export const useContextMenuActions = ({
    type,
    id,
    path,
    name,
    clipboard,
    handlers,
    isMobile = false
}: UseContextMenuActionsProps): ContextMenuItem[] => {

    const items = useMemo(() => {
        const menuItems: ContextMenuItem[] = [];
        const isClipboardActive = clipboard?.mode === 'move' || clipboard?.mode === 'copy';

        // 1. Primary Actions (Open, etc.)
        if (handlers.onOpenNewTab) {
            menuItems.push({
                label: '新しいタブで開く',
                icon: <ExternalLink size={16} />,
                action: 'OPEN_NEW_TAB',
                onClick: handlers.onOpenNewTab,
                group: 'primary'
            });
        }

        // 2. File Operations (Copy, Move, Paste)
        // Paste Option (Only for folders or if we want to support pasting into current folder of a file)
        // Usually paste is on folder.
        if (type === 'folder' && isClipboardActive && handlers.onPaste) {
            const isMove = clipboard.mode === 'move';
            // 自分自身への移動/コピーは無効だが、ここでは表示してハンドラ側で弾くか、ここで非表示にするか。
            // わかりやすさのため表示して、ハンドラでトースト出すのが親切かも。

            menuItems.push({
                label: isMove ? 'ここに移動' : 'ここに貼り付け',
                icon: <Clipboard size={16} />,
                action: 'PASTE',
                onClick: handlers.onPaste,
                group: 'file-ops'
            });
        }

        menuItems.push({
            label: '名前を変更',
            icon: <Pencil size={16} />,
            action: 'RENAME',
            onClick: handlers.onRename,
            group: 'file-ops'
        });

        if (handlers.onDuplicate) {
            menuItems.push({
                label: '複製',
                icon: <FilePlus2 size={16} />,
                action: 'DUPLICATE',
                onClick: handlers.onDuplicate,
                group: 'file-ops'
            });
        }

        menuItems.push({
            label: 'コピー',
            icon: <Copy size={16} />,
            action: 'COPY',
            onClick: handlers.onCopy,
            group: 'file-ops'
        });

        menuItems.push({
            label: 'ファイルを移動',
            icon: <FolderInput size={16} />,
            action: 'MOVE',
            onClick: handlers.onMove,
            group: 'file-ops'
        });

        // 3. System / Export Actions
        if (handlers.onShare) {
            menuItems.push({
                label: '共有',
                icon: <Share2 size={16} />,
                action: 'SHARE',
                onClick: handlers.onShare,
                group: 'system'
            });
        }

        if (type === 'file' && handlers.onDownloadMD && handlers.onDownloadTXT) {
            menuItems.push({
                label: 'MDをダウンロード',
                icon: <Download size={16} />,
                action: 'DOWNLOAD_MD',
                onClick: handlers.onDownloadMD,
                group: 'export'
            });
            menuItems.push({
                label: 'TXTをダウンロード',
                icon: <FileText size={16} />,
                action: 'DOWNLOAD_TXT',
                onClick: handlers.onDownloadTXT,
                group: 'export'
            });
        }

        // 4. Folder Specific Actions (New Note, New Folder, Import)
        if (type === 'folder') {
            if (handlers.onCreateNote) {
                menuItems.push({
                    label: '新規ノート作成',
                    icon: <FilePlus2 size={16} />,
                    action: 'CREATE_NOTE',
                    onClick: handlers.onCreateNote,
                    group: 'file-ops'
                });
            }
            if (handlers.onCreateFolder) {
                menuItems.push({
                    label: '新規フォルダ作成',
                    icon: <FolderInput size={16} />,
                    action: 'CREATE_FOLDER',
                    onClick: handlers.onCreateFolder,
                    group: 'file-ops'
                });
            }
            if (handlers.onImportFiles) {
                menuItems.push({
                    label: 'ファイルをインポート',
                    icon: <Download size={16} className="rotate-180" />, // Using download rotated for import
                    action: 'IMPORT_FILES',
                    onClick: handlers.onImportFiles,
                    group: 'file-ops'
                });
            }
        }

        // 4. Danger Zone
        menuItems.push({
            label: '削除',
            icon: <Trash2 size={16} />,
            action: 'DELETE',
            onClick: handlers.onDelete,
            variant: 'danger',
            group: 'danger'
        });

        return menuItems;
    }, [type, id, path, name, clipboard, handlers, isMobile]);

    return items;
};
