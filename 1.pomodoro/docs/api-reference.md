# API リファレンス

現在の実装では、Flask はページ配信のみを担当しており、REST API エンドポイントは存在しません。将来的な API 拡張に向けた参考として、既存のルートを記載します。

---

## ルート一覧

### `GET /`

**概要**  
アプリケーションのメインページ（ポモドーロタイマー画面）を返します。

**リクエスト**

| 項目       | 内容                |
|------------|---------------------|
| メソッド   | GET                 |
| パス       | `/`                 |
| リクエストボディ | なし          |

**レスポンス**

| ステータスコード | 内容                             |
|------------------|----------------------------------|
| `200 OK`         | `templates/index.html` を返す     |

**レスポンス例**

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html lang="ja">
  ...
</html>
```

---

## 静的ファイル

以下の静的ファイルが Flask の静的ファイル配信機能によって提供されます。

| パス                                 | 種別       |
|--------------------------------------|------------|
| `/static/css/style.css`              | スタイルシート |
| `/static/js/timer-engine.js`         | タイマードメインロジック |
| `/static/js/session-policy.js`       | セッションポリシー |
| `/static/js/progress-service.js`     | 進捗集計サービス |
| `/static/js/repositories.js`         | localStorage リポジトリ |
| `/static/js/notification-service.js` | 通知サービス |
| `/static/js/app.js`                  | UI コントローラ |

---

## 今後の拡張（予定）

将来的には以下の REST API エンドポイントを追加する予定です（未実装）。

- `GET /api/settings` — 設定値の取得
- `POST /api/settings` — 設定値の保存
- `GET /api/progress` — 今日の進捗取得
- `POST /api/progress` — 進捗の記録
