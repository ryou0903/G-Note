import type { Note } from '../../types';

export interface FolderNode {
    id: string;
    name: string;
    path: string;
    children: FolderNode[];
    notes: Note[];
    isExpanded?: boolean;
}

/**
 * Builds a tree structure from a flat list of notes.
 * Each note has a `folder` field like "/work/projects/".
 * Also accepts an optional list of persisted folder paths to ensure they exist.
 */
export function buildFileTree(notes: Note[], persistedFolderPaths: string[] = []): FolderNode {
    const root: FolderNode = {
        id: 'root',
        name: 'Notes',
        path: '/',
        children: [],
        notes: [],
        isExpanded: true,
    };

    // Map of path -> FolderNode
    const folderMap = new Map<string, FolderNode>();
    folderMap.set('/', root);

    // Helper to ensure a folder exists in the tree
    const ensureFolder = (path: string): FolderNode => {
        if (folderMap.has(path)) {
            return folderMap.get(path)!;
        }

        // Split path and recursively create parents
        const parts = path.split('/').filter(Boolean);
        let currentPath = '/';
        let parentNode = root;

        for (const part of parts) {
            const nextPath = currentPath === '/' ? `/${part}/` : `${currentPath}${part}/`;

            if (!folderMap.has(nextPath)) {
                const newFolder: FolderNode = {
                    id: nextPath,
                    name: part,
                    path: nextPath,
                    children: [],
                    notes: [],
                    isExpanded: false,
                };
                parentNode.children.push(newFolder);
                folderMap.set(nextPath, newFolder);
            }

            parentNode = folderMap.get(nextPath)!;
            currentPath = nextPath;
        }

        return parentNode;
    };

    // First, ensure all persisted folders exist (even if empty)
    for (const folderPath of persistedFolderPaths) {
        ensureFolder(folderPath);
    }

    // Distribute notes into their folders
    for (const note of notes) {
        const folderPath = note.folder || '/';
        const folder = ensureFolder(folderPath);
        folder.notes.push(note);
    }

    // Sort children alphabetically
    const sortFolder = (folder: FolderNode) => {
        folder.children.sort((a, b) => a.name.localeCompare(b.name));
        folder.notes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        folder.children.forEach(sortFolder);
    };
    sortFolder(root);

    return root;
}

/**
 * Flattens the tree for rendering (depth-first).
 * Returns items with their depth for indentation.
 */
export interface FlatTreeItem {
    type: 'folder' | 'note';
    id: string;
    name: string;
    path: string;
    depth: number;
    isExpanded?: boolean;
    note?: Note;
}

export function flattenTree(
    node: FolderNode,
    expandedPaths: Set<string>,
    depth = 0
): FlatTreeItem[] {
    const items: FlatTreeItem[] = [];

    // Add folder itself (except root at depth 0 is optional)
    if (depth > 0) {
        items.push({
            type: 'folder',
            id: node.id,
            name: node.name,
            path: node.path,
            depth: depth - 1,
            isExpanded: expandedPaths.has(node.path),
        });
    }

    // If expanded or is root, add children
    if (depth === 0 || expandedPaths.has(node.path)) {
        // First add child folders
        for (const child of node.children) {
            items.push(...flattenTree(child, expandedPaths, depth + 1));
        }
        // Then add notes in this folder
        for (const note of node.notes) {
            items.push({
                type: 'note',
                id: note.id,
                name: note.title || '無題のノート',
                path: node.path,
                depth: depth,
                note,
            });
        }
    }

    return items;
}

/**
 * Get all parent paths for a given folder path.
 * e.g. "/work/project/docs/" -> ["/work/", "/work/project/", "/work/project/docs/"]
 * The result includes the path itself.
 */
export function getAllParentPaths(path: string): string[] {
    const parents: string[] = [];
    const parts = path.split('/').filter(Boolean);
    let currentPath = '/';

    for (const part of parts) {
        currentPath += `${part}/`;
        parents.push(currentPath);
    }

    return parents;
}

/**
 * Get all folder paths in the tree recursively (excluding root).
 */
export function getAllFolderPaths(root: FolderNode): string[] {
    const paths: string[] = [];

    const traverse = (node: FolderNode) => {
        if (node.path !== '/') {
            paths.push(node.path);
        }
        node.children.forEach(traverse);
    };

    traverse(root);
    return paths;
}
