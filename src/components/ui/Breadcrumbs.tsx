import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import classNames from 'classnames';

interface BreadcrumbsProps {
    path: string; // e.g. "/Inbox/Projects/"
    onNavigate?: (path: string) => void;
    className?: string;
}

/**
 * パンくずリストコンポーネント
 * パス文字列を分解してクリック可能なリンクとして表示
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate, className }) => {
    // パスを分解 (e.g. "/Inbox/Projects/" -> ["Inbox", "Projects"])
    const segments = path
        .split('/')
        .filter(segment => segment.length > 0);

    // 各セグメントのフルパスを構築
    const buildPath = (index: number): string => {
        return '/' + segments.slice(0, index + 1).join('/') + '/';
    };

    const handleClick = (segmentPath: string) => {
        if (onNavigate) {
            onNavigate(segmentPath);
        }
    };

    return (
        <nav className={classNames("flex items-center gap-1 text-sm text-secondary overflow-x-auto", className)}>
            {/* ルート */}
            <button
                onClick={() => handleClick('/')}
                className="flex items-center gap-1 hover:text-white transition-colors shrink-0"
                title="ルート"
            >
                <Home size={14} />
            </button>

            {segments.map((segment, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={12} className="shrink-0 text-secondary/50" />
                    <button
                        onClick={() => handleClick(buildPath(index))}
                        className={classNames(
                            "hover:text-white transition-colors truncate max-w-[120px] md:max-w-[200px]",
                            index === segments.length - 1 ? "text-white font-medium" : ""
                        )}
                        title={segment}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};
