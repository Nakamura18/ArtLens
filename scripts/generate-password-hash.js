// パスワードのハッシュ値を生成するヘルパースクリプト
// 使用方法: node scripts/generate-password-hash.js <パスワード>

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('使用方法: node scripts/generate-password-hash.js <パスワード>');
  process.exit(1);
}

// SHA-256でハッシュ化
const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\nパスワード:', password);
console.log('ハッシュ値:', hash);
console.log('\nこのハッシュ値を環境変数 VITE_AUTH_PASSWORD_HASH に設定してください。\n');

