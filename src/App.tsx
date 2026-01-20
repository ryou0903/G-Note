import { useState, useEffect } from 'react';
import { MainLayout } from './features/layout/MainLayout';
import { AuthGuard } from './components/AuthGuard';
import { useNotes } from './features/filesystem/useNotes';
import { useFolders } from './features/filesystem/useFolders';
import { FileTree, type SortType, type ExpansionCommand } from './features/filesystem/components/FileTree';
import { getAllParentPaths, getAllFolderPaths, buildFileTree } from './features/filesystem/fileTree';
import { FolderCreateModal } from './features/filesystem/components/FolderCreateModal';
import { RenameModal } from './features/filesystem/components/RenameModal';
import { Editor } from './features/editor/components/Editor';
import classNames from 'classnames';
import { FileText, FolderPlus, CheckSquare, X, Trash2 } from 'lucide-react';
import { Breadcrumbs } from './components/ui/Breadcrumbs';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import type { ClipboardState } from './types/contextMenu';
import type { Note } from './types';

// LocalStorage keys
const STORAGE_KEYS = {
  LAST_NOTE_ID: 'gnote_last_note_id',
  EXPANDED_FOLDERS: 'gnote_expanded_folders',
  SORT_TYPE: 'gnote_sort_type',
};

function App() {
  const { notes, loading, createNote, updateNote, deleteNote, deleteNotes } = useNotes();
  const { folders, createFolder, deleteFolder, moveFolder } = useFolders();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    // 最後に開いていたノートを復元
    return localStorage.getItem(STORAGE_KEYS.LAST_NOTE_ID);
  });
  const [isRendering, setIsRendering] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalParent, setFolderModalParent] = useState('/');

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clipboard state for copy/paste
  // const [clipboardNoteId, setClipboardNoteId] = useState<string | null>(null); // REMOVED

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state (localStorageから復元)
  const [sortType, setSortType] = useState<SortType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SORT_TYPE);
    return (saved as SortType) || 'name-asc';
  });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; icon?: 'note' | 'folder' } | null>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success', icon?: 'note' | 'folder') => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3000);
  };

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    variant: 'default' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: () => { },
  });

  // クリップボード状態 (移動/コピー操作用)
  const [clipboard, setClipboard] = useState<ClipboardState>({
    mode: null,
    type: null,
    path: null,
  });

  // Rename Modal State
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    type: 'file' | 'folder';
    id: string; // for notes
    path: string; // for folders (and notes current path?)
    currentName: string;
  }>({
    isOpen: false,
    type: 'file',
    id: '',
    path: '',
    currentName: ''
  });

  // 最後に開いていたノートIDを保存
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem(STORAGE_KEYS.LAST_NOTE_ID, activeNoteId);
    }
  }, [activeNoteId]);

  // ソート設定を保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_TYPE, sortType);
  }, [sortType]);

  // 保存されたノートIDが存在しない場合はクリア
  useEffect(() => {
    if (!loading && activeNoteId && !notes.find(n => n.id === activeNoteId)) {
      setActiveNoteId(null);
      localStorage.removeItem(STORAGE_KEYS.LAST_NOTE_ID);
    }
  }, [loading, notes, activeNoteId]);

  // Filter notes based on search query (title and content)
  const filteredNotes = searchQuery.trim()
    ? notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : notes;

  // Active note object
  const activeNote = notes.find(n => n.id === activeNoteId);

  // Expansion control
  const [expansionCommand, setExpansionCommand] = useState<ExpansionCommand>(null);
  const [isAnyFolderExpanded, setIsAnyFolderExpanded] = useState(false);

  const handleExpandToActiveNote = () => {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    // Note root path is '/', but if note.folder is set, use it.
    // If note is in root, parent path is ['/'].
    // If note is in /A/B/, parent paths are ['/', '/A/', '/A/B/'].

    // If folder is root or empty, nothing to expand (root is always expanded in our logic usually)
    if (!note.folder || note.folder === '/') return;

    const parentPaths = getAllParentPaths(note.folder);
    setExpansionCommand({ type: 'expandTo', paths: parentPaths });
    // Reset command after a brief moment to allow re-triggering? 
    // useEffect in FileTree will react to change. If we set same value, it might not trigger.
    // But object identity changes { type... } so it should trigger.
    // Ideally we reset to null, but let's keep it simple.
  };

  const handleToggleAllFolders = () => {
    if (isAnyFolderExpanded) {
      setExpansionCommand({ type: 'collapseAll' });
    } else {
      const allPersistedPaths = folders.map(f => f.path);
      const root = buildFileTree(notes, allPersistedPaths);
      const allPaths = getAllFolderPaths(root);

      setExpansionCommand({ type: 'expandAll', paths: allPaths });
    }
  };

  const handleExpansionChange = (expandedPaths: Set<string>) => {
    setIsAnyFolderExpanded(expandedPaths.size > 1);
  };

  const handleCreateNote = async (folder = '/') => {
    try {
      const title = '無題のノート';
      console.log('Creating note in folder:', folder);
      // Ensure Inbox folder exists
      if (folder === '/Inbox/' && !folders.find(f => f.path === '/Inbox/')) {
        await createFolder('/Inbox/', 'Inbox');
      }
      await createNote(title, '', folder);
      showToast(`ノートを作成しました（${folder === '/Inbox/' ? 'Inbox' : folder === '/' ? 'ルート' : folder}）`, 'success', 'note');
    } catch (e) {
      console.error(e);
      showToast('ノート作成エラー', 'error');
    }
  };

  const handleMoveNote = async (noteId: string, targetFolder: string) => {
    console.log('Moving note', noteId, 'to', targetFolder);
    await updateNote(noteId, { folder: targetFolder });
  };

  const handleUpdateContent = (content: string) => {
    if (activeNoteId) {
      updateNote(activeNoteId, { content });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setConfirmDialog({
      isOpen: true,
      title: 'ノートを削除',
      message: `「${note?.title || '無題'}」を削除しますか？`,
      variant: 'danger',
      onConfirm: async () => {
        await deleteNote(noteId);
        if (activeNoteId === noteId) {
          setActiveNoteId(null);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('ノートを削除しました', 'success', 'note');
      },
    });
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    // Show explicit warning with note titles
    const selectedNotes = notes.filter(n => selectedIds.has(n.id));
    const titleList = selectedNotes.slice(0, 5).map(n => <div key={n.id} className="text-slate-300">・{n.title}</div>);
    const moreText = selectedNotes.length > 5 ? <div className="text-slate-400">...他 {selectedNotes.length - 5} 件</div> : null;

    setConfirmDialog({
      isOpen: true,
      title: `${selectedIds.size} 件を削除`,
      message: (
        <div className="space-y-2">
          <p>以下のノートを削除します。</p>
          <div className="text-sm space-y-0.5">{titleList}{moreText}</div>
          <p className="text-rose-400 text-sm mt-3">この操作は取り消せません。</p>
        </div>
      ),
      variant: 'danger',
      onConfirm: async () => {
        await deleteNotes(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        if (activeNoteId && selectedIds.has(activeNoteId)) {
          setActiveNoteId(null);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`${selectedIds.size} 件のノートを削除しました`, 'success', 'note');
      },
    });
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      // Exiting selection mode, clear selections
      setSelectedIds(new Set());
    }
    setIsSelectionMode(!isSelectionMode);
  };

  // Removed selectAll - dangerous operation, users should select manually

  // Create a real folder in Firestore
  const handleCreateFolder = async (folderPath: string) => {
    console.log('Creating folder:', folderPath);
    const name = folderPath.split('/').filter(Boolean).pop() || 'Folder';
    await createFolder(folderPath, name);
    showToast(`フォルダを作成しました（${name}）`, 'success', 'folder');
  };

  const openFolderModal = (parentPath = '/') => {
    setFolderModalParent(parentPath);
    setFolderModalOpen(true);
  };

  // Duplicate note (create copy in same folder)
  const handleDuplicateNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    await createNote(`${note.title} のコピー`, note.content, note.folder || '/');
  };

  // Copy note to clipboard
  const handleCopyNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setClipboard({ mode: 'copy', type: 'file', path: note.folder || null, id: noteId });
      showToast('ノートをコピーしました（貼り付け先を選択してください）', 'success', 'note');
    }
  };

  // Paste note from clipboard to target folder
  const handlePasteNote = async (targetFolder: string) => {
    if (!clipboard.type) return;

    if (clipboard.mode === 'move') {
      // Move Handiling
      if (clipboard.type === 'file' && clipboard.id) {
        await updateNote(clipboard.id, { folder: targetFolder });
        showToast('ノートを移動しました', 'success', 'note');
      } else if (clipboard.type === 'folder' && clipboard.path) {
        // Folder Move
        const folderName = clipboard.path.split('/').filter(Boolean).pop();
        const newPath = targetFolder === '/'
          ? `/${folderName}/`
          : `${targetFolder}${folderName}/`;

        if (newPath.startsWith(clipboard.path)) {
          showToast('自分のサブフォルダには移動できません', 'error', 'folder');
          setClipboard({ mode: null, type: null, path: null });
          return;
        }
        // ID is needed for moveFolder if we want to update the folder doc itself
        await moveFolder(clipboard.id, clipboard.path, newPath);
        showToast('フォルダを移動しました', 'success', 'folder');
      }
    } else if (clipboard.mode === 'copy') {
      // Copy Handling
      if (clipboard.type === 'file' && clipboard.id) {
        const noteToCopy = notes.find(n => n.id === clipboard.id);
        if (noteToCopy) {
          await createNote(
            `${noteToCopy.title} のコピー`,
            noteToCopy.content,
            targetFolder
          );
          showToast('ノートを貼り付けました', 'success', 'note');
        }
      }
    }
    setClipboard({ mode: null, type: null, path: null });
  };

  // Rename Handler
  const handleStartRename = (type: 'file' | 'folder', id: string, name: string, path: string) => {
    setRenameModal({ isOpen: true, type, id, path, currentName: name });
  };

  const handleRenameConfirm = async (newName: string) => {
    try {
      if (renameModal.type === 'file') {
        await updateNote(renameModal.id, { title: newName });
      } else {
        const segments = renameModal.path.split('/').filter(Boolean);
        segments.pop();
        segments.push(newName);
        const newPath = '/' + segments.join('/') + '/';
        const folder = folders.find(f => f.path === renameModal.path);
        await moveFolder(folder?.id, renameModal.path, newPath);
      }
      showToast('名前を変更しました', 'success', renameModal.type === 'file' ? 'note' : 'folder');
    } catch (error) {
      console.error('Rename failed', error);
      showToast('名前の変更に失敗しました', 'error');
    }
  };

  // Share Handler
  // Robust Copy Helper
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API failed, using fallback...', err);
      }
    }

    // 2. Fallback: textarea hack (for HTTP/non-secure contexts)
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Ensure element is not visible but part of DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (e) {
      console.error('Copy fallback failed', e);
      return false;
    }
  };

  // Share Handler
  const handleShare = async (note: Note) => {
    const shareData = { title: note.title, text: note.content };

    // 1. Try Web Share API (Mobile mainly)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return; // Success (OS UI shown)
      } catch (err) {
        // User cancelled share
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('Web Share failed, falling back to clipboard', err);
      }
    }

    // 2. Fallback: Copy to formatted text
    const textToCopy = `${note.title}\n\n${note.content}`;
    const success = await copyToClipboard(textToCopy);

    if (success) {
      showToast('クリップボードにコピーしました', 'success', 'note');
    } else {
      showToast('共有に失敗しました（コピーできませんでした）', 'error');
    }
  };

  // Import local .txt/.md files
  const handleImportFiles = (targetFolder: string) => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.txt,.md,.markdown';

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      let importedCount = 0;
      for (const file of Array.from(files)) {
        try {
          const content = await file.text();
          // Use filename without extension as title
          const title = file.name.replace(/\.(txt|md|markdown)$/i, '');
          await createNote(title, content, targetFolder);
          importedCount++;
        } catch (err) {
          console.error(`Failed to import ${file.name}:`, err);
        }
      }

      if (importedCount > 0) {
        alert(`${importedCount} 件のファイルをインポートしました。`);
      }
    };

    input.click();
  };

  // Download note as MD or TXT file
  const handleDownloadNote = (noteId: string, format: 'md' | 'txt') => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const content = note.content;
    const filename = `${note.title}.${format}`;
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGuard>
      <MainLayout
        onFabClick={() => handleCreateNote('/Inbox/')}
        onSearch={setSearchQuery}
        onCreateNote={() => handleCreateNote('/Inbox/')}
        onCreateFolder={() => {
          setFolderModalParent('/');
          setFolderModalOpen(true);
        }}
        noteCount={notes.length}
        folderCount={folders.length}
        sortType={sortType}
        onSortChange={setSortType}
        onExpandToActiveFile={handleExpandToActiveNote}
        onToggleAllFolders={handleToggleAllFolders}
        isAnyExpanded={isAnyFolderExpanded}
        sidebar={
          <div className="flex flex-col h-full">
            {/* Folder Actions Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
              <span className="text-xs text-secondary uppercase font-semibold tracking-wider">ファイル</span>
              <div className="flex items-center gap-1">
                {/* Selection Mode Toggle */}
                <button
                  onClick={toggleSelectionMode}
                  className={classNames(
                    "p-1.5 rounded-lg transition-colors",
                    isSelectionMode
                      ? "text-rose-400 bg-rose-500/20"
                      : "text-secondary hover:text-white hover:bg-surface-highlight"
                  )}
                  title={isSelectionMode ? "選択モードを終了" : "複数選択"}
                >
                  {isSelectionMode ? <X size={16} /> : <CheckSquare size={16} />}
                </button>
                {/* New Folder Button */}
                <button
                  onClick={() => openFolderModal('/')}
                  className="p-1.5 text-secondary hover:text-yellow-500 hover:bg-surface-highlight rounded-lg transition-colors"
                  title="新しいフォルダを作成"
                >
                  <FolderPlus size={16} />
                </button>
              </div>
            </div>

            {/* Selection Mode Action Bar */}
            {isSelectionMode && (
              <div className="flex items-center justify-between px-3 py-2 bg-rose-500/10 border-b border-rose-500/30">
                <span className="text-xs text-rose-400 font-medium">
                  🗑️ {selectedIds.size} 件選択中
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className={classNames(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors",
                    selectedIds.size > 0
                      ? "bg-rose-500 text-white hover:bg-rose-600"
                      : "bg-surface-highlight text-secondary cursor-not-allowed"
                  )}
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            )}

            {loading ? (
              <div className="p-4 text-center text-sm text-secondary animate-pulse">読み込み中...</div>
            ) : filteredNotes.length === 0 && searchQuery.trim() ? (
              <div className="p-4 text-center text-sm text-secondary">
                「{searchQuery}」に一致するノートがありません
              </div>
            ) : notes.length === 0 ? (
              <div className="p-4 text-center text-sm text-secondary">ノートがありません</div>
            ) : (
              <div className="flex-1 overflow-y-auto px-2 py-2">
                <FileTree
                  notes={filteredNotes}
                  activeNoteId={activeNoteId}
                  onSelectNote={setActiveNoteId}
                  onMoveNote={handleMoveNote}
                  onMoveFolder={(folderId, oldPath, newPath) => moveFolder(folderId, oldPath, newPath)}
                  onDeleteNote={handleDeleteNote}
                  onDuplicateNote={handleDuplicateNote}

                  clipboard={clipboard}
                  onClipboardChange={setClipboard}
                  onCopyNote={handleCopyNote}
                  onPasteNote={handlePasteNote}
                  onStartRename={handleStartRename}
                  onShare={handleShare}
                  onDownload={(note, format) => handleDownloadNote(note.id, format)}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelection={handleToggleSelection}
                  persistedFolderPaths={folders.map(f => f.path)}
                  folderData={folders.map(f => ({ id: f.id, path: f.path }))}
                  expansionCommand={expansionCommand}
                  onExpansionChange={handleExpansionChange}
                  onDeleteFolder={(path) => {
                    const folder = folders.find(f => f.path === path);
                    const folderName = path.split('/').filter(Boolean).pop() || 'フォルダ';
                    setConfirmDialog({
                      isOpen: true,
                      title: 'フォルダを削除',
                      message: (
                        <div className="space-y-2">
                          <p>「{folderName}」を削除しますか？</p>
                          <p className="text-rose-400 text-sm">⚠️ 中身のノートもすべて削除されます。</p>
                        </div>
                      ),
                      variant: 'danger',
                      onConfirm: async () => {
                        const id = folder?.id || 'virtual_folder';
                        await deleteFolder(id, path, true);
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        showToast(`フォルダを削除しました（${folderName}）`, 'success', 'folder');
                      },
                    });
                  }}
                  onCreateNoteInFolder={(path) => handleCreateNote(path)}
                  onCreateFolderInFolder={(parentPath) => openFolderModal(parentPath)}
                  onImportFiles={handleImportFiles}

                  sortType={sortType}
                />
              </div>
            )}
          </div>
        }
      >
        <div className="flex h-full w-full">
          {activeNote ? (
            <div className="flex flex-col h-full w-full">
              <header className="flex flex-col p-4 border-b border-border bg-midnight/50 backdrop-blur-sm sticky top-0 z-10">
                {/* パンくずリスト */}
                <Breadcrumbs
                  path={activeNote.folder || '/'}
                  className="mb-2"
                />
                {/* タイトルとアクション */}
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none w-full placeholder:text-secondary/50"
                    placeholder="ノートのタイトル"
                  />
                  <div className="flex items-center gap-2 ml-4">
                    {/* Delete current note */}
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-2 text-secondary hover:text-rose-400 transition-colors rounded-lg hover:bg-surface-highlight"
                      title="削除"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => setIsRendering(!isRendering)}
                      className={classNames(
                        "px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm",
                        isRendering
                          ? "bg-accent/20 text-accent border border-accent/20"
                          : "bg-surface text-secondary border border-border hover:bg-surface-highlight hover:text-white"
                      )}
                    >
                      {isRendering ? '編集' : 'プレビュー'}
                    </button>
                  </div>
                </div>
              </header>
              <div className="flex-1 overflow-hidden relative">
                <Editor
                  initialContent={activeNote.content}
                  isRendering={isRendering}
                  onSave={handleUpdateContent}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-secondary animate-fade-in p-6">
              <div className="p-6 rounded-full bg-surface-highlight/30 mb-6">
                <FileText size={48} className="opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">最初のノートを作成</h3>
              <p className="text-center max-w-sm mb-8">
                ＋ボタンをタップして、思考の記録を始めましょう。
                AI機能も順次追加されます。
              </p>
              <button
                onClick={() => handleCreateNote()}
                className="px-8 py-3 bg-accent hover:bg-indigo-400 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
              >
                新規作成
              </button>
            </div>
          )}
        </div>
      </MainLayout>

      <RenameModal
        isOpen={renameModal.isOpen}
        currentName={renameModal.currentName}
        type={renameModal.type}
        onClose={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleRenameConfirm}
      />

      {/* Folder Create Modal */}
      <FolderCreateModal
        isOpen={folderModalOpen}
        parentPath={folderModalParent}
        availableFolders={folders.map(f => f.path)}
        onClose={() => setFolderModalOpen(false)}
        onConfirm={handleCreateFolder}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center pointer-events-none">
          <div
            className={classNames(
              // Liquid Glass Dark Mode
              "pointer-events-auto px-5 py-3 rounded-2xl",
              "bg-slate-900/80 backdrop-blur-xl",
              "border border-white/10",
              "shadow-2xl shadow-black/50",
              "animate-slide-up flex items-center gap-3",
              toast.type === 'success' ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {/* Glass shine overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            {toast.icon === 'note' && <FileText size={18} className="relative" />}
            {toast.icon === 'folder' && <FolderPlus size={18} className="relative" />}
            <span className="text-sm font-medium relative">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </AuthGuard>
  )
}

export default App
