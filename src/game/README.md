# game

遊戲邏輯，全部係純函數：計分、共識答案、對分、默契排名、稱號、題目生成。
**唔可以 import Firebase 或 React**，每個函數都要有 Vitest 測試。

## 檔案
- `room.js`：房間規則（人數、房號、host 移交）
- `compare.js`：答案格式檢查、兩個答案嘅比較（100 / 70 / 40 / 0 分級、圓形時間、排序先後、配對線數）
- `scoring.js`：`scoreQuestion`（每題分數同共識答案）、`scorePair`、`averagePairScore`
- `midgame.js`：`isMatch`（心靈相通）、`findSoleOutlier`（唯一異類）、`isUnanimous`（全場一致）、`thermometer`
- `overall.js`：`overallScore`、`groupTitle`
- `flow.js`：題目時限、在線玩家完成判斷、逾時揭曉、自動提交規則、下一題狀態

## 計分用嘅題目格式（階段 3 生成題目要跟）
```js
{
  type: 'choice' | 'slider' | 'time' | 'matching' | 'ranking' | 'guess',
  templateId: 'template-id', // 用過嘅模板／活動 id 追蹤；每局不可重複
  text: { zh: '...', en: '...' },
  theme: { zh: '...', en: '...' },  // choice / slider（通用版）/ matching / ranking / guess 先有；畀 UI 顯示「主題：XXX」做 caption
  options: [...],     // choice / guess：選項；matching：左邊 3 個物件；ranking：要排嘅 4 個物件
  adjectives: [...],  // matching：右邊 3 個形容詞
  targetUid: 'uid',   // guess：被猜嘅玩家
  sliderLabels: { min: { zh, en }, max: { zh, en } },  // slider 先有：0 分同 10 分兩端嘅文字
  hours: [21, 22, 23, 0, 1, 2, 3, 4],  // time 先有：呢題可以揀嘅鐘頭，順時間排好，可以跨午夜
}
```
`options` 同 `adjectives` 每項可以係 id 字串，或者 `{ id, zh, en }`，計分只讀 `id`。

`generateQuestions(playerUids, random)` 係純函數，輸出十題固定次序：choice、slider、choice、matching、choice、time、choice、ranking、guess、choice。每局十個 `templateId` 唔重複；`text` 同選項/形容詞顯示文字以 `{zh, en}` 儲存。guess 嘅 `{name}` placeholder 只喺 UI 顯示時以 `targetUid` 對應玩家姓名代入，唔寫入題目。揀邊個主題、邊個模板嘅規則見 `src/data/README.md`。

答案係 `{ [uid]: value }`，冇作答嘅玩家冇 entry：
- choice / guess：option id
- slider：0–10 整數；time：0–23 整數（23 同 0 相鄰）
- matching：`{ itemId: adjectiveId }`，最多 3 條線，未連嘅線唔使寫
- ranking：4 個 item id，由最高排到最低

格式唔啱嘅答案當冇作答。

## 階段 4A 房間流程

遊戲房間用 `current`（0–9）、`phase`（`answering` / `reveal`）同伺服器時間 `deadline` 同步所有玩家。一般題限時 10 秒，配對題 15 秒；答案允許至 deadline 後 2 秒寫入。玩家答案寫喺 `answers/{current}/{uid}`，格式 `{ value, ms }`，每人每題只寫一次。`ms` 係該玩家裝置按 Firebase server time offset 計算嘅作答時間。

`flow.js` 保持純函數，定義在線且未離開玩家嘅完成條件、逾時揭曉、自動提交及第十題後完局。遊戲中離開會保留 player entry 同之前答案，並設 `left: true`、`online: false`；交接 host 時只會揀在線且未離開玩家。

## 計分決定
- 作答少過 2 人：`score` 係 `null`，唔計入溫度計同總分
- 共識答案一定係玩家實際提交過嘅答案之一，唔會揀一個冇人揀過嘅「妥協」答案
- 最多一個人有分：0 分，`consensus` 係 `null`
- 共識打和：`consensus` 用候選次序第一個（選項題：選項定義次序；拉桿／時間：提交咗嘅數值入面最細嗰個；配對／排序：提交次序），`consensuses` 列晒所有並列答案；主流代表答中任何一個都計
- 猜朋友題：冇共識；目標冇作答或者冇人猜 → `null`；唔用「最多一個人有分 → 0」
- `playerScores` 同 `scorePair` 保留原數（配對題可能係 33.33…）；`score`、`averagePairScore`、`thermometer`、`overallScore` 用 `Math.round`
