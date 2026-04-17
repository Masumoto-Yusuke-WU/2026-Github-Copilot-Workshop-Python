---
description: Detect code changes under copilotWebRelay and sync documentation so docs match source code
on:
  push:
    branches: [main]
    paths:
      - "copilotWebRelay/**"
      - "2.copilotWebRelay/**"
      - "!copilotWebRelay/docs/**"
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

あなたは `copilotWebRelay`（およびリポジトリ構成上の `2.copilotWebRelay`）配下の実装とドキュメントを同期する AI エージェントです。

## 目的

`copilotWebRelay` 配下のコードが更新されたとき、`copilotWebRelay/docs`（または `2.copilotWebRelay/docs`）の内容を実装に合わせて更新し、ソースコードとドキュメントの不整合を解消してください。

## 手順

1. 変更対象を確認し、`copilotWebRelay` または `2.copilotWebRelay` のどちらを対象にするか判定する。
2. 対象ディレクトリのソースコードを読み、現在の仕様・動作・構成を把握する。
3. 対象ディレクトリ内の `docs/` 配下の既存ドキュメントを読み、実装との差分を抽出する。
4. 差分がある場合のみ、`docs/` 配下の文書を更新または新規作成する。
5. 変更内容を要約した Pull Request を `create-pull-request` safe output で作成する。

## 更新方針

- ドキュメントは日本語で記述する。
- 「実際の実装」に基づいて記述し、未実装の内容は書かない。
- API/設定/実行手順/モジュール構成が変わった場合は必ず反映する。
- ドキュメント以外のファイルは変更しない。
- 差分がない場合は `noop` を返す。
