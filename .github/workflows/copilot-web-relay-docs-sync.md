---
description: Detect code changes under 2.copilotWebRelay and sync documentation so docs match source code
on:
  push:
    branches: [main]
    paths:
      - "2.copilotWebRelay/**"
      - "!2.copilotWebRelay/docs/**"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
  issues: read
tools:
  github:
safe-outputs:
  create-pull-request:
    title-prefix: "docs(copilotWebRelay): "
    labels: [documentation]
    draft: true
---

# Copilot Web Relay Documentation Sync

あなたは `2.copilotWebRelay` 配下の実装とドキュメントを同期する AI エージェントです。

## 目的

`2.copilotWebRelay` 配下のコードが更新されたとき、`2.copilotWebRelay/docs` の内容を実装に合わせて更新し、ソースコードとドキュメントの不整合を解消してください。

## 手順

1. `2.copilotWebRelay` 配下のソースコードを読み、現在の仕様・動作・構成を把握する。
2. `2.copilotWebRelay/docs/` 配下の既存ドキュメントを読み、実装との差分を抽出する。
3. 差分がある場合のみ、`2.copilotWebRelay/docs/` 配下の文書を更新または新規作成する。
4. 変更内容を要約した Pull Request を `create-pull-request` safe output で作成する。

## 更新方針

- ドキュメントは日本語で記述する。
- 「実際の実装」に基づいて記述し、未実装の内容は書かない。
- API/設定/実行手順/モジュール構成が変わった場合は必ず反映する。
- ドキュメント以外のファイルは変更しない。
- 差分がない場合は `noop` を返す。
