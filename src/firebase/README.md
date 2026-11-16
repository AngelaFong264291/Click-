# firebase

Firebase 初始化、匿名登入、Realtime Database 讀寫（開房、入房、作答、host 移交）。遊戲邏輯唔好放呢度，應該放 `src/game/`。

遊戲期間房間以 `status`、`current`、`phase`、`deadline` 同步畫面；host 開始／下一題時以 `.info/serverTimeOffset` 計算 deadline。答案各自寫入 `answers/{questionIndex}/{uid}`，規則限制只可首次寫入自己當前題答案。遊戲中離開會先交接 host（如適用），再把玩家標記為 `left`，保留玩家及答案供後續計分。
