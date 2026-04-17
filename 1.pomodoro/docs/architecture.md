# アーキテクチャ概要

## 1. 全体構成

このアプリケーションは Flask（Python）をサーバー、HTML/CSS/JavaScript をクライアントとする構成です。タイマーのすべての状態管理はブラウザ側で完結し、Flask は初期ページの配信と静的ファイルの提供のみを担います。

```
ブラウザ
├── app.js（UI コントローラ・IIFE）
│   ├── TimerEngine  (timer-engine.js)
│   ├── SessionPolicy (session-policy.js)
│   ├── ProgressService (progress-service.js)
│   ├── Repositories (repositories.js)
│   └── NotificationService (notification-service.js)
│
└── 永続化: localStorage (pomodoro.settings.v1 / pomodoro.progress.v1)

Flask (app.py)
└── GET / → index.html + 静的ファイル配信
```

---

## 2. 層の構成

### 2.1 プレゼンテーション層

| ファイル              | 役割                                           |
|-----------------------|------------------------------------------------|
| `app.py`              | Flask アプリケーションファクトリ、ルート定義   |
| `templates/index.html`| UI テンプレート（単一ページ）                  |
| `static/css/style.css`| スタイルシート                                  |
| `static/js/app.js`    | DOM 操作、イベントハンドリング、描画処理（IIFE）|

### 2.2 ドメイン層（フロントエンド）

| ファイル                     | 役割                                                   |
|------------------------------|--------------------------------------------------------|
| `static/js/timer-engine.js`  | タイマー状態定義・状態遷移関数（純粋関数）              |
| `static/js/session-policy.js`| セッション完了後の次モード決定ロジック                  |
| `static/js/progress-service.js`| 進捗の集計・日付リセット判定（純粋関数）               |

### 2.3 インフラ層（フロントエンド）

| ファイル                          | 役割                                                    |
|-----------------------------------|---------------------------------------------------------|
| `static/js/repositories.js`       | localStorage を使った設定・進捗の永続化（クラスベース）  |
| `static/js/notification-service.js`| ブラウザ通知・Web Audio API による音声再生              |

---

## 3. Flask アプリケーション

`app.py` は `create_app()` ファクトリ関数でアプリを生成します。

```python
def create_app():
    app = Flask(__name__)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app
```

- `FLASK_DEBUG` 環境変数（`1` / `true` / `yes` / `on`）でデバッグモードを制御します。
- 現時点で REST API エンドポイントはありません。

---

## 4. フロントエンドモジュールの依存関係

各 JS モジュールはグローバル（`window.*`）経由で連携します。ブラウザでは以下の順でロードされます（`index.html` 内 `<script>` 順）。

```
timer-engine.js
  ↓ (window.TimerEngine, window.MODE, window.STATUS)
session-policy.js
  ↓ (window.SessionPolicy)
progress-service.js
  ↓ (window.ProgressService)
repositories.js
  ↓ (window.Repositories)
notification-service.js
  ↓ (window.NotificationService)
app.js  ← すべてを組み合わせる UI コントローラ
```

Node.js（Jest）環境では `require` / `module.exports` を使って同じモジュールをインポートできます。

---

## 5. 時刻取得の抽象化

タイマー状態は `Date.now()` を直接呼び出す代わりに `timeProvider` オブジェクトを注入する設計です。

```javascript
const realTimeProvider = { now: () => Date.now() };
// テストでは { now: () => fixedTime } を渡す
```

これにより、ユニットテストで固定時刻を使用でき、タブ切り替えによる時間ずれも防げます。

---

## 6. 永続化

| データ       | ストレージキー           | 形式       |
|--------------|--------------------------|------------|
| 設定値       | `pomodoro.settings.v1`   | JSON       |
| 今日の進捗   | `pomodoro.progress.v1`   | JSON       |

両方とも `localStorage` に保存されます。将来的には SQLite + Flask API へ移行できるよう、`SettingsRepository` / `ProgressRepository` クラスで操作を抽象化しています。

---

## 7. モード別 UI スタイル

`app.js` はタイマーモードに応じて `<body>` に CSS クラスを付与し、プログレスリングの色を変更します。

| モード       | CSS クラス           | リング色    |
|--------------|----------------------|-------------|
| 作業中       | `mode-work`          | `#7b7fe0`（紫） |
| 短休憩       | `mode-short-break`   | `#43a8c8`（青） |
| 長休憩       | `mode-long-break`    | `#39a76e`（緑） |
