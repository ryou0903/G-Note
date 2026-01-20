import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import type { Note } from '../../types';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'notes'),
        orderBy('updatedAt', 'desc')
      );

      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const notesData: Note[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            folder: data.folder || '/',
            tags: data.tags,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        }) as Note[];
        setNotes(notesData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching notes:", error);
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

  const createNote = async (title: string, content: string = '', folder: string = '/') => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'users', user.uid, 'notes'), {
      title,
      content,
      folder,
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const user = auth.currentUser;
    if (!user) return;

    const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
    // compiled fields if present, just update data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...dataToUpdate } = updates as Partial<Note> & { id?: string };

    await updateDoc(noteRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });
  };

  const deleteNote = async (noteId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
    await deleteDoc(noteRef);
  };

  const deleteNotes = async (noteIds: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    const batch = writeBatch(db);
    noteIds.forEach(id => {
      const ref = doc(db, 'users', user.uid, 'notes', id);
      batch.delete(ref);
    });
    await batch.commit();
  };

  return { notes, loading, createNote, updateNote, deleteNote, deleteNotes };
};
