# 筋トレ記録アプリ（個人用） — 開発方針

週2〜3回の筋トレを素早く記録し、推移を振り返り、RPG風のレベルアップを楽しむ個人用アプリ。

## 最優先の方針
1. **入力の手間を最小にする**。迷ったら「タップ数が少ない方」「前回値をそのまま使える方」を選ぶ。
   - 前回と同じ内容なら、値を変えずに「保存」だけで記録できること。
   - 記録画面は 1種目の入力が縦スクロールなしで完了すること（430×932pt）。
2. **保存は端末内のみ**（IndexedDB）。サーバー・ログイン・外部送信は作らない。
3. **XP・レベル・実績は保存しない**。SetRecord から毎回計算する（係数を変えても整合が取れるように）。

## 対象端末
- iPhone 16 Pro Max（430×932pt）の Safari／Chrome、およびホーム画面に追加した PWA。
- 横幅は可変（固定幅を使わない）。基準幅 430pt。
- `env(safe-area-inset-*)` で上下のセーフエリアを避ける。`viewport-fit=cover`。
- 下部タブ（高さ約83pt＝49pt＋下セーフエリア）：記録／履歴／キャラ／設定。
- タップ領域は最低 44×44pt。入力文字は 16px 以上（iOS の自動ズーム防止）。
- ライト／ダークは `prefers-color-scheme` に追従（CSS 変数で切替）。
- オフラインで起動・記録できること（Service Worker で全ファイルを事前キャッシュ）。
- 注意：iOS では Safari とホーム画面アプリの保存領域が別。普段はホーム画面アプリを使う前提。
  起動時に `navigator.storage.persist()` を要求する。

## 技術スタック
- React 19 + Vite 8 + TypeScript 7（strict）
- PWA：vite-plugin-pwa（generateSW、autoUpdate）
- IndexedDB：Dexie.js ＋ dexie-react-hooks（useLiveQuery で DB の変更を画面に反映）
- テスト：Vitest（XP計算・レベル計算・データ層）。データ層のテストは fake-indexeddb を使う。
- スタイル：CSS Modules ＋ CSS 変数（テーマ）。追加の依存を増やさず、画面ごとにスタイルを閉じ込めるため。
- グラフ・アイコン等のライブラリは原則追加しない（レーダーチャートは SVG を自前で描く）。

## ディレクトリ構成
```
workout-app/
  CLAUDE.md
  index.html
  README.md               … 公開URL・使い方
  vite.config.ts          … PWA 設定を含む（base は /strength-log/）
  vitest.config.ts
  public/                 … アイコン（scripts/make-icons.mjs で作る）
  src/
    main.tsx / App.tsx    … タブ切替
    data.ts               … useAllData / useXp（全画面共通の読み込み）
    sound.ts              … 効果音
    styles/               … global.css（リセット・CSS 変数・セーフエリア・共通部品）
    domain/               … 純粋関数のみ（DB・React に依存しない）
      types.ts            … Exercise / Session / SetRecord / Settings / Goal
      defaults.ts         … 種目マスタ・既定設定・初期目標
      date.ts             … ローカル日付、週（月曜始まり）
      xp.ts               … 1セットXP、推定1RM（Epley）、ボーナス、累計XP
      level.ts            … 累計XP → レベル・称号・次レベルまでの残り
      goals.ts            … 種目目標の達成判定
      stats.ts            … グラフ用の集計（種目ごとの推移・週ごとのXP）
      achievements.ts     … 実績（バッジ）の定義と判定
      *.test.ts           … Vitest（domain は全関数テスト）
    db/
      db.ts               … Dexie のスキーマとバージョン、初回の初期データ投入
      repo.ts             … 読み書き（前回値の取得など）
      backup.ts           … JSON 書き出し・読み込み（ID 重複は除外）
      *.test.ts
    components/           … 共通部品（TabBar, Stepper, Picker, RpeButtons, Toast, ConfirmDialog）
    features/
      record/             … 記録画面（最重要）
      history/            … 履歴画面
      character/          … キャラ画面
      settings/           … 設定画面
```

