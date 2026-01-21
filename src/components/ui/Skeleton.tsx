import React from 'react';
import classNames from 'classnames';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

/**
 * Skeleton component for loading states.
 * Uses Tailwind's animate-pulse for a smooth shimmer effect.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'text',
    width,
    height,
    count = 1,
}) => {
    const baseClasses = "bg-white/10 animate-pulse";

    const variantClasses = {
        text: "rounded h-4",
        circular: "rounded-full",
        rectangular: "rounded-lg",
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={classNames(baseClasses, variantClasses[variant], className)}
            style={style}
        />
    ));

    return count === 1 ? elements[0] : <>{elements}</>;
};

/**
 * FileTree skeleton for loading state.
 * Mimics the structure of the file tree with placeholder items.
 */
export const FileTreeSkeleton: React.FC = () => {
    return (
        <div className="space-y-2 p-2 animate-fade-in">
            {/* Folder 1 */}
            <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="text" className="flex-1 h-4" />
            </div>
            {/* Nested files */}
            <div className="pl-6 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2">
                    <Skeleton variant="rectangular" width={14} height={14} />
                    <Skeleton variant="text" width="70%" className="h-4" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                    <Skeleton variant="rectangular" width={14} height={14} />
                    <Skeleton variant="text" width="55%" className="h-4" />
                </div>
            </div>
            {/* Folder 2 */}
            <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="text" width="60%" className="h-4" />
            </div>
            {/* Root files */}
            <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="text" width="80%" className="h-4" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton variant="rectangular" width={14} height={14} />
                <Skeleton variant="text" width="45%" className="h-4" />
            </div>
        </div>
    );
};

/**
 * Editor skeleton for loading state.
 */
export const EditorSkeleton: React.FC = () => {
    return (
        <div className="p-6 space-y-4 animate-fade-in">
            {/* Title */}
            <Skeleton variant="text" width="40%" height={28} className="mb-6" />
            {/* Content lines */}
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="text" width="90%" />
            <div className="h-4" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="75%" />
            <Skeleton variant="text" width="88%" />
        </div>
    );
};
