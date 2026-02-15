import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../../storage/useStorage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface EditorProps {
  initialContent: string;
  isRendering: boolean;
  onSave: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, isRendering, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { uploadImage } = useStorage();

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Save changes when component unmounts or content changes significantly
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce save to prevent IME interruption and reduce writes
    timeoutRef.current = setTimeout(() => {
      onSave(newContent);
    }, 1000);
  };

  const handleBlur = () => {
    // Save immediately on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (content !== initialContent) {
      onSave(content);
    }
  };

  /**
   * カーソル位置にテキストを挿入するヘルパー関数
   */
  const insertTextAtCursor = (textToInsert: string, cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;

    const newContent = previousContent.substring(0, start) + textToInsert + previousContent.substring(end);

    setContent(newContent);
    // 即時保存はしない（ユーザーが入力を続ける可能性があるため）
    // reactのstate更新は非同期なので、selectionの設定はeffectで行うか、setTimeoutで行う

    // Fire onChange manually to trigger auto-save logic if needed, or just debounce save here
    // ここではシンプルにstate更新のみ行い、次のレンダリング後にカーソル位置を調整する
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  /**
   * 画像アップロード処理
   */
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const placeholder = `![Uploading ${file.name}...]()`;
    insertTextAtCursor(placeholder);

    try {
      const url = await uploadImage(file);
      const markdownImage = `![${file.name}](${url})`;

      // プレースホルダーを実際の画像リンクに置換
      // プレースホルダー挿入後の最新のcontentを取得する必要があるため、関数型アップデータを使うか、現在のtextareaの値を使う
      // ここでは簡易的に、現在のstateのcontentから置換する（ユーザーがその間に編集している可能性を考慮すると、replaceは慎重に行う必要があるが、
      // 厳密な同時編集制御までは実装しない）

      setContent(prev => prev.replace(placeholder, markdownImage));
      // 保存をトリガー
      setTimeout(() => onSave(content.replace(placeholder, markdownImage)), 100);

    } catch (err) {
      console.error('Image upload failed', err);
      alert('画像のアップロードに失敗しました');
      setContent(prev => prev.replace(placeholder, '')); // 失敗したらプレースホルダーを消す
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // デフォルトのペースト（画像バイナリ等の貼り付け）を防ぐ
        const file = items[i].getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        return; // 最初の画像だけ処理する
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); // ファイルを開かないようにする

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      {isRendering ? (
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="prose prose-invert prose-slate max-w-none selection:bg-accent/30 break-words leading-normal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
            >
              {content || "*本文なし*"}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="flex-1 w-full h-full bg-transparent resize-none focus:outline-none text-primary p-4 md:p-8 text-base leading-normal placeholder:text-secondary/20"
          value={content}
          onChange={handleChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onBlur={handleBlur}
          placeholder="ここに思考を書き出してください..."
          autoFocus
        />
      )}
    </div>
  );
};