## コーディング規約
- 計算ロジックは `src/domain/` の純粋関数に置き、画面からは呼ぶだけにする。テストは domain と db に書く。
- 数値の丸め：基本XPは小数第1位で四捨五入（`Math.round(x * 10) / 10`）。
- 日付は端末のローカル日付の文字列 `YYYY-MM-DD` で保存。週は月曜始まり。
- ID は文字列 UUID（バックアップの結合で重複を判定するため）。`crypto.randomUUID` が無い環境用の代替を用意。
- 画面の文言は日本語。専門用語は避ける。
- コンポーネントは関数コンポーネント＋フック。ファイル名：部品は PascalCase、それ以外は camelCase。
- CSS は固定幅（px 指定の width）を使わない。色は CSS 変数のみ。
- `npm run build` は警告ゼロを保つ。

## フェーズ1で決めたこと（ユーザー回答：全部おすすめ）
1. セット数3で保存 → 同じ値の SetRecord を3件。「同じ内容で次のセット」は今の値で1件追加してすぐ保存。
2. ダンベルは片手の重さを入れる（XPもその数字で計算）。
3. 自重種目は種目ごとに「体重の何倍か」を持つ（腕立て0.65、腹筋系0.3、チンニング1.0、ネガティブ0.5。設定で変更可）。
4. バーベルスクワットの初期目標は 60kg×10回。
5. 公開先は GitHub Pages（下の「GitHub・公開」）。
6. 受け入れ確認は PC で同じ状態を作って行い、iPhone 実機の最終確認はユーザー。
- その他：バーベルスクワットは1種目（器具＝バーベル）。分類に「その他」を追加（レーダーは4部位）。
  週は月曜始まり、週間クエストは記録した日数で数え週1回。自己ベストは1日1種目1回、初挑戦の日は付かない。
  バックアップの読み込みで同じ日付の別セッションは今のセッションにまとめる。設定は読み込まない。

## フェーズ2で決めたこと（ユーザー回答 1A・2A・3A・4B・5A）
1. グラフは履歴画面の「一覧／グラフ」切替（タブは4つのまま）。部品は使わず SVG を自前で描く。
   部位の色は固定（並び順で色覚の見分けやすさを検査済み）、色だけに頼らないよう週の内訳を数値でも出す。
2. 実績に XP は付けない。実績（24個、domain/achievements.ts）は保存せず記録から計算。
3. レベルアップ・目標達成・実績は画面中央のカード（タップで次へ）。獲得XPは上のトースト。
4. 効果音あり（Web Audio で生成、設定で消せる。iPhone ではボタンを押した瞬間に primeAudio が必要）。
5. 実績は計画の24個。

## GitHub・公開
- リポジトリ：`sewagedesign-star/strength-log`（Public）。手元のフォルダ名は workout-app のまま。
- 公開：`npm run deploy`（gh-pages パッケージで `gh-pages` ブランチへ）。URL は https://sewagedesign-star.github.io/strength-log/
- `.gitignore` に `node_modules`、`dist`、`.env*`。トレーニング記録はリポジトリに含めない。サンプルデータを作るときは架空の値にする。

## 進め方
- フェーズ制。各フェーズは計画を示して承認を得てから着手する。迷う点は実装前に質問する（番号付き・A/B・おすすめ明記）。
- コミットは機能ごとに分け、メッセージは日本語で書く。
- ユーザーへの文（確認の欄・ボタン・途中経過を含む）はすべて日本語。
- フェーズ1：セットアップ／データ層／記録画面／キャラ画面／履歴画面／設定・バックアップ。
- 後のフェーズ：推移グラフの詳細、実績バッジの通知演出（フェーズ2）。プッシュ通知・サーバー同期・体重/食事/睡眠の記録は作らない。

## コマンド
- `npm run dev` … 開発サーバー
- `npm test` … Vitest
- `npm run build` … 本番ビルド（警告なしが条件）
- `npm run preview` … ビルド結果の確認（PWA・オフライン確認はこちらで行う）
