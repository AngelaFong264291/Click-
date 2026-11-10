# game

遊戲邏輯，全部係純函數：計分、共識答案、對分、默契排名、稱號、題目生成。
**唔可以 import Firebase 或 React**，每個函數都要有 Vitest 測試。

## 檔案
- `room.js`：房間規則（人數、房號、host 移交）
- `compare.js`：答案格式檢查、兩個答案嘅比較（100 / 70 / 40 / 0 分級、圓形時間、排序先後、配對線數）
- `scoring.js`：`scoreQuestion`（每題分數同共識答案）、`scorePair`、`averagePairScore`
- `midgame.js`：`isMatch`（心靈相通）、`findSoleOutlier`（唯一異類）、`isUnanimous`（全場一致）、`thermometer`
- `overall.js`：`overallScore`、`groupTitle`

## 計分用嘅題目格式（階段 3 生成題目要跟）
```js
{
  type: 'choice' | 'slider' | 'time' | 'matching' | 'ranking' | 'guess',
  options: [...],     // choice / guess：選項；matching：左邊 3 個物件；ranking：要排嘅 4 個物件
  adjectives: [...],  // matching：右邊 3 個形容詞
  targetUid: 'uid',   // guess：被猜嘅玩家
}
```
`options` 同 `adjectives` 每項可以係 id 字串，或者 `{ id, zh, en }`，計分只讀 `id`。

答案係 `{ [uid]: value }`，冇作答嘅玩家冇 entry：
- choice / guess：option id
- slider：0–10 整數；time：0–23 整數（23 同 0 相鄰）
- matching：`{ itemId: adjectiveId }`，最多 3 條線，未連嘅線唔使寫
- ranking：4 個 item id，由最高排到最低

格式唔啱嘅答案當冇作答。

## 計分決定
- 作答少過 2 人：`score` 係 `null`，唔計入溫度計同總分
- 最多一個人有分：0 分，`consensus` 係 `null`
- 共識打和：`consensus` 用候選次序第一個（選項次序、最細數值、排列次序），`consensuses` 列晒所有並列答案；主流代表答中任何一個都計
- 猜朋友題：冇共識；目標冇作答或者冇人猜 → `null`；唔用「最多一個人有分 → 0」
- `playerScores` 同 `scorePair` 保留原數（配對題可能係 33.33…）；`score`、`averagePairScore`、`thermometer`、`overallScore` 用 `Math.round`
