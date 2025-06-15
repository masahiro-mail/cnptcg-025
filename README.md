# CNP Trading Card Game (CNP-TCG)

リアルタイムマルチプレイヤー対戦型トレーディングカードゲーム

## 技術スタック
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **State Management**: Zustand
- **Build System**: pnpm workspaces, Turborepo

## 機能
- リアルタイムオンライン対戦
- デッキ構築（50枚固定）
- 自動マッチメイキング
- 4色属性システム（青/赤/黄/緑）
- レイキシステム
- ドラッグ&ドロップUI

## 開発環境セットアップ
```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## デプロイ
- **Frontend**: Vercel
- **Backend**: Render

## ゲームルール
- 2人対戦
- 勝利条件: 相手の2拠点破壊 or デッキ切れ
- 5つのフェーズ: ドロー→レイキ→メイン→バトル→エンド