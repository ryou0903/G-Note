import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import { ChevronRight, Folder, FolderOpen, FileText, Trash2, Check } from 'lucide-react';
import { ContextMenu } from '../../../components/ui/ContextMenu';
import type { Note } from '../../../types';
import type { ClipboardState } from '../../../types/contextMenu';
import { buildFileTree, flattenTree } from '../fileTree';
import type { FlatTreeItem } from '../fileTree';
import { useContextMenuActions } from '../hooks/useContextMenuActions';

interface FileTreeProps {
    notes: Note[];
    activeNoteId: string | null;
    onSelectNote: (id: string) => void;
    onMoveNote: (noteId: string, targetFolder: string) => void;
    onMoveFolder?: (folderId: string | undefined, oldPath: string, newPath: string) => void;
    onDeleteNote?: (id: string) => void;
    onDuplicateNote?: (noteId: string) => void;
    clipboard?: ClipboardState;
    onClipboardChange?: (state: ClipboardState) => void;

    // Actions
    onStartRename?: (type: 'file' | 'folder', id: string, name: string, path: string) => void;
    onShare?: (note: Note) => void;
    onDownload?: (note: Note, format: 'md' | 'txt') => void;
    onCopyNote?: (noteId: string) => void;
    onPasteNote?: (targetFolder: string) => void;
    // Selection mode props
    isSelectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
    // Persisted folders
    persistedFolderPaths?: string[];
    // Folder data with IDs
    folderData?: { id: string; path: string }[];
    onDeleteFolder?: (folderPath: string) => void;
    onCreateNoteInFolder?: (folderPath: string) => void;
    onCreateFolderInFolder?: (parentPath: string) => void;
    onImportFiles?: (folderPath: string) => void;

    // Sort props
    sortType?: SortType;
    onSortChange?: (type: SortType) => void;
    // Expansion control
    expansionCommand?: ExpansionCommand;
    onExpansionChange?: (expandedPaths: Set<string>) => void;
}

export type ExpansionCommand =
    | { type: 'expandTo', paths: string[] }
    | { type: 'expandAll', paths: string[] }
    | { type: 'collapseAll' }
    | null;

// Sort types
export type SortType = 'name-asc' | 'name-desc' | 'updated-desc' | 'updated-asc' | 'created-desc' | 'created-asc';

// Draggable Note Item
interface DraggableProps {
    item: FlatTreeItem;
    isActive: boolean;
    onSelect: () => void;
    onDelete?: () => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: () => void;
    onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
    isHighlighted?: boolean;
}

