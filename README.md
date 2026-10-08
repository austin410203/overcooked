# Drive-Thru Dash｜得來速餐廳大作戰

Three.js（React Three Fiber）+ React + TypeScript + Vite + Zustand 製作的等角低多邊形得來速時間管理遊戲。

## 功能
- 8 個關卡（JSON 化設定：`src/game/data/levels.ts`），1–3 星評分、解鎖與升級
- 中文 / English 即時切換（主選單、暫停選單、遊戲中下方列）
- 白天 / 晚上切換（燈光、路燈、霓虹、UI 配色同步變化；第 4 關預設晚上）
- 烤台 / 炸鍋 / 飲料機 / 組裝台 / 取餐窗 / 垃圾桶、燒焦機制、連擊倍率、VIP、雨天、塞車、設備故障事件
- 鍵盤、手把、手機虛擬搖桿；滾輪縮放；`` ` `` 開啟除錯面板；進度存於 localStorage

## 操作
WASD/方向鍵 移動 · E/空白鍵 互動 · 1–4 標示站台 · Esc 暫停

## 開發
```bash
npm install
npm run dev        # 本機開發
npm test           # 規則單元測試（Vitest）
npm run build      # typecheck + production build → dist/
```

## 部署到 Vercel
```bash
npm i -g vercel
vercel login
vercel --prod      # 於專案根目錄執行；vercel.json 已設定 Vite 與 dist
```
或將專案推上 GitHub，在 Vercel 後台 Import 該 repo（Framework 自動偵測為 Vite）。
