import React, { useState, useEffect } from 'react';
import { FolderPlus, X, ChevronDown } from 'lucide-react';

interface FolderCreateModalProps {
    isOpen: boolean;
    parentPath: string;
    availableFolders?: string[]; // List of folder paths to choose from
    onClose: () => void;
    onConfirm: (folderPath: string) => void;
}

export const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
    isOpen,
    parentPath,
    availableFolders = [],
    onClose,
    onConfirm,
}) => {
    const [folderName, setFolderName] = useState('');
    const [selectedParent, setSelectedParent] = useState(parentPath);

    // Reset selectedParent when modal opens with new parentPath
    useEffect(() => {
        setSelectedParent(parentPath);
    }, [parentPath, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;

        // Construct the new folder path
        const cleanName = folderName.trim().replace(/[/\\]/g, '-');
        const newPath = selectedParent === '/'
            ? `/${cleanName}/`
            : `${selectedParent}${cleanName}/`;

        onConfirm(newPath);
        setFolderName('');
        onClose();
    };

    // Build list of available parents (including root)
    const parentOptions = ['/', ...availableFolders.filter(f => f !== '/').sort()];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog - Liquid Glass */}
            <div className="relative w-full max-w-sm animate-slide-up bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Glass shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <FolderPlus size={20} className="text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-lg">新しいフォルダ</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-400 mb-2 font-medium">フォルダ名</label>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="例: 仕事、日記、アイデア..."
                            className="w-full bg-slate-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>

                    {/* Parent folder selector */}
                    <div>
                        <label className="block text-xs text-slate-400 mb-2 font-medium">作成先</label>
                        <div className="relative">
                            <select
                                value={selectedParent}
                                onChange={(e) => setSelectedParent(e.target.value)}
                                className="w-full bg-slate-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 appearance-none cursor-pointer"
                            >
                                {parentOptions.map((path) => (
                                    <option key={path} value={path} className="bg-slate-900">
                                        {path === '/' ? 'ルート (/)' : path}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!folderName.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            作成
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

