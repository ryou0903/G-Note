import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import type { ContextMenuItem, ContextMenuState } from '../../types/contextMenu';

// Re-export for compatibility
export type { ContextMenuItem };

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
    isMobile?: boolean;
    headerInfo?: ContextMenuState['headerInfo'];
}

const GROUP_ORDER = ['primary', 'file-ops', 'export', 'system', 'danger', 'default'];

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x, y, items, onClose, isMobile = false, headerInfo
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Group items logic
    const groupedItems = useMemo(() => {
        const groups: Record<string, ContextMenuItem[]> = {};
        items.forEach(item => {
            const g = item.group || 'default';
            if (!groups[g]) groups[g] = [];
            groups[g].push(item);
        });
        return groups;
    }, [items]);

    // Sorted group keys present in current items
    const activeGroups = useMemo(() => {
        const keys = Object.keys(groupedItems);
        return GROUP_ORDER.filter(g => keys.includes(g)).concat(
            keys.filter(k => !GROUP_ORDER.includes(k))
        );
    }, [groupedItems]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        if (isMobile) {
            // Mobile: Scroll close is disabled to allow scrolling within the menu
            // preventing the menu from closing when content is scrolled
        } else {
            // Desktop: Standard click outside and scroll close
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose, isMobile]);

    // Styles
    const getMobileStyle = (): React.CSSProperties => ({
        bottom: 0,
        left: 0,
        width: '100%',
        maxHeight: '60vh',
    });

    const getDesktopStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = { top: y, left: x };
        if (x + 220 > window.innerWidth) style.left = x - 220;
        if (y + (items.length * 36) > window.innerHeight) style.top = y - (items.length * 36);
        return style;
    };

    return createPortal(
        <>
            {/* Mobile Backdrop - Blocks backend interaction */}
            {isMobile && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    style={{ touchAction: 'none' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onClose();
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                />
            )}

            <div
                ref={menuRef}
                style={isMobile ? getMobileStyle() : getDesktopStyle()}
                className={classNames(
                    "fixed z-[70] overflow-hidden outline-none",
                    isMobile
                        ? "bg-[#16161e] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 pb-safe flex flex-col"
                        : "min-w-[220px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-100 py-1.5"
                )}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Desktop Glass Effect */}
                {!isMobile && <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />}

                {/* Mobile Header */}
                {isMobile && headerInfo && (
                    <div className="flex-shrink-0 px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-base font-bold text-white mb-1.5 truncate pr-4">{headerInfo.title}</h3>
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-400 font-mono opacity-80">
                            {headerInfo.updatedAt && <span>更新日時 {headerInfo.updatedAt}</span>}
                            {headerInfo.createdAt && <span>作成日時 {headerInfo.createdAt}</span>}
                        </div>
                    </div>
                )}

                {/* Mobile Handle if no header */}
                {isMobile && !headerInfo && (
                    <div className="flex justify-center pt-3 pb-2 flex-shrink-0" onClick={onClose}>
                        <div className="w-10 h-1 bg-white/20 rounded-full" />
                    </div>
                )}

                {/* Scrollable Content Area */}
                <div className={classNames(
                    "relative overflow-y-auto",
                    isMobile ? "p-4 space-y-4 max-h-[70vh]" : ""
                )}>
                    {activeGroups.map((group, groupIndex) => (
                        <div key={group} className={classNames(
                            isMobile ? "bg-white/5 rounded-2xl overflow-hidden" : "py-1"
                        )}>
                            {groupedItems[group].map((item, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!item.disabled) {
                                            item.onClick?.();
                                            onClose();
                                        }
                                    }}
                                    disabled={item.disabled}
                                    className={classNames(
                                        "w-full flex items-center gap-3 transition-colors text-left relative",
                                        isMobile
                                            ? "px-4 py-2.5 text-[15px] font-medium active:bg-white/10 border-b border-white/5 last:border-b-0"
                                            : "px-3 py-1.5 text-sm hover:bg-white/10 mx-1 rounded-md w-[calc(100%-8px)]",
                                        item.variant === 'danger'
                                            ? "text-rose-400"
                                            : "text-slate-200",
                                        item.disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {item.icon && (
                                        <span className={classNames(
                                            "flex items-center justify-center text-slate-400",
                                            isMobile ? "w-5 h-5" : "w-4 h-4",
                                            item.variant === 'danger' && "text-rose-400"
                                        )}>
                                            {React.isValidElement(item.icon)
                                                ? React.cloneElement(item.icon as React.ReactElement, { size: isMobile ? 20 : 16 } as any)
                                                : item.icon}
                                        </span>
                                    )}
                                    <span className="flex-1">{item.label}</span>
                                </button>
                            ))}
                            {/* Desktop Separator */}
                            {!isMobile && groupIndex < activeGroups.length - 1 && (
                                <div className="h-px bg-white/10 my-1 mx-2" />
                            )}
                        </div>
                    ))}
                </div>


            </div>
        </>,
        document.body
    );
};
