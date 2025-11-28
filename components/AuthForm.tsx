import React, { useState } from 'react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

// パスワードをハッシュ化する関数（SHA-256）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 認証情報（環境変数から取得）
// 本番環境では必ず環境変数を設定してください
const AUTH_USERNAME = import.meta.env.VITE_AUTH_USERNAME || 'admin';
const AUTH_PASSWORD_HASH = import.meta.env.VITE_AUTH_PASSWORD_HASH || 
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // デフォルト: "password"のハッシュ（開発用）

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // ユーザー名のチェック
      if (username !== AUTH_USERNAME) {
        setError('ユーザー名またはパスワードが正しくありません');
        setIsLoading(false);
        return;
      }

      // パスワードのハッシュ化と比較
      const passwordHash = await hashPassword(password);
      if (passwordHash !== AUTH_PASSWORD_HASH) {
        setError('ユーザー名またはパスワードが正しくありません');
        setIsLoading(false);
        return;
      }

      // 認証成功 - セッションストレージに保存
      sessionStorage.setItem('artlens_authenticated', 'true');
      sessionStorage.setItem('artlens_auth_time', Date.now().toString());
      onAuthSuccess();
    } catch (err) {
      console.error('認証エラー:', err);
      setError('認証中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ArtLens AI
            </span>
          </h1>
          <p className="text-gray-400">認証が必要です</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ユーザー名を入力"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '認証中...' : 'ログイン'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          IDとパスワードを入力してアクセスしてください
        </p>
      </div>
    </div>
  );
};

