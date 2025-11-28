<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ArtLens AI

美術館で絵画を詳しく理解するAIアプリ。カメラで絵画を撮影すると、AIが作品情報を分析して表示します。

View your app in AI Studio: https://ai.studio/apps/drive/1hl64h23js6_Ztxo_5cUa-R2dE16sCSV2

## ローカルで実行

**必要なもの:** Node.js

1. 依存関係をインストール:
   ```bash
   npm install
   ```

2. `.env.local` ファイルを作成し、以下の環境変数を設定:
   ```
   GEMINI_API_KEY=your_api_key_here
   VITE_AUTH_USERNAME=admin
   VITE_AUTH_PASSWORD_HASH=your_password_hash_here
   ```
   
   パスワードのハッシュ値は以下のコマンドで生成できます:
   ```bash
   node scripts/generate-password-hash.js <あなたのパスワード>
   ```

3. アプリを起動:
   ```bash
   npm run dev
   ```

## GitHub Pagesにデプロイ

このアプリをGitHub Pagesで公開して、スマホからもアクセスできるようにする手順です。

### 1. GitHubリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例: `artlens-ai`）
4. 「Public」を選択
5. 「Create repository」をクリック

### 2. コードをプッシュ

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit"

# リモートリポジトリを追加（YOUR_USERNAMEとREPO_NAMEを置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

### 3. GitHub Secretsの設定

1. GitHubリポジトリのページで「Settings」→「Secrets and variables」→「Actions」を開く
2. 以下のSecretsを追加:
   
   **GEMINI_API_KEY**
   - 「New repository secret」をクリック
   - Name: `GEMINI_API_KEY`
   - Value: あなたのGemini APIキーを入力
   - 「Add secret」をクリック
   
   **VITE_AUTH_USERNAME** (認証用のユーザー名)
   - 「New repository secret」をクリック
   - Name: `VITE_AUTH_USERNAME`
   - Value: 認証に使用するユーザー名（例: `admin`）
   - 「Add secret」をクリック
   
   **VITE_AUTH_PASSWORD_HASH** (認証用のパスワードハッシュ)
   - パスワードのハッシュ値を生成:
     ```bash
     node scripts/generate-password-hash.js <あなたのパスワード>
     ```
   - 「New repository secret」をクリック
   - Name: `VITE_AUTH_PASSWORD_HASH`
   - Value: 生成されたハッシュ値を入力
   - 「Add secret」をクリック

### 4. GitHub Pagesの有効化

1. GitHubリポジトリのページで「Settings」→「Pages」を開く
2. 「Source」で「GitHub Actions」を選択
3. 設定が保存されます

### 5. デプロイの確認

1. 「Actions」タブを開く
2. ワークフローが実行され、完了するのを待ちます
3. 完了後、「Settings」→「Pages」で公開URLが表示されます
4. URLは `https://YOUR_USERNAME.github.io/REPO_NAME/` の形式になります

### 注意事項

- **APIキーのセキュリティ**: GitHub Pagesは静的サイトホスティングのため、APIキーはクライアント側に公開されます。本番環境では、バックエンドAPIを経由してAPIキーを保護することを推奨します。
- **認証について**: このアプリにはクライアントサイドのベーシック認証が実装されています。IDとパスワードを入力しないとサイトにアクセスできません。ただし、これは完全なセキュリティ対策ではありません（JavaScriptで実装されているため、ソースコードを確認すれば認証情報が見える可能性があります）。より強固なセキュリティが必要な場合は、バックエンドAPIや認証サービスを使用してください。
- **HTTPS必須**: カメラ機能を使用するには、HTTPS接続が必要です。GitHub Pagesは自動的にHTTPSを提供します。
- **スマホでのアクセス**: 公開URLにスマホのブラウザからアクセスすると、カメラ機能が使用できます。

## 技術スタック

- React 19
- TypeScript
- Vite
- Google Gemini API
- Tailwind CSS
