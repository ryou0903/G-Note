import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    getDocs
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export interface Folder {
    id: string;
    path: string;
    name: string;
    createdAt?: Date;
}

export const useFolders = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                setFolders([]);
                setLoading(false);
                return;
            }

            const q = query(
                collection(db, 'users', user.uid, 'folders'),
                orderBy('createdAt', 'asc')
            );

            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const foldersData: Folder[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        path: data.path,
                        name: data.name,
                        createdAt: data.createdAt?.toDate()
                    };
                });
                setFolders(foldersData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching folders:", error);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    // Create a new folder
    const createFolder = async (path: string, name: string) => {
        const user = auth.currentUser;
        if (!user) return;

        // Check if folder already exists
        const existing = folders.find(f => f.path === path);
        if (existing) return;

        await addDoc(collection(db, 'users', user.uid, 'folders'), {
            path,
            name,
            createdAt: serverTimestamp()
        });
    };

    // Delete a folder (and optionally all notes inside)
    const deleteFolder = async (folderId: string, folderPath: string, deleteNotes = false) => {
        const user = auth.currentUser;
        if (!user) return;

        const batch = writeBatch(db);

        // Delete the folder document
        const folderRef = doc(db, 'users', user.uid, 'folders', folderId);
        batch.delete(folderRef);

        // Also delete any child folders
        const childFolders = folders.filter(f => f.path.startsWith(folderPath) && f.path !== folderPath);
        childFolders.forEach(cf => {
            const ref = doc(db, 'users', user.uid, 'folders', cf.id);
            batch.delete(ref);
        });

        if (deleteNotes) {
            // Get all notes in this folder and subfolders
            const notesQuery = query(collection(db, 'users', user.uid, 'notes'));
            const notesSnapshot = await getDocs(notesQuery);
            notesSnapshot.docs.forEach(noteDoc => {
                const noteFolder = noteDoc.data().folder || '/';
                if (noteFolder.startsWith(folderPath)) {
                    batch.delete(noteDoc.ref);
                }
            });
        }

        await batch.commit();
    };

    // Move folder (rename path)
    // Move folder (rename path)
    const moveFolder = async (folderId: string | undefined, oldPath: string, newPath: string) => {
        const user = auth.currentUser;
        if (!user) return;

        const batch = writeBatch(db);

        // Update the folder's path only if it exists in Firestore
        if (folderId) {
            const folderRef = doc(db, 'users', user.uid, 'folders', folderId);
            const newName = newPath.split('/').filter(Boolean).pop() || '';
            batch.update(folderRef, { path: newPath, name: newName });
        }

        // Update all child folders
        // Firestoreにあるフォルダのみ更新（仮想フォルダは無視しても、その配下のノートが移動すれば実質移動完了）
        const childFolders = folders.filter(f => f.path.startsWith(oldPath) && f.path !== oldPath);
        childFolders.forEach(cf => {
            const ref = doc(db, 'users', user.uid, 'folders', cf.id);
            const newChildPath = cf.path.replace(oldPath, newPath);
            batch.update(ref, { path: newChildPath });
        });

        // Update all notes in this folder and subfolders
        const notesQuery = query(collection(db, 'users', user.uid, 'notes'));
        const notesSnapshot = await getDocs(notesQuery);
        notesSnapshot.docs.forEach(noteDoc => {
            const noteFolder = noteDoc.data().folder || '/';
            if (noteFolder.startsWith(oldPath)) {
                const newNoteFolder = noteFolder.replace(oldPath, newPath);
                batch.update(noteDoc.ref, { folder: newNoteFolder });
            }
        });

        await batch.commit();
    };

    return { folders, loading, createFolder, deleteFolder, moveFolder };
};
