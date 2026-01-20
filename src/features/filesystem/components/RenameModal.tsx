import React, { useState, useEffect, useRef } from 'react';
import { Pencil, X } from 'lucide-react';

interface RenameModalProps {
    isOpen: boolean;
    currentName: string;
    type: 'file' | 'folder';
    onClose: () => void;
    onConfirm: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
    isOpen,
    currentName,
    type,
    onClose,
    onConfirm,
}) => {
    const [newName, setNewName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset name when modal opens
    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
            // Focus input after animation
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 100);
        }
    }, [isOpen, currentName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed || trimmed === currentName) {
            onClose();
            return;
        }
        // Basic validation
        if (trimmed.includes('/') || trimmed.includes('\\')) {
            alert('ファイル名にスラッシュ系の文字は使用できません');
            return;
        }

        onConfirm(trimmed);
        onClose();
    };

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
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Pencil size={20} className="text-indigo-400" />
                        </div>
                        <h3 className="font-semibold text-lg">{type === 'folder' ? 'フォルダ名の変更' : 'ファイル名の変更'}</h3>
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
                        <label className="block text-xs text-slate-400 mb-2 font-medium">新しい名前</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-slate-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 placeholder:text-slate-500"
                            autoFocus
                        />
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
                            disabled={!newName.trim() || newName === currentName}
                            className="flex-1 px-4 py-2.5 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            変更
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
