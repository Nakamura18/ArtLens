import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // GitHub Pages用のbaseパス（リポジトリ名に合わせて変更してください）
    // 例: リポジトリ名が "artlens-ai" の場合、base: '/artlens-ai/'
    const base = process.env.VITE_BASE_PATH || '/';
    
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'import.meta.env.VITE_AUTH_USERNAME': JSON.stringify(env.VITE_AUTH_USERNAME),
        'import.meta.env.VITE_AUTH_PASSWORD_HASH': JSON.stringify(env.VITE_AUTH_PASSWORD_HASH)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
