import React from 'react';

export const EditorCanvas: React.FC = () => {
    return (
        <div className="w-full h-full p-4">
            <textarea
                className="w-full h-full bg-transparent resize-none focus:outline-none text-primary p-4"
                placeholder="Start writing..."
            />
        </div>
    );
};