const DraggableNoteItem: React.FC<DraggableProps> = ({
    item, isActive, onSelect, onDelete, isSelectionMode, isSelected, onToggleSelection, onContextMenu, isHighlighted
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { type: 'note', path: item.path },
        disabled: isSelectionMode,
    });

    const style: React.CSSProperties = {
        WebkitTouchCallout: 'none',
        touchAction: 'pan-y', // スクロールを許可しつつ、D&Dも維持
    };

    const handleClick = () => {
        if (isSelectionMode && onToggleSelection) {
            onToggleSelection();
        } else {
            onSelect();
        }
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={classNames(
                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 group select-none touch-manipulation",
                isActive && !isSelectionMode ? "bg-accent/20 text-white" : "text-secondary hover:bg-surface-highlight/50 hover:text-white",
                isHighlighted && "bg-accent ring-2 ring-primary/50 shadow-[0_0_15px_rgba(var(--color-primary),0.5)] z-10 scale-[1.02]",
                isDragging && "opacity-40 bg-violet-500/20 ring-1 ring-violet-500",
                isSelected && "bg-rose-500/20 ring-1 ring-rose-500"
            )}
            onClick={handleClick}
            onContextMenu={onContextMenu}
        >
            {/* Selection Checkbox (表示モード時のみ) */}
            {isSelectionMode && (
                <div
                    className={classNames(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "border-secondary/50 hover:border-white"
                    )}
                >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
            )}

            <FileText size={14} className="shrink-0" />
            <span className="truncate text-sm flex-1 min-w-0">{item.name}</span>

            {/* Delete button (PC hover時のみ表示) */}
            {!isSelectionMode && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-rose-400 transition-colors rounded"
                    title="削除"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

// Draggable Droppable Folder Item
interface DraggableFolderProps {
    item: FlatTreeItem;
    folderId?: string;
    isOver: boolean;
    onToggle: () => void;
    onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
    canDrag?: boolean;
    dropping?: boolean;
    isSelectionMode?: boolean;
    isClipboard?: boolean;
}

const DraggableDroppableFolderItem: React.FC<DraggableFolderProps> = ({
    item, folderId, isOver, onToggle, onContextMenu, canDrag = false, dropping = false, isClipboard = false
}) => {
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        isDragging,
    } = useDraggable({
        id: folderId || `folder-${item.path}`,
        data: { type: 'folder', path: item.path, folderId },
        disabled: !canDrag,
    });

    const { setNodeRef: setDropRef } = useDroppable({
        id: folderId ? `drop-${folderId}` : `drop-folder-${item.path}`,
        data: { type: 'folder', path: item.path },
    });

    const style: React.CSSProperties = {
        WebkitTouchCallout: 'none',
        touchAction: 'pan-y',
    };

    return (
        <div ref={setDropRef} className="w-full">
            <div
                ref={setDragRef}
                {...(canDrag ? listeners : {})}
                {...(canDrag ? attributes : {})}
                style={style}
                className={classNames(
                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 select-none touch-manipulation",
                    "text-secondary hover:bg-surface-highlight/50 hover:text-white",
                    (isOver || dropping) && "bg-accent/20 ring-1 ring-accent",
                    isDragging && "opacity-40 bg-violet-500/20 ring-1 ring-violet-500",
                    isClipboard && "opacity-50 dashed ring-1 ring-white/20"
                )}
                onClick={onToggle}
                onContextMenu={onContextMenu}
            >
                <ChevronRight
                    size={14}
                    className={classNames(
                        "shrink-0 transition-transform",
                        item.isExpanded && "rotate-90"
                    )}
                />
                {item.isExpanded ? (
                    <FolderOpen size={14} className="shrink-0 text-yellow-500" />
                ) : (
                    <Folder size={14} className="shrink-0 text-yellow-500" />
                )}
                <span className="truncate text-sm font-medium flex-1 min-w-0">{item.name}</span>
            </div>
        </div>
    );
};


// Bottom Root Drop Zone - リスト下部のルートドロップ領域（ドラッグ中のみ表示）
interface BottomDropZoneProps {
    isOver: boolean;
    isDragging: boolean;
}

const BottomRootDropZone: React.FC<BottomDropZoneProps> = ({ isOver, isDragging }) => {
    const { setNodeRef, isOver: isDropOver } = useDroppable({
        id: 'drop-root-bottom',
        data: { type: 'folder', path: '/' },
    });

    const showHighlight = isOver || isDropOver;

    // ドラッグ中でなければ透明なスペーサーとして機能
    if (!isDragging) {
        return <div className="flex-1 min-h-[100px]" />;
    }

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                "flex-1 min-h-[100px] flex items-center justify-center rounded-lg cursor-pointer transition-all select-none touch-manipulation mt-2",
                "border-2 border-dashed",
                showHighlight
                    ? "bg-accent/15 ring-2 ring-accent border-accent text-accent"
                    : "border-gray-500/50 text-secondary/70"
            )}
        >
            <span className="text-sm font-medium">📂 ルートへ移動</span>
        </div>
    );
};

