import React, { useState } from 'react';
import classNames from 'classnames';
import { FileEdit, FolderPlus, ArrowUpDown, Locate, ChevronRight, Settings, Folder, Menu, PanelLeft, Plus, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { SettingsModal } from '../settings/SettingsModal';

interface MainLayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
    onFabClick?: () => void;
    onSearch?: (query: string) => void;
    // Toolbar button handlers
    onCreateNote?: () => void;
    onCreateFolder?: () => void;
    // Statistics
    noteCount?: number;
    folderCount?: number;
    // Sort
    sortType?: SortType;
    onSortChange?: (type: SortType) => void;
    // Expansion control
    onExpandToActiveFile?: () => void;
    onToggleAllFolders?: () => void;
    isAnyExpanded?: boolean;
}

// Sort types (same as FileTree)
type SortType = 'name-asc' | 'name-desc' | 'updated-desc' | 'updated-asc' | 'created-desc' | 'created-asc';

// Custom hook for media query to ensure robust overlay handling
function useMediaQuery(query: string) {
    const subscribe = React.useCallback(
        (callback: () => void) => {
            const matchMedia = window.matchMedia(query);
            matchMedia.addEventListener('change', callback);
            return () => matchMedia.removeEventListener('change', callback);
        },
        [query]
    );

    const getSnapshot = () => window.matchMedia(query).matches;
    const getServerSnapshot = () => false;

    return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    sidebar,
    onFabClick,
    onCreateNote,
    onCreateFolder,
    noteCount = 0,
    folderCount = 0,
    sortType = 'name-asc',
    onSortChange,
    onExpandToActiveFile,
    onToggleAllFolders,
    isAnyExpanded = false,
}) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="flex h-[100dvh] bg-midnight text-primary overflow-hidden supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh]">
            {/* Sidebar (Desktop & Mobile Drawer) - Liquid Glass */}
            <aside
                className={classNames(
                    // Liquid Glass Dark Mode
                    "fixed inset-y-0 left-0 z-20 w-80",
                    "bg-slate-900/60 backdrop-blur-xl",
                    "border-r border-white/10",
                    "transition-all duration-300 ease-in-out flex flex-col",
                    "md:relative md:flex-shrink-0",
                    {
                        "-translate-x-full md:w-0 md:translate-x-0 md:opacity-0 md:border-0 md:pointer-events-none": !isSidebarOpen,
                        "translate-x-0": isSidebarOpen,
                    }
                )}
            >
                {/* Glass shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                {/* ファイルリスト領域（スクロール可能、ボタンの下まで表示） */}
                <div className="relative flex-1 overflow-hidden">
                    {/* スクロール可能なリスト - パディングなしでボタンの下まで表示 */}
                    <nav className="h-full overflow-y-auto">
                        {sidebar}
                    </nav>

                    {/* フローティングツールバー - Liquid Glass */}
                    <div className="absolute bottom-3 left-0 right-0 px-4 pointer-events-none">
                        <div className="flex items-center justify-center gap-2 pointer-events-auto">
                            <button
                                onClick={onCreateNote}
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-xl rounded-full transition-all shadow-lg shadow-black/30 border border-white/10"
                                title="新規ノート作成"
                            >
                                <FileEdit size={18} />
                            </button>
                            <button
                                onClick={onCreateFolder}
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-xl rounded-full transition-all shadow-lg shadow-black/30 border border-white/10"
                                title="フォルダ作成"
                            >
                                <FolderPlus size={18} />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                    className={classNames(
                                        "w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-xl rounded-full transition-all shadow-lg shadow-black/30 border border-white/10",
                                        showSortMenu && "text-indigo-400 bg-slate-700/60"
                                    )}
                                    title="並び替え"
                                >
                                    <ArrowUpDown size={18} />
                                </button>
                                {/* 並び替えドロップダウンメニュー - Liquid Glass */}
                                {showSortMenu && (
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 min-w-[180px] z-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                        <div className="relative">
                                            <div className="px-4 py-1.5 text-xs text-slate-400 font-semibold">ファイル名</div>
                                            <button onClick={() => { onSortChange?.('name-asc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'name-asc' ? "text-indigo-400" : "text-slate-200")}>
                                                アルファベット順 {sortType === 'name-asc' && <Check size={14} />}
                                            </button>
                                            <button onClick={() => { onSortChange?.('name-desc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'name-desc' ? "text-indigo-400" : "text-slate-200")}>
                                                アルファベット逆順 {sortType === 'name-desc' && <Check size={14} />}
                                            </button>
                                            <div className="px-4 py-1.5 text-xs text-slate-400 font-semibold border-t border-white/5 mt-1">更新日</div>
                                            <button onClick={() => { onSortChange?.('updated-desc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'updated-desc' ? "text-indigo-400" : "text-slate-200")}>
                                                新しい順 {sortType === 'updated-desc' && <Check size={14} />}
                                            </button>
                                            <button onClick={() => { onSortChange?.('updated-asc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'updated-asc' ? "text-indigo-400" : "text-slate-200")}>
                                                古い順 {sortType === 'updated-asc' && <Check size={14} />}
                                            </button>
                                            <div className="px-4 py-1.5 text-xs text-slate-400 font-semibold border-t border-white/5 mt-1">作成日</div>
                                            <button onClick={() => { onSortChange?.('created-desc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'created-desc' ? "text-indigo-400" : "text-slate-200")}>
                                                新しい順 {sortType === 'created-desc' && <Check size={14} />}
                                            </button>
                                            <button onClick={() => { onSortChange?.('created-asc'); setShowSortMenu(false); }} className={classNames("w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between", sortType === 'created-asc' ? "text-indigo-400" : "text-slate-200")}>
                                                古い順 {sortType === 'created-asc' && <Check size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={onExpandToActiveFile}
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-xl rounded-full transition-all shadow-lg shadow-black/30 border border-white/10"
                                title="開いているノートまで展開"
                            >
                                <Locate size={18} />
                            </button>
                            <button
                                onClick={onToggleAllFolders}
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-xl rounded-full transition-all shadow-lg shadow-black/30 border border-white/10"
                                title={isAnyExpanded ? "すべて折りたたむ" : "すべて展開"}
                            >
                                {isAnyExpanded ? (
                                    <div className="flex flex-col items-center -space-y-1">
                                        <ChevronDown size={14} strokeWidth={2.5} />
                                        <ChevronUp size={14} strokeWidth={2.5} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center -space-y-1">
                                        <ChevronUp size={14} strokeWidth={2.5} />
                                        <ChevronDown size={14} strokeWidth={2.5} />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ビュー切替（2段目：固定） - Liquid Glass */}
                <div className="relative border-t border-white/5 px-3 py-2">
                    <button className="flex items-center justify-between w-full px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                            <Folder size={16} />
                            <span className="text-sm">ファイルエクスプローラ</span>
                        </div>
                        <ChevronRight size={14} className="rotate-90 text-slate-500" />
                    </button>
                </div>

                {/* 保管庫セクション（3段目：固定） - Liquid Glass */}
                <div className="relative border-t border-white/5 px-3 py-3 flex items-center justify-between">
                    <div>
                        <button className="flex items-center gap-1 text-white font-medium hover:text-indigo-400 transition-colors">
                            <span>G Note</span>
                            <ChevronRight size={14} className="rotate-90" />
                        </button>
                        <p className="text-xs text-secondary mt-0.5">{noteCount} ファイル, {folderCount} フォルダ</p>
                    </div>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 text-secondary hover:text-white hover:bg-surface-highlight rounded-lg transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className="flex-1 flex flex-col min-w-0 relative bg-midnight"
                onClick={() => { if (isSidebarOpen) setSidebarOpen(false); }}
            >
                {/* Header */}
                <header className="flex items-center gap-4 p-4 border-b border-border">
                    {/* Mobile: hamburger menu, Desktop: sidebar toggle when collapsed */}
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-secondary hover:text-white hover:bg-surface-highlight rounded-lg transition-colors"
                        title={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
                    >
                        {isSidebarOpen ? <Menu size={24} /> : <PanelLeft size={24} />}
                    </button>
                    <span className="font-semibold text-lg md:hidden">マイノート</span>
                </header>

                {/* Note Content */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>

                {/* FAB (Command Center) - Liquid Glass */}
                <div className="fixed md:absolute bottom-[max(2rem,env(safe-area-inset-bottom))] right-6 z-30">
                    <button
                        onClick={onFabClick}
                        className="relative w-14 h-14 rounded-2xl bg-indigo-500/80 hover:bg-indigo-400/80 backdrop-blur-xl text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center transition-all active:scale-95 group border border-white/20 overflow-hidden"
                    >
                        {/* Glass shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                        <Plus size={28} strokeWidth={2.5} className="relative group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </main>

            {/* Overlay for mobile sidebar - STRICTLY only for non-desktop */}
            {isSidebarOpen && !isDesktop && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                isDesktop={isDesktop}
            />
        </div>
    );
};
