import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    // リダイレクト認証の結果を処理
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect auth error:", error);
    });

    return onAuthStateChanged(auth, (u) => {
      if (u) {
        if (u.email === ADMIN_EMAIL) {
          setUser(u);
          setDenied(false);
        } else {
          // Access Denied for other users
          setDenied(true);
          signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    try {
      // まずポップアップを試す（デスクトップ向け）
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      // ポップアップがブロックされた場合、またはsessionStorageエラーの場合はリダイレクトにフォールバック
      if (errorCode === 'auth/popup-blocked' ||
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        String(error).includes('sessionStorage')) {
        console.log("Popup failed, falling back to redirect...");
        signInWithRedirect(auth, googleProvider);
      } else {
        console.error("Login failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Login Failed: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-midnight">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-midnight p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
          <p className="text-secondary">
            このアプリケーションは管理者専用です。指定されたアカウントはアクセス許可リストに含まれていません。
          </p>
          <button
            onClick={() => setDenied(false)}
            className="px-6 py-2 bg-surface border border-border rounded-lg text-primary hover:bg-surface-highlight transition-colors"
          >
            別のアカウントを試す
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-midnight p-6 text-center">
        <div className="max-w-md space-y-8 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white">G Note</h1>
            <p className="text-secondary">AIネイティブ・ナレッジベース</p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border shadow-2xl">
            <h2 className="text-xl font-semibold mb-6">管理者ログイン</h2>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Googleでログイン
            </button>
          </div>

          <p className="text-xs text-secondary/50">
            セキュリティ保護: 管理者権限を持つユーザーのみアクセス可能です。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
