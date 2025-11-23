# Front-End 666 Developer Guide

> 🧭 本文件提供前端專案的開發規範與操作說明。

> 若想快速了解專案整體架構，請參考 `README.md`。

---

## 🚀 Quick Start

```bash
cd new-front-end
pnpm install
pnpm dev
```

---

## 🌳 Branch Strategy

```
main                     # 穩定 / 發佈版本 (僅 PM / Leader 可操作)
└─ dev                   # 日常整合分支
   ├─ feat/<subject>     # 新功能
   ├─ fix/<subject>      # 錯誤修正
   ├─ test/<subject>     # 測試相關
   ├─ refactor/<subject> # 程式重構
   └─ chore/<subject>    # 其他雜項 (build script、config)
```

🔹 **合併規則**

* 功能完成後：發 PR → `dev`
* 發佈版本：由 PM/leader 合併 `dev` → `main`

---

## 📝 Commit Convention

採用 **Conventional Commits** 標準格式：

```
[type]: [subject]
```

### Type 說明

| Type       | 說明               |
| ---------- | ---------------- |
| `feat`     | 新增或修改功能          |
| `fix`      | 修正 bug           |
| `docs`     | 文件或註解調整          |
| `refactor` | 程式重構（非新功能或修 bug） |
| `chore`    | 開發環境、依賴、工具設定     |

✅ **Example**

```
feat: add login backend support
fix: correct scoreboard sorting when ties exist
```

> 💡 每個獨立修改請建立單一 commit，`subject` 請使用英文簡潔說明。

---

## Pull Request Convention

🔹 目標分支
- 預設 PR 目標為 dev
- main 僅由 PM/Leader 合併

標題格式：
```
[type](scope): summary
```

| Type       | 說明               |
| ---------- | ---------------- |
| `fix`     | 修 bug（含回歸修復）          |
| `style`      | 不影響邏輯的風格調整（格式、空白、CSS 微調）           |
| `docs`     | 文件或註解（README/dev.md/註解）        |
| `refactor` | 重構（非修 bug、非加功能） |
|`test`|測試相關（新增/調整 Playwright、unit、mock）|
| `chore`    | 其他雜項（腳本、工具、發版無關業務的改動）     |

✅ **Example**

```
refactor(course): move course pages under /courses
```

🔹 何時開 Pull Request
- 功能尚未完成但需要早期回饋
- 需要 CI 先跑檢查（lint/test/build）

🔹 PR 內容需包含
- What: 做了哪些變更（重點清單）
- How to test: 測試步驟（URL、流程、預期結果）
- Related: 關聯 Issue/PR、Closes #123（optional）

---

## 🖥️ Local Server Setup

### ➤ 同時啟動前後端（建議開發環境）

請先 clone [Backend Repository](https://github.com/Spaghetti-OJ/back_end.git) 並依其 README 啟動伺服器。

```bash
# Windows
pnpm add -D cross-env
pnpm exec cross-env NODE_ENV=test pnpm dev

# macOS / Linux
NODE_ENV=test pnpm dev
```

### ➤ 僅啟動前端

```bash
pnpm dev
```

---

## 🧪 End-to-End Testing (Playwright)

<!-- 測試檔位置：`/tests/*.spec.ts`

### 初次安裝瀏覽器

```bash
pnpm exec playwright install --with-deps
```

### 執行全部測試

```bash
pnpm exec playwright test
```

### 互動式 UI 模式

```bash
pnpm exec playwright test --ui
```

### 顯示測試報告

```bash
pnpm exec playwright show-report
```

### 錄製腳本

```bash
pnpm exec playwright codegen
```

### 推薦設定 (`playwright.config.ts`)

```ts
webServer: {
  command: 'pnpm dev -- --mode test',
  port: 5173,
  reuseExistingServer: !process.env.CI,
}
```

> 測試模式可透過 `.env.test` 指定後端或 mock server。 -->

I will post this README after researching.

---

## 🧩 建議開發流程

1. 從 `dev` 建立功能分支
2. 開發功能並確認本地測試通過
3. 建立 PR 並請leader Review
4. 經合併後刪除分支
5. 每週維護時更新依賴、Lint、Test

---

## 📚 Reference

- [Front-End Figma Prototype](https://www.figma.com/design/OnKJazsPhd9ks0L06GvtyR/SPJ_UI_prototype?node-id=0-1&t=94032nzKQwQYucuQ-1)
- [API Table](https://hackmd.io/pEW5zxeOQV61adoEJnmjCw)
- [Back-End Repository](https://github.com/Spaghetti-OJ/back_end.git)
- [Current NOJ](https://noj.tw/)
