# 夾唔夾 · Do We Click?

一個 2–6 人嘅即時多人默契網頁遊戲。朋友分享一條連結就入到同一個房，一齊答十條題目，睇吓大家有幾夾。玩完會見到全組默契分、稱號，同埋你同每個朋友嘅默契排名。

介面有繁體中文（廣東話）同英文，每個玩家自己揀。

> 開發中。規則同設計見 [`docs/`](docs/)，開發階段同工作規則見 [`CLAUDE.md`](CLAUDE.md)。

## 技術
React + Vite（JavaScript）· Firebase Realtime Database · Firebase 匿名登入 · GitHub Pages · Vitest · oxlint

## 本地開發
需要 Node.js 20 或以上。

```bash
npm install        # 安裝依賴
npm run dev        # 開發伺服器（http://localhost:5173）
npm run build      # 打包到 dist/
npm run preview    # 預覽打包結果
npm test           # 跑一次 Vitest
npm run test:watch # Vitest watch 模式
npm run lint       # oxlint
```