export const FileTree: React.FC<FileTreeProps> = ({
    notes,
    activeNoteId,
    onSelectNote,
    onMoveNote,
    onMoveFolder,
    onDeleteNote,
    onDuplicateNote,
    clipboard,
    onCopyNote,
    onPasteNote,
    isSelectionMode = false,
    selectedIds = new Set(),
    onToggleSelection,
    persistedFolderPaths = [],
    folderData = [],
    onDeleteFolder,
    onCreateNoteInFolder,
    onCreateFolderInFolder,
    onImportFiles,
    onDownload,
    onStartRename,
    onShare,
    onClipboardChange,
    sortType = 'name-asc',
    expansionCommand,
    onExpansionChange,
}) => {
    // モバイル判定 (UI切り替え用: 画面幅 < 768px)
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        target: {
            type: 'file' | 'folder';
            id: string;
            path: string;
            name: string;
            item?: FlatTreeItem;
        }
    } | null>(null);

    const contextMenuActions = useContextMenuActions({
        type: contextMenu?.target.type || 'file',
        id: contextMenu?.target.id || '',
        path: contextMenu?.target.path || '',
        name: contextMenu?.target.name || '',
        clipboard,
        handlers: {
            onCopy: () => onCopyNote?.(contextMenu?.target.id || ''),
            onPaste: () => {
                if (contextMenu?.target.type === 'folder' && onPasteNote) {
                    onPasteNote(contextMenu.target.path);
                }
            },
            onMove: () => {
                if (onClipboardChange && contextMenu) {
                    onClipboardChange({
                        mode: 'move',
                        type: contextMenu.target.type,
                        path: contextMenu.target.path, // folder: path, file: folder path. wait, for file, id is needed.
                        id: contextMenu.target.id
                    });
                    // Show toast? App handles toast on Paste, but on Cut? Maybe here?
                }
            },
            onRename: () => onStartRename?.(
                contextMenu?.target.type || 'file',
                contextMenu?.target.id || '',
                contextMenu?.target.name || '',
                contextMenu?.target.path || ''
            ),
            onShare: () => {
                if (contextMenu?.target.type === 'file') {
                    const note = notes.find(n => n.id === contextMenu.target.id);
                    if (note && onShare) onShare(note);
                }
            },
            onDownloadMD: () => {
                if (contextMenu?.target.type === 'file') {
                    const note = notes.find(n => n.id === contextMenu.target.id);
                    if (note && onDownload) onDownload(note, 'md');
                }
            },
            onDownloadTXT: () => {
                if (contextMenu?.target.type === 'file') {
                    const note = notes.find(n => n.id === contextMenu.target.id);
                    if (note && onDownload) onDownload(note, 'txt');
                }
            },
            onDelete: () => {
                if (contextMenu?.target.type === 'file') onDeleteNote?.(contextMenu.target.id);
                else if (contextMenu?.target.type === 'folder') onDeleteFolder?.(contextMenu.target.path);
            },
            onDuplicate: () => onDuplicateNote?.(contextMenu?.target.id || ''),
            onOpenNewTab: () => {
                if (contextMenu?.target.type === 'file') {
                    window.open(`/note/${contextMenu.target.id}`, '_blank');
                }
            },
            onCreateNote: () => {
                if (contextMenu?.target.type === 'folder' && onCreateNoteInFolder) {
                    onCreateNoteInFolder(contextMenu.target.path);
                }
            },
            onCreateFolder: () => {
                if (contextMenu?.target.type === 'folder' && onCreateFolderInFolder) {
                    onCreateFolderInFolder(contextMenu.target.path);
                }
            },
            onImportFiles: () => {
                if (contextMenu?.target.type === 'folder' && onImportFiles) {
                    onImportFiles(contextMenu.target.path);
                }
            }
        },
        isMobile
    });

    // フォルダ展開状態をlocalStorageから復元
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('gnote_expanded_folders');
            if (saved) {
                return new Set(JSON.parse(saved) as string[]);
            }
        } catch {
            // ignore
        }
        return new Set(['/']);
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overFolderPath, setOverFolderPath] = useState<string | null>(null);

    // フォルダ展開状態を保存
    React.useEffect(() => {
        const paths = [...expandedPaths];
        localStorage.setItem('gnote_expanded_folders', JSON.stringify(paths));
        onExpansionChange?.(expandedPaths);
    }, [expandedPaths, onExpansionChange]);

    // Scroll & Highlight State
    const [scrollToNoteId, setScrollToNoteId] = useState<string | null>(null);
    const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);

    // Clear highlight after delay
    React.useEffect(() => {
        if (highlightedNoteId) {
            const timer = setTimeout(() => setHighlightedNoteId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedNoteId]);



    // Handle expansion commands from parent
    React.useEffect(() => {
        if (!expansionCommand) return;

        if (expansionCommand.type === 'expandTo') {
            setExpandedPaths(prev => {
                const next = new Set(prev);
                expansionCommand.paths.forEach(p => next.add(p));
                return next;
            });
            // Schedule scroll to active note
            if (activeNoteId) {
                setScrollToNoteId(activeNoteId);
            }
        } else if (expansionCommand.type === 'expandAll') {
            // Add all paths to expanded set
            setExpandedPaths(new Set(expansionCommand.paths));
        } else if (expansionCommand.type === 'collapseAll') {
            setExpandedPaths(new Set(['/'])); // Keep root or clear all
        }
    }, [expansionCommand]);

    // Handle expansion commands from parent



    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 300,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const tree = buildFileTree(notes, persistedFolderPaths);
    const flatItemsUnsorted = flattenTree(tree, expandedPaths);

    // ソート関数
    const sortItems = (items: FlatTreeItem[]): FlatTreeItem[] => {
        // 親パスを取得する関数
        const getParentPath = (item: FlatTreeItem): string => {
            if (item.type === 'folder') {
                // フォルダの親パス: /a/b/ → /a/
                const parts = item.path.slice(0, -1).split('/').filter(Boolean);
                parts.pop();
                return parts.length === 0 ? '/' : '/' + parts.join('/') + '/';
            } else {
                // ノートの親パス: noteのfolderプロパティを使用
                return item.note?.folder || '/';
            }
        };

        // 親パスでグループ化
        const groups = new Map<string, FlatTreeItem[]>();
        items.forEach(item => {
            const parentPath = getParentPath(item);
            if (!groups.has(parentPath)) {
                groups.set(parentPath, []);
            }
            groups.get(parentPath)!.push(item);
        });

        // 各グループ内でソート
        groups.forEach((groupItems) => {
            groupItems.sort((a, b) => {
                // フォルダを優先
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;

                switch (sortType) {
                    case 'name-asc':
                        return a.name.localeCompare(b.name, 'ja');
                    case 'name-desc':
                        return b.name.localeCompare(a.name, 'ja');
                    case 'updated-desc':
                        return (b.note?.updatedAt?.getTime() || 0) - (a.note?.updatedAt?.getTime() || 0);
                    case 'updated-asc':
                        return (a.note?.updatedAt?.getTime() || 0) - (b.note?.updatedAt?.getTime() || 0);
                    case 'created-desc':
                        return (b.note?.createdAt?.getTime() || 0) - (a.note?.createdAt?.getTime() || 0);
                    case 'created-asc':
                        return (a.note?.createdAt?.getTime() || 0) - (b.note?.createdAt?.getTime() || 0);
                    default:
                        return 0;
                }
            });
        });

        // 階層順に再構築（深さ優先）
        const result: FlatTreeItem[] = [];
        const addChildren = (parentPath: string) => {
            const children = groups.get(parentPath) || [];
            children.forEach(child => {
                result.push(child);
                if (child.type === 'folder') {
                    addChildren(child.path);
                }
            });
        };
        addChildren('/');
        return result;
    };

    const flatItems = sortItems(flatItemsUnsorted);

    // Handle scroll (Moved here to access flatItems)
    React.useEffect(() => {
        if (scrollToNoteId) {
            const element = document.getElementById(`file-tree-note-${scrollToNoteId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedNoteId(scrollToNoteId);
                setScrollToNoteId(null);
            }
        }
    }, [scrollToNoteId, flatItems]);

    const toggleFolder = (path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };


    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setOverFolderPath(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (over) {
            const activeData = active.data.current as { type: string; path: string } | undefined;
            const overData = over.data.current as { type: string; path: string } | undefined;

            if (overData?.type === 'folder') {
                // 1. 自分自身、または既に所属しているフォルダへの移動は表示しない
                if (activeData?.path === overData.path) {
                    setOverFolderPath(null);
                    return;
                }

                // 2. フォルダを移動する場合：自分の配下（子フォルダ）への移動は不可
                // パスが `/work/` で `startsWith` を使えば `/work/sub/` なども正しく判定可能
                if (activeData?.type === 'folder' && overData.path.startsWith(activeData.path)) {
                    setOverFolderPath(null);
                    return;
                }

                setOverFolderPath(overData.path);
            } else {
                setOverFolderPath(null);
            }
        } else {
            setOverFolderPath(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta, activatorEvent } = event;

        setActiveId(null);
        setOverFolderPath(null);

        // モバイルでのタップ/ロングタップ判定 (移動距離が小さい場合はコンテキストメニュー)
        const distance = Math.sqrt(delta.x ** 2 + delta.y ** 2);

        if (isMobile && distance < 10 && activatorEvent) {
            const item = flatItems.find(i => i.id === active.id) ||
                flatItems.find(i => i.type === 'folder' && (
                    folderData.find(f => f.id === active.id)?.path === i.path ||
                    active.id === `folder-${i.path}`
                ));

            if (item) {
                handleContextMenu(activatorEvent as any, item);
                return;
            }
        }

        if (!over || active.id === over.id) return;

        const activeData = active.data.current as { type: string; path: string; folderId?: string } | undefined;
        const overData = over.data.current as { type: string; path: string } | undefined;

        if (!overData || overData.type !== 'folder') return;

        const targetFolder = overData.path;

        if (activeData?.type === 'note') {
            // Moving a note
            onMoveNote(active.id as string, targetFolder);
        } else if (activeData?.type === 'folder' && onMoveFolder) {
            // Moving a folder
            const oldPath = activeData.path;
            const targetFolder = overData.path; // targetFolder is already defined above, but activeData.path was activeData.path.

            // Prevent moving folder into itself or its children
            if (targetFolder.startsWith(oldPath)) {
                console.warn('Cannot move folder into itself');
                return;
            }

            // Calculate new path
            const folderName = oldPath.split('/').filter(Boolean).pop() || '';
            const newPath = targetFolder === '/' ? `/${folderName}/` : `${targetFolder}${folderName}/`;

            // folderId may be undefined for virtual folders
            onMoveFolder(activeData.folderId, oldPath, newPath);
        }
    };

    const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, item: FlatTreeItem) => {
        e.preventDefault();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        setContextMenu({
            x: clientX,
            y: clientY,
            target: {
                type: item.type === 'note' ? 'file' : 'folder',
                id: item.type === 'note' ? item.id : item.path,
                path: item.path,
                name: item.name,
                item: item
            }
        });
    };

    // activeItem を取得（ノートは id で、フォルダは folderId または path で検索）
    const activeItem = activeId ? (
        flatItems.find(i => i.id === activeId) ||
        flatItems.find(i => i.type === 'folder' && (
            folderData.find(f => f.id === activeId)?.path === i.path ||
            activeId === `folder-${i.path}`
        ))
    ) : null;




    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col min-h-full pb-4">
                {/* アイテムリスト */}
                <div className="space-y-0.5">
                    {flatItems.map(item => (
                        <div
                            key={item.id}
                            id={`file-tree-note-${item.id}`} // For scrolling
                            style={{ paddingLeft: `${item.depth * 12}px` }}
                            onContextMenu={(e) => {
                                if (isMobile) {
                                    e.preventDefault();
                                    return;
                                }
                                handleContextMenu(e, item);
                            }}
                        >
                            {item.type === 'folder' ? (
                                <DraggableDroppableFolderItem
                                    item={item}
                                    folderId={folderData.find(f => f.path === item.path)?.id}
                                    isOver={overFolderPath === item.path}
                                    onToggle={() => toggleFolder(item.path)}
                                    onContextMenu={(e: React.MouseEvent | React.TouchEvent) => {
                                        if (isMobile) return;
                                        handleContextMenu(e, item);
                                    }}
                                    isSelectionMode={isSelectionMode}
                                    canDrag={item.path !== '/' && item.path !== '/Inbox/' && !isSelectionMode}
                                    isClipboard={clipboard?.type === 'folder' && clipboard?.path === item.path && clipboard?.mode === 'move'}
                                />
                            ) : (
                                <DraggableNoteItem
                                    item={item}
                                    isActive={item.id === activeNoteId}
                                    onSelect={() => onSelectNote(item.id)}
                                    onDelete={onDeleteNote ? () => onDeleteNote(item.id) : undefined}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(item.id)}
                                    onToggleSelection={onToggleSelection ? () => onToggleSelection(item.id) : undefined}
                                    onContextMenu={(e) => {
                                        if (isMobile) return;
                                        handleContextMenu(e, item);
                                    }}
                                    isHighlighted={highlightedNoteId === item.id}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* リスト下部のルートドロップ領域 */}
                <BottomRootDropZone isOver={overFolderPath === '/'} isDragging={activeId !== null} />
            </div>

            <DragOverlay dropAnimation={null}>
                {activeItem && (
                    <div className="relative pointer-events-none">
                        {/* 移動先テキスト（絶対配置で上に表示） */}
                        {overFolderPath && (
                            <div className="absolute bottom-full left-0 mb-1 px-3 py-1 bg-[#1e1e2e] border border-violet-500/50 rounded text-xs text-secondary whitespace-nowrap">
                                "{overFolderPath === '/' ? 'ルート' : overFolderPath.split('/').filter(Boolean).pop()}" に移動
                            </div>
                        )}
                        {/* アイテム本体 */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e] border border-violet-500/50 rounded-lg shadow-2xl min-w-[180px] text-white">
                            {activeItem.type === 'folder' ? (
                                <Folder size={14} className="text-yellow-500" />
                            ) : (
                                <FileText size={14} />
                            )}
                            <span className="text-sm font-medium">{activeItem.name}</span>
                        </div>
                    </div>
                )}
            </DragOverlay>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuActions}
                    headerInfo={
                        contextMenu.target.item && contextMenu.target.type === 'file' && contextMenu.target.item.note
                            ? {
                                title: contextMenu.target.name,
                                type: 'file',
                                updatedAt: contextMenu.target.item.note.updatedAt?.toLocaleString('ja-JP'),
                                createdAt: contextMenu.target.item.note.createdAt?.toLocaleString('ja-JP')
                            }
                            : contextMenu.target.item && contextMenu.target.type === 'folder'
                                ? {
                                    title: contextMenu.target.name,
                                    type: 'folder'
                                }
                                : undefined
                    }
                    onClose={() => setContextMenu(null)}
                    isMobile={isMobile}
                />
            )}
        </DndContext>
    );
};
