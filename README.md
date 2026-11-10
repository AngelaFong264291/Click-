# 夾唔夾 · Do We Click?

一個 2–6 人嘅即時多人默契網頁遊戲。朋友分享一條連結就入到同一個房，一齊答十條題目，睇吓大家有幾夾。玩完會見到全組默契分、稱號，同埋你同每個朋友嘅默契排名。

介面有繁體中文（廣東話）同英文，每個玩家自己揀。

> 開發中。規則同設計見 [`docs/`](docs/)，開發階段同工作規則見 [`CLAUDE.md`](CLAUDE.md)。

## 技術
React + Vite（JavaScript）· Firebase Realtime Database · Firebase 匿名登入 · Firebase Hosting · Vitest · oxlint

## 本地開發
需要 Node.js 20 或以上。

第一次要設定 Firebase：將 `.env.example` 複製做 `.env.local`，填入 Firebase Console → Project settings → Your apps 入面嘅值。冇填嘅話，畫面會列出缺少咗邊幾個設定。

```bash
npm install        # 安裝依賴
npm run dev        # 開發伺服器（http://localhost:5173/）
npm run build      # 打包到 dist/
npm run preview    # 預覽打包結果
npm test           # 跑一次 Vitest
npm run test:watch # Vitest watch 模式
npm run lint       # oxlint
```

## 部署
網站：https://doweclick.web.app （Firebase Hosting，project `doweclick`）

push 去 `main` 就會自動 deploy：GitHub Actions（`.github/workflows/firebase-hosting-deploy.yml`）會跑 `npm ci` → `npm test` → `npm run build` → deploy 去 Firebase Hosting live channel。

GitHub repo 要有呢 8 個 Actions secrets：
- `VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_DATABASE_URL`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_STORAGE_BUCKET`、`VITE_FIREBASE_MESSAGING_SENDER_ID`、`VITE_FIREBASE_APP_ID`（同 `.env.local` 一樣）
- `FIREBASE_SERVICE_ACCOUNT_DOWECLICK`（由 `npx firebase-tools init hosting:github` 建立）

Realtime Database 安全規則（`database.rules.json`）唔會自動 deploy，要人手貼去 Firebase Console → Realtime Database → Rules。
