# データモデル仕様

## 1. TimerState（タイマー状態）

`timer-engine.js` の `createTimerState()` で生成されるオブジェクトです。DOM や localStorage には依存しません。

```javascript
{
  mode:            string,   // 現在のモード（MODE 定数参照）
  status:          string,   // 稼働状態（STATUS 定数参照）
  remainingMs:     number,   // idle 時の残りミリ秒
  endTime:         number | null,  // running 中の終了予定エポック(ms)。idle/paused は null
  pausedRemaining: number | null,  // paused 中の残りミリ秒。idle/running は null
  settings:        Settings, // このセッションの設定値コピー
}
```

### 1.1 MODE 定数

| 値             | 説明         |
|----------------|--------------|
| `work`         | 作業中       |
| `short_break`  | 短い休憩     |
| `long_break`   | 長い休憩     |

### 1.2 STATUS 定数

| 値        | 説明                   |
|-----------|------------------------|
| `idle`    | 未開始（または完了後） |
| `running` | カウントダウン中       |
| `paused`  | 一時停止中             |

---

## 2. Settings（設定値）

`SettingsRepository` が localStorage から読み書きするオブジェクトです。

```javascript
{
  workMinutes:       number,  // 作業時間（分）。デフォルト: 25
  shortBreakMinutes: number,  // 短休憩時間（分）。デフォルト: 5
  longBreakMinutes:  number,  // 長休憩時間（分）。デフォルト: 15
  longBreakInterval: number,  // 長休憩に入るまでの作業回数。デフォルト: 4
}
```

**デフォルト値**（`DEFAULT_SETTINGS`）：

| フィールド            | デフォルト値 |
|-----------------------|-------------|
| `workMinutes`         | 25           |
| `shortBreakMinutes`   | 5            |
| `longBreakMinutes`    | 15           |
| `longBreakInterval`   | 4            |

**バリデーション**  
`sanitizeSettings()` により、すべてのフィールドは正の整数に正規化されます。0 以下・非数値の場合はデフォルト値が使用されます。

**localStorage キー**: `pomodoro.settings.v1`

---

## 3. Progress（進捗データ）

`ProgressRepository` が localStorage から読み書きするオブジェクトです。

```javascript
{
  dateKey:        string,  // 日付キー（"YYYY-MM-DD" 形式）
  completedCount: number,  // 今日の作業セッション完了回数
  focusedMinutes: number,  // 今日の累積集中時間（分）
}
```

**初期値**：

| フィールド       | 初期値       |
|------------------|-------------|
| `dateKey`        | 今日の日付   |
| `completedCount` | 0            |
| `focusedMinutes` | 0            |

**日付キー形式**  
`ProgressService.formatDateKey(date)` が `Date` オブジェクトを受け取り `"YYYY-MM-DD"` 文字列を返します。

```javascript
formatDateKey(new Date(2026, 3, 17)) // => "2026-04-17"
```

**日付変更時の動作**  
`ensureToday(progress, currentDateKey)` が呼ばれ、`dateKey` が今日と異なる場合は新しい空の進捗オブジェクトを返します（前日データは自動的に破棄されます）。

**localStorage キー**: `pomodoro.progress.v1`

---

## 4. データフロー概要

```
ページロード時
  SettingsRepository.load(DEFAULT_SETTINGS)
    → settings: Settings
  ProgressRepository.load(createProgress(todayKey))
    → raw progress
  ensureToday(raw progress, todayKey)
    → progress: Progress（日付が違えばリセット）

作業セッション完了時
  recordWorkCompletion(progress, workMinutes, todayKey)
    → updated progress（completedCount +1、focusedMinutes 加算）
  ProgressRepository.save(updated progress)

設定保存時
  SettingsRepository.save(formValues, DEFAULT_SETTINGS)
    → sanitized settings（バリデーション済み）
  createTimerState(settings)
    → 新しい TimerState
```
