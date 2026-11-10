# 夾唔夾 / Do We Click?

一個 2–6 人嘅即時多人默契網頁遊戲。朋友分享一條連結就入到同一個房，一齊答十條題目，系統按大家答案嘅吻合程度計「默契分」。玩完之後，每個人會見到自己同其他人嘅默契排名，同埋全組嘅稱號。介面有繁體中文（廣東話口語）同英文，每個玩家自己揀。

## 文件優先次序
文件之間有衝突時，以排前嗰份為準：
1. `docs/proposal-v2.pdf`：遊戲規則、計分、資料結構、中英雙語
2. `docs/design/ocamp-design.html`：視覺設計稿（大花紙 O'Camp 風格）。呢份係參考，唔係可以直接用嘅 code，要抽出 design tokens 再用 React 重寫
3. `docs/prototype-notes.md`

## 技術
- **前端**：React + Vite，用 **JavaScript**，唔好轉 TypeScript
- **即時同步**：Firebase Realtime Database
- **玩家身份**：Firebase 匿名登入
- **部署**：GitHub Pages，repo 名係 `Click-`，`vite.config.js` 嘅 `base: '/Click-/'`（階段 1 先加）
- **路由**：HashRouter（GitHub Pages 唔支援 SPA fallback）
- **測試**：Vitest（`npm test`）。排錯：如果見到 `Cannot read properties of undefined (reading 'config')` 而一個測試都冇跑，通常係 terminal 用咗細楷 drive letter（`c:\`），Vitest load 咗兩份自己。用大楷路徑 `cd C:\...` 再跑就得
- **Lint**：保留 oxlint（`npm run lint`）
- **介面語言**：自建 `t()` 加 `src/i18n/zh-HK.json`、`en.json`，唔好加大型 i18n 套件
- **截圖**：html2canvas（階段 8）

## 開發階段
| 階段 | 內容 |
|---|---|
| 0 | 準備工作：清理 template、CLAUDE.md、i18n 基礎、folder 結構、Vitest |
| 1 | Firebase、匿名登入、開房入房、大堂、host 移交、部署 GitHub Pages |
| 2 | 計分邏輯 + 測試 |
| 3 | 詞庫格式 + 題目生成 |
| 4 | 遊戲流程：作答、倒數、揭曉 |
| 5 | 默契排名、結果、稱號 |
| 6 | Design tokens + 樣板頁 |
| 7 | 套用設計到各畫面 |
| 8 | 英文內容、分享圖、彈窗特效 |

## 工作規則
1. **每次只做一個階段。** 做完就停，唔好自動開始下一個階段。
2. **動手前先出計劃**，列明會新增、修改同刪除嘅檔案，等用戶確認先開始。
3. **唔好改階段範圍以外嘅嘢。** 如果發現範圍外有問題，記低再話俾用戶知，唔好自己改。
4. **所有介面文字都要經 `t()`**（`useLanguage()` 返回嘅 `t`），唔好喺元件入面寫死字串。中文同英文要同時加入 `zh-HK.json` 同 `en.json`。
5. **計分邏輯係純函數**，放喺 `src/game/`，唔可以依賴 Firebase 或 React，要有 Vitest 測試。
6. 做完要 run `npm run build`、`npm test` 同 `npm run lint`，確認冇錯誤。

## 設計重點（摘自提案）
- 語言只記喺自己裝置（localStorage），唔寫入房間狀態。預設跟瀏覽器語言，`zh*` 用繁中，其他用英文。
- 答案存物件編號，唔存文字，所以中文玩家同英文玩家嘅答案可以直接比較。
- 題目嘅 `text`、`options`、`adjectives` 以 `{zh, en}` 儲存。
- 房主開局時一次過生成題目。所有畫面由房間嘅 `status` 同 `current` 控制，倒數只寫結束時間戳，房主離線用 `onDisconnect` 偵測並移交。

## 結構
```
src/
  i18n/        t()、LanguageProvider、useLanguage、zh-HK.json、en.json
  components/  可重用 UI 元件
  screens/     各畫面
  game/        純函數遊戲邏輯（計分、排名、題目生成）
  firebase/    Firebase 初始化同讀寫
  data/        詞庫同題目模板 JSON
  styles/      design tokens```
