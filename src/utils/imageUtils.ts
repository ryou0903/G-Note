/**
 * 画像をクライアントサイドで圧縮するユーティリティ
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.0 to 1.0
    type?: string; // 'image/jpeg', 'image/png', 'image/webp'
}

/**
 * 画像ファイルを圧縮する
 * @param file 元の画像ファイル
 * @param options 圧縮オプション
 * @returns 圧縮された画像Blob
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> => {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.8,
        type = 'image/jpeg',
    } = options;

    return new Promise((resolve, reject) => {
        // 画像を読み込む
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (!e.target?.result) {
                reject(new Error('Failed to read file'));
                return;
            }
            img.src = e.target.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));

        img.onload = () => {
            // リサイズ計算
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            // Canvasに描画
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Blobとして書き出し
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                type,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        reader.readAsDataURL(file);
    });
};
