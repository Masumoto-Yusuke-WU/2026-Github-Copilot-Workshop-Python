# フロントエンドモジュール仕様

## 1. モジュール一覧

| ファイル                          | グローバル変数          | 役割                                  |
|-----------------------------------|-------------------------|---------------------------------------|
| `static/js/timer-engine.js`       | `window.TimerEngine`    | タイマードメインロジック（純粋関数）  |
| `static/js/session-policy.js`     | `window.SessionPolicy`  | セッション完了後の次モード決定        |
| `static/js/progress-service.js`   | `window.ProgressService`| 進捗集計・日付リセット判定            |
| `static/js/repositories.js`       | `window.Repositories`   | localStorage リポジトリ               |
| `static/js/notification-service.js`| `window.NotificationService` | ブラウザ通知・音声通知           |
| `static/js/app.js`                | なし（IIFE）            | UI コントローラ・モジュール結合       |

---

## 2. timer-engine.js

タイマーのドメインロジックを担当します。DOM・localStorage に依存しない純粋関数で構成されています。

### 公開 API（`window.TimerEngine`）

#### 定数

```javascript
MODE.WORK        // 'work'
MODE.SHORT_BREAK // 'short_break'
MODE.LONG_BREAK  // 'long_break'

STATUS.IDLE      // 'idle'
STATUS.RUNNING   // 'running'
STATUS.PAUSED    // 'paused'

DEFAULT_SETTINGS // { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 }
```

#### 関数

| 関数                                              | 戻り値        | 説明                                                   |
|---------------------------------------------------|--------------|--------------------------------------------------------|
| `createTimerState(settings?)`                     | `TimerState` | 初期タイマー状態を生成する                              |
| `totalMs(state)`                                  | `number`     | 現在モードの総ミリ秒を返す                              |
| `getRemainingMs(state, timeProvider)`             | `number`     | 残りミリ秒を返す（0 以上）                              |
| `getRemainingSeconds(state, timeProvider)`        | `number`     | 残り秒（切り上げ）を返す                                |
| `isComplete(state, timeProvider)`                 | `boolean`    | タイマーが完了しているかを返す                          |
| `start(state, timeProvider)`                      | `TimerState` | タイマーを開始する（idle / paused から呼び出し可能）   |
| `pause(state, timeProvider)`                      | `TimerState` | タイマーを一時停止する（running 時のみ有効）           |
| `resume(state, timeProvider)`                     | `TimerState` | 一時停止を再開する（paused 時のみ有効）                |
| `reset(state)`                                    | `TimerState` | タイマーをリセットする（現在モードの初期時間に戻す）   |
| `completeSession(state, nextMode)`                | `TimerState` | セッション完了後に次のモードへ遷移する                  |
| `realTimeProvider`                                | オブジェクト | 本番用 TimeProvider `{ now: () => Date.now() }`        |

---

## 3. session-policy.js

セッション完了後の次モードを決定する純粋ロジックです。

### 公開 API（`window.SessionPolicy`）

#### `nextMode(currentMode, completedWorkCount, longBreakInterval)`

| 引数                  | 型       | 説明                                   |
|-----------------------|----------|----------------------------------------|
| `currentMode`         | `string` | 完了したモード（`MODE` 定数）         |
| `completedWorkCount`  | `number` | 今回の完了後の作業セッション累計回数  |
| `longBreakInterval`   | `number` | 何回ごとに長休憩にするか              |

**戻り値**: `string`（次のモード）

**ルール**:
- `work` 完了時: `completedWorkCount % longBreakInterval === 0` なら `long_break`、それ以外は `short_break`
- `short_break` / `long_break` 完了時: `work` に戻る

```javascript
nextMode('work', 4, 4)  // => 'long_break'
nextMode('work', 1, 4)  // => 'short_break'
nextMode('short_break', 1, 4) // => 'work'
```

---

## 4. progress-service.js

進捗の集計と日付管理を担当する純粋関数群です。

### 公開 API（`window.ProgressService`）

| 関数                                              | 戻り値      | 説明                                                            |
|---------------------------------------------------|------------|----------------------------------------------------------------|
| `formatDateKey(date)`                             | `string`   | `Date` オブジェクトを `"YYYY-MM-DD"` 形式に変換する             |
| `todayKey(timeProvider?)`                         | `string`   | 今日の日付キーを返す（`timeProvider` 未指定時は `Date.now()` 使用）|
| `createProgress(dateKey)`                         | `Progress` | 空の進捗オブジェクトを生成する                                   |
| `ensureToday(progress, currentDateKey)`           | `Progress` | 日付が異なる場合は空の進捗を返す（日付変更リセット）            |
| `recordWorkCompletion(progress, workMinutes, currentDateKey)` | `Progress` | 作業完了時に進捗を更新する（+1 回、+workMinutes 分）|

