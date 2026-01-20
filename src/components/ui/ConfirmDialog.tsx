import React from 'react';
import classNames from 'classnames';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = '確認',
    cancelText = 'キャンセル',
    variant = 'default',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={classNames(
                "relative w-full max-w-sm animate-slide-up",
                // Liquid Glass Dark Mode: 半透明ダーク背景 + ぼかし + 微光沢ボーダー
                "bg-slate-900/80 backdrop-blur-xl",
                "border border-white/10",
                "rounded-2xl shadow-2xl shadow-black/50",
                "overflow-hidden"
            )}>
                {/* グラスの光沢効果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                        {variant === 'danger' && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-rose-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white">
                                {title}
                            </h3>
                            <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                                {message}
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative px-6 pb-6 pt-2 flex gap-3">
                    <button
                        onClick={onCancel}
                        className={classNames(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white",
                            "border border-white/10"
                        )}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={classNames(
                            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            variant === 'danger'
                                ? "bg-rose-500/80 hover:bg-rose-500 text-white"
                                : "bg-indigo-500/80 hover:bg-indigo-500 text-white"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
