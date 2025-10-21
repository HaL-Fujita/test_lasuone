# バカラゲーム - ノーコミッション版

Vue.js + Node.jsで作られたバカラゲームです。イカサマ機能付き！

## 特徴

- **ノーコミッションバカラ**: バンカー勝利時も手数料なし（ただしバンカー6は0.5:1配当）
- **7回勝負**: 初期資金$100で7回プレイ
- **イカサマ機能**: ゲーム中1回だけ結果を操作可能
- **ランキング**: 最終残高でランキング競争
- **ゲームオーバー**: 資金が$0になったら終了

## ゲームルール

### 配当
- **プレイヤー勝利**: 1:1（$10ベットで$10利益）
- **バンカー勝利**: 1:1（$10ベットで$10利益）
- **バンカー6勝利**: 0.5:1（$10ベットで$5利益）
- **タイ（引き分け）**: 8:1（$10ベットで$80利益）

### ゲームの流れ
1. 初期資金$100でスタート
2. プレイヤー、バンカー、タイのいずれかにベット
3. ベット額を設定（所持金の範囲内）
4. ディールボタンでカード配布
5. 結果に応じて配当を獲得
6. 7回プレイするか、資金が$0になるまで継続
7. 最終残高をランキングに登録

### イカサマ機能
- ゲーム中に**1回だけ**使用可能
- プレイヤー勝ち、バンカー勝ち、タイのいずれかを選択
- 選択した結果が確実に出る

## セットアップ

### 必要環境
- Node.js 16以上
- npm または yarn

### インストール

#### 1. バックエンドのセットアップ
```bash
cd backend
npm install
npm start
```

バックエンドは `http://localhost:3000` で起動します。

#### 2. フロントエンドのセットアップ
```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

### 開発モード

バックエンドで`nodemon`を使用する場合：
```bash
cd backend
npm run dev
```

## API エンドポイント

### POST /api/play
ゲームラウンドをプレイ

**リクエスト:**
```json
{
  "bet": {
    "type": "player | banker | tie",
    "amount": 10
  },
  "cheatResult": null  // オプション: イカサマ結果
}
```

**レスポンス:**
```json
{
  "result": {
    "playerCards": [1, 23, 45],
    "bankerCards": [12, 34],
    "playerTotal": 8,
    "bankerTotal": 6,
    "winner": "player",
    "isBanker6": false
  },
  "payout": 20,
  "netProfit": 10
}
```

### POST /api/cheat
イカサマ結果を生成

**リクエスト:**
```json
{
  "desiredWinner": "player | banker | tie"
}
```

### GET /api/ranking
ランキングを取得

### POST /api/ranking
スコアを登録

**リクエスト:**
```json
{
  "playerName": "プレイヤー名",
  "finalBalance": 250,
  "rounds": []
}
```

## プロジェクト構造

```
.
├── backend/
│   ├── server.js       # Express サーバー
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.vue     # メインコンポーネント
│   │   ├── main.js     # エントリーポイント
│   │   └── style.css   # スタイル
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 技術スタック

- **フロントエンド**: Vue.js 3, Vite, Axios
- **バックエンド**: Node.js, Express, CORS
- **スタイリング**: CSS（カスタム）

## ライセンス

MIT
