# 🐋 Orynth Whale Tracker

超低レイテンシのOrynth新着通知トラッカー
フォローユーザーの新規プロダクトローンチを**3秒ごと**に監視し、即座に通知

## 🎯 機能

- ⚡ **3秒ポーリング**: 最小遅延で新規ローンチを検知
- 🔔 **即座通知**: 音とChrome通知で瞬時にアラート
- 🛡️ **レート制限対応**: 429エラー時は自動的にポーリング間隔を延長
- 🔐 **Cookie認証**: Orynthのauth_tokenを使用して認証

## 📦 インストール方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/atamaru33/whale-tracker.git
cd whale-tracker
```

### 2. Chrome拡張機能として読み込み

1. Chromeを開き、アドレスバーに `chrome://extensions/` と入力
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. クローンした `whale-tracker` フォルダを選択

### 3. Orynthにログイン

1. [Orynth](https://www.orynth.dev/) にログイン
2. 拡張機能が自動的にCookie（auth_token）を使用

### 4. 動作確認

- 拡張機能がインストールされると、自動的にポーリングが開始されます
- バックグラウンドでコンソールログを確認するには:
  - `chrome://extensions/` → 「Service Worker」をクリック → DevToolsが開く

## 🔧 技術仕様

| 項目 | 詳細 |
|------|------|
| API | `https://www.orynth.dev/api/notifications?limit=10` |
| 認証 | Cookie（auth_token） |
| ポーリング間隔 | 3秒（デフォルト） |
| エラーハンドリング | 429エラー時は間隔を2倍に延長 |
| 通知トリガー | 最新通知IDの変化を検知 |

## 📁 ファイル構成

```
whale-tracker/
├── manifest.json    # Chrome Extension Manifest V3
├── background.js    # Service Worker（ポーリングロジック）
└── README.md        # このファイル
```

## 🚀 使用方法

拡張機能がインストールされると、自動的に以下が実行されます:

1. **3秒ごと**にOrynth APIをチェック
2. 新しい通知を検知すると:
   - 🔔 Chrome通知を表示（画面右下）
   - 🔊 通知音を再生
   - 💬 通知内容を表示

通知をクリックすると、Orynthの通知ページ（`https://www.orynth.dev/notifications`）が開きます。

## 🐛 トラブルシューティング

### 通知が来ない場合

1. Orynthにログインしているか確認
2. `chrome://extensions/` で拡張機能が有効か確認
3. Service Workerのコンソールログを確認:
   ```
   ✅ No new notifications (ID: xxx)  → 正常動作中
   🚨 NEW NOTIFICATION DETECTED!      → 新規通知検知
   ❌ API Error: 401                  → 認証エラー（再ログイン必要）
   ```

### レート制限エラー（429）

自動的にポーリング間隔が延長されます:
- 初回: 3秒 → 6秒
- 2回目: 6秒 → 12秒
- 3回目: 12秒 → 24秒

エラーが解消されると、自動的に3秒に戻ります。

## 📝 ライセンス

MIT

## 🙏 クレジット

Protocol Stoicの精神に基づき、冷静な投資判断をサポートします。

---

**⚠️ 免責事項**: このツールは教育目的で作成されています。投資判断は自己責任で行ってください。
