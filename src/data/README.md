# data

`groups.json`、`adjectives.json`、`activities.json` 同 `templates.json` 係本地 JSON 詞庫。`groups.json`/`adjectives.json`/`templates.json`/`activities.json` 已經係正式內容（第一批，12 個主題），唔再係樣本。

## 格式

### `groups.json`（主題）
每個主題有：
- `id`：唯一字串
- `name`：`{zh, en}`
- `category`：`food` | `object` | `animal` | `place` | `activity` | `habit` 其中一個，決定邊啲模板適用（見下面「適用」）
- `direction`：內部用嘅自由文字 slug（例如 `taste`、`social-energy`），淨係俾生成器盡量將一局題目嘅主題分散用，唔會顯示俾玩家，唔計分
- `items`：陣列，每件物件有 `id`（跨主題都要唯一）、`zh`、`en`，可選 `tags`（見下面）

選項/猜朋友/排序題適用嘅主題最少要有 4 件物件；配對題最少要有 3 件物件。

### `adjectives.json`
每個形容詞有 `id`、`zh`、`en`，同埋 `groups`：
- `"all"`：適用於所有主題（呢份內容全部形容詞都係咁）
- 或者一個主題 id 陣列，淨係適用於嗰幾個主題

可選 `tags`。

### `templates.json`
每個模板有 `id`、`type`（`choice` / `slider` / `matching` / `ranking` / `guess`）、`text: {zh, en}`。**時間題冇模板**，見下面 `activities.json`。

- `choice` / `matching` / `ranking` / `guess`：有 `suited`欄位，`"all"` 或者一個分類陣列（例如 `["food", "object"]`），決定呢個模板淨係可以配邊類主題。`text` 可以用 `{item}`、`{adj}` placeholder（可選，唔一定要用——依家大部分模板都係冇 placeholder 嘅純文字，靠 `options` 本身帶出主題），`guess` 一定要有 `{name}`（留到 UI 顯示時先代入目標玩家名）。
- `slider`：兩種：
  - 通用版（`standalone` 冇寫或者 `false`）：`text` 要有 `{item}` 同 `{adj}`，`suited` 通常係 `"all"`。
  - 獨立題（`standalone: true`）：`text` 已經係完整題目，冇 placeholder，`suited` 唔使填。
  - 兩種都要有 `sliderLabels: { min: {zh, en}, max: {zh, en} }`（0 分同 10 分嘅文字，顯示喺拉桿兩端）。
- 可選 `tags`。

模板嘅 `{item}`/`{adj}` 唔一定要全部用晒——冇用到嘅 placeholder 唔會報錯，生成器照樣會揀主題/形容詞嚟計分、組 `options`，但淨係會代入模板文字入面真係有嘅 placeholder。

每局需要 5 個不同選項題模板，其他類型（slider/matching/ranking/guess）各至少 1 個。

### `activities.json`（時間題）
時間題唔用模板，每個活動自己就係一條完整題目：
- `id`：唯一字串
- `text`：`{zh, en}`，完整題目文字
- `hourRange`：`{ start, end }`，兩個都係 0–23 嘅整數鐘頭；`end < start` 即係跨咗午夜（例如 `{start:21, end:4}` = 晚上 9 點到第二朝 4 點），`game/compare.js` 嘅 `hoursInRange(start, end)` 會計返個順序列表
- 可選 `tags`

生成題目時，`hoursInRange` 嘅結果會存入題目嘅 `hours` 欄位，UI 淨係會畀嗰幾粒鐘頭嘅掣（唔再係成日 24 粒）。答案本身仍然係 0–23 嘅鐘頭數字，計分邏輯完全冇變。

### 標籤（tags）
目前得兩個：`hk`（港味：香港特有，但其他亞洲人都估到；冇標籤即亞洲通用）、`spicy`（將來公司模式會過濾嘅內容；依家淨係記低，唔會過濾任何嘢）。`items`、`adjectives`、`templates`、`activities` 都可以有可選嘅 `tags` 陣列。

## 生成器點樣揀主題

`generateQuestions.js` 幫 choice / slider（通用版）/ matching / ranking / guess 揀「模板 + 主題」組合時：
1. 主題嘅 `category` 一定要啱模板嘅 `suited`（或者模板 `suited` 係 `"all"`）—— 呢條係硬性規則，唔會放寬。
2. 盡量揀個 `direction` 未用過嘅主題，等一局題目唔會成日圍住同一種感覺轉；如果冇未用過方向嘅選擇，就唔理呢條（唔會因為方向唔夠而整唔到局）。

## 手動新增內容（下一批）

1. 每個主題記得填 `category`（6 揀 1）同 `direction`（自己揀個 slug，跨主題可以重複）。
2. 每筆資料用穩定且唯一嘅 `id`（物件 id 要跨主題唯一）；每個顯示文字填好 `zh` 同 `en`。
3. 形容詞如果冇特別限制就寫 `"groups": "all"`；要限制就寫主題 id 陣列。
4. 新增模板記得填 `suited`（`choice`/`matching`/`ranking`/`guess`）；`slider` 記得填 `sliderLabels`，同埋決定係通用版定獨立題。Placeholder 唔使勉強加，冇用到嘅就唔好寫。
5. 新增時間活動用 `text` + `hourRange`，唔使自己計按鈕數量。
6. 得閒先用嘅標籤（`hk`、`spicy`）：淨係記低用途，依家唔會影響生成或計分。
7. 跑 `npm test`。`src/data/data.test.js` 會指出重複 ID、缺少翻譯、分類/方向/範圍錯誤、placeholder 用錯、tag 用錯呢類問題；生成器亦會喺開局前對不足內容提供清楚錯誤。
