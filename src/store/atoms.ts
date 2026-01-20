import { atom } from 'jotai';

export const editorStateAtom = atom({
    content: '',
    isRendering: true,
});
