import { useState } from 'react';
import { storage, auth } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageUtils';

interface UseStorageReturn {
    uploadImage: (file: File) => Promise<string>;
    uploading: boolean;
    error: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export const useStorage = (): UseStorageReturn => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadImage = async (file: File): Promise<string> => {
        setError(null);

        // 1. Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            const err = '画像ファイルのみアップロード可能です (JPEG, PNG, GIF, WebP, SVG)';
            setError(err);
            throw new Error(err);
        }

        // 2. Validate file size (check original size before compression, though compression will reduce it)
        if (file.size > MAX_FILE_SIZE) {
            const err = 'ファイルサイズは5MB以下にしてください';
            setError(err);
            throw new Error(err);
        }

        // 3. Check authentication
        const user = auth.currentUser;
        if (!user) {
            const err = '画像のアップロードにはログインが必要です';
            setError(err);
            throw new Error(err);
        }

        setUploading(true);

        try {
            // 4. Compress image (skip for SVG and GIF to preserve animation/vector)
            let fileToUpload: File | Blob = file;
            if (file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
                try {
                    // Compress large images
                    fileToUpload = await compressImage(file, {
                        maxWidth: 1920,
                        maxHeight: 1920,
                        quality: 0.8,
                        type: file.type // Keep original format
                    });
                } catch (compressionErr) {
                    console.warn('Image compression failed, uploading original file:', compressionErr);
                    // Fallback to original file
                }
            }

            // 5. Generate unique path
            const timestamp = Date.now();
            const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const storagePath = `images/${user.uid}/${timestamp}_${safeFilename}`;
            const storageRef = ref(storage, storagePath);

            // 6. Upload
            await uploadBytes(storageRef, fileToUpload);

            // 7. Get URL
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;

        } catch (err: any) {
            console.error('Upload failed:', err);
            const errorMessage = err.message || '画像のアップロードに失敗しました';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    return { uploadImage, uploading, error };
};