---

## 5. repositories.js

localStorage への読み書きを担当するクラスです。

### localStorage キー

| キー                       | 内容           |
|----------------------------|----------------|
| `pomodoro.settings.v1`     | 設定値 JSON    |
| `pomodoro.progress.v1`     | 進捗データ JSON|

### `SettingsRepository`

```javascript
const repo = new SettingsRepository(storage?, key?)
```

| メソッド                          | 戻り値     | 説明                                              |
|-----------------------------------|-----------|---------------------------------------------------|
| `load(defaultSettings)`           | `Settings` | localStorage から設定を読み込む。無効値はデフォルト値で補完 |
| `save(settings, defaultSettings)` | `Settings` | バリデーション済み設定を localStorage に保存する            |

### `ProgressRepository`

```javascript
const repo = new ProgressRepository(storage?, key?)
```

| メソッド              | 戻り値     | 説明                                               |
|-----------------------|-----------|---------------------------------------------------|
| `load(defaultProgress)` | `Progress` | localStorage から進捗を読み込む                  |
| `save(progress)`       | `Progress` | 進捗を localStorage に保存する                   |

---

## 6. notification-service.js

ブラウザ通知と Web Audio API による通知音を担当します。

### 公開 API（`window.NotificationService`）

| 関数                                          | 戻り値          | 説明                                                |
|-----------------------------------------------|----------------|-----------------------------------------------------|
| `buildCompletionMessage(mode)`                | `string`       | モードに応じた完了メッセージを返す                   |
| `playBeep(audioContextFactory?)`              | `void`         | 880Hz サイン波で通知音を再生する（0.3 秒）           |
| `requestPermissionIfNeeded(NotificationApi?)` | `Promise<string>` | ブラウザ通知の権限をリクエストする               |
| `notifySessionCompleted(mode, NotificationApi?)` | `void`      | セッション完了時にブラウザ通知を送信する             |

**`buildCompletionMessage` の返り値例**:

| モード            | メッセージ                                   |
|-------------------|----------------------------------------------|
| `work`            | 作業セッションが完了しました。休憩しましょう。 |
| `short_break`     | 休憩が終了しました。次の作業を始めましょう。   |
| `long_break`      | 休憩が終了しました。次の作業を始めましょう。   |

---

## 7. app.js（UI コントローラ）

IIFE（即時実行関数）として実装された UI コントローラです。各モジュールを組み合わせ、DOM との橋渡しを行います。

### 管理する DOM 要素

| 要素 ID               | 役割                          |
|-----------------------|-------------------------------|
| `timer-display`       | 残り時間テキスト表示          |
| `mode-label`          | 現在モード名表示              |
| `btn-start`           | 開始/一時停止/再開ボタン      |
| `btn-reset`           | リセットボタン                |
| `completed-count`     | 今日の完了回数表示            |
| `focus-time`          | 今日の集中時間表示            |
| `ring-progress`       | SVG プログレスリング          |
| `setting-work`        | 作業時間入力フィールド        |
| `setting-short-break` | 短休憩時間入力フィールド      |
| `setting-long-break`  | 長休憩時間入力フィールド      |
| `setting-interval`    | 長休憩間隔入力フィールド      |
| `btn-save-settings`   | 設定保存ボタン                |

### タイマーの更新周期

250ms 間隔の `setInterval` で `isComplete()` を確認し、完了していれば `handleCompletion()` を、そうでなければ `render()` を呼び出します。

### プログレスリングの計算

円（r=80）の円周 `2π × 80 ≈ 502.65` を使用し、`stroke-dashoffset` を調整して進捗率を表示します。

```javascript
const RING_CIRCUMFERENCE = 2 * Math.PI * 80; // ≈ 502.65
strokeDashoffset = RING_CIRCUMFERENCE * (1 - remainingMs / totalMs);
```

---

## 8. テスト環境

Jest を使用して各 JS モジュールの単体テストを実行します。

| テストファイル                       | テスト対象                  |
|--------------------------------------|-----------------------------|
| `tests/timer-engine.test.js`         | `timer-engine.js`           |
| `tests/session-policy.test.js`       | `session-policy.js`         |
| `tests/progress-service.test.js`     | `progress-service.js`       |
| `tests/repositories.test.js`         | `repositories.js`           |
| `tests/notification-service.test.js` | `notification-service.js`   |

各 JS モジュールは `module.exports` でテスト用にエクスポートされており、ブラウザ用の `window.*` 公開と Jest 用の `module.exports` を両立しています。
