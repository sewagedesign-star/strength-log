# 筋トレ記録（strength-log）

週2〜3回の筋トレを素早く記録して、推移を振り返り、RPG風のレベルアップを楽しむ個人用アプリです。

**公開URL：https://sewagedesign-star.github.io/strength-log/**

## 使い方（iPhone）
1. Safari で上の公開URLを開く
2. 共有ボタン →「ホーム画面に追加」
3. 以後はホーム画面のアイコンから起動する（機内モードでも記録できます）

※ iPhone では、Safari とホーム画面アプリでデータの保存場所が別々です。普段はホーム画面アプリだけを使ってください。

## データについて
- トレーニング記録は端末の中（IndexedDB）にだけ保存します。サーバーやこのリポジトリには送りません。
- 機種変更のときは「設定 → バックアップ」で JSON に書き出し、新しい端末で読み込みます。

## 開発
```bash
npm install
npm run dev       # 開発サーバー（http://localhost:5173/strength-log/）
npm test          # ユニットテスト（Vitest）
npm run build     # 本番ビルド
npm run deploy    # テスト → ビルド → gh-pages ブランチへ公開
```

技術：React + Vite + TypeScript、PWA（vite-plugin-pwa）、IndexedDB（Dexie.js）、CSS Modules。
方針と構成は [CLAUDE.md](CLAUDE.md) を参照。
