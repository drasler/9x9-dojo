# 前端 UI/UX、頁面風格與人機互動開發規範 (Frontend UI/UX Guidelines)

> 本規範融合 GitHub 開源社群與國際設計系統最佳實踐（包含 `cursor-designer`、`unicef/design-system`、`better-design`、`laws-of-ux` 及兒童數位人體工學標準），為本專案與後續前端開發之核心約束守則。

---

## 1. 嚴禁未定義字串洩漏 (Zero-Undefined Guarantee)
* **強制 Fallback 機制**：在任何動態渲染畫面中，嚴禁直接輸出可能為 `undefined` 或 `null` 的變數。
* **資料層雙重保險**：
  * 讀取物件屬性時必須使用預設值（例如：`item.text || item.qText || `${item.factorA} × ${item.factorB}``）。
  * 資料存入持久層（LocalStorage）時即時補齊必要欄位，並於 `loadProfile` 初始化時執行資料消毒（Sanitization），防呆歷史殘留髒資料。
* **排查標準**：畫面上絕對不可出現大寫或小寫的 `undefined`、`null` 或 `NaN`。

---

## 2. 佈局穩定度與按鈕文字排版 (Text-Wrap & Layout Stability)
* **按鈕防折行 (No-Wrap Buttons)**：所有主操作按鈕（CTA）、標籤（Badge）與倒數標記強制具備 `white-space: nowrap;`，避免中文字詞因容器寬度微幅變化而被突兀折成兩半（例如：「立即錯題特訓」被切斷為兩行）。
* **主按鈕全寬階層 (Visual Hierarchy)**：重要行動呼籲（如「🔥 立即錯題特訓」）應佔據主操作列全寬（`width: 100%`），字體放大並垂直居中，杜絕被次要按鈕擠壓。
* **彈性排版容器 (Flex Containment)**：卡片左右並排時，主要文字區塊須設定 `flex: 1; min-width: 0;`，狀態標籤區塊須設定 `flex-shrink: 0;`，以防止彈性盒子溢出或內容重疊。

---

## 3. 兒童友善觸控人體工學 (Child-Friendly Ergonomics)
* **放大觸控標靶 (Amplified Touch Targets)**：
  * 手機/平板端所有數字鍵、返回鍵與確認鍵，最小點擊區域不得小於 **48px × 48px**（符合 WCAG 2.1 AAA 標準與兒童手指運動發育精度）。
* **全螢幕無裁切聚焦 (Zero-Clipping Arena)**：
  * 進入測驗/作答狀態時，自動隱藏無關導航與標籤頁，確保「題目、輸入框、虛擬鍵盤、送出按鈕」100% 完整容納於單一視窗內，**嚴禁手機出現滾動條或按鍵被底部切除**。
* **寬容點擊判定 (Forgiving Hitboxes)**：九宮格鍵盤四周保留適度負空間（Gap），避免學童因誤觸相鄰數字產生連續挫折感。

---

## 4. 視力保護與抗暈眩動態 (Eye-Care & Motion Safety)
* **徹底禁止劇烈晃動 (No Shake Animations)**：答錯或逾時不得使用劇烈左右抖動（`translateX(-8px/8px)`）或爆閃動畫，避免發育期幼童眼部睫狀肌過度調節與眩暈。
* **柔和色彩漸變呼吸 (Gentle Glow Transitions)**：
  * 答錯提示改採深紅/粉橘微光（`rgba(244, 63, 94, 0.2)`）呼吸過渡。
  * 題目切換採透明度微漸入（`opacity: 0.3 -> 1`，時長 ≤ 0.2s），保持視覺平穩。

---

## 5. 即時感官回饋閉環 (Instant Sensory Feedback Loop)
* **杜赫蒂門檻 (Doherty Threshold < 100ms)**：
  * 任何按鍵點擊、輸入判定必須在 50ms 內觸發視覺（高亮/縮放微動態）與聽覺（Web Audio 程式碼合成音效）即時回饋。
* **多感官無縫切換**：
  * 視覺模式強調大字號與清晰字形。
  * 聽力模式隱藏算式，純聽台灣教育部課綱口語（`A 乘以 B` / `多少 乘以 B 等於 C`）。

---

## 6. 防禦型資料保存與教育閉環 (Pedagogical Guardrails)
* **杜絕投機手動跳過**：嚴格取消使用者手動「清空錯題」按鈕，錯題必須靠特訓答對兩次方能自資料庫永久銷毀。
* **弱點強制阻斷 (Prerequisite Lock)**：若錯題本尚有未消滅的錯題，全面鎖定階級闖關挑戰，引導學童優先克服自身弱點，奠定扎實心算基礎。
