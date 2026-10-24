---
name: ui-ux-design-system
description: >-
  前端 UI/UX 設計系統、視覺無障礙審查、兒童人機互動與版面穩定性檢驗技能。
  當需要設計、審查、重構或優化網頁前端介面、觸控體驗、動畫護眼、動態排版防溢出與教育遊戲阻斷機制時使用。
---

# UI/UX 設計系統與視覺人機互動審查手冊 (UI/UX Design System & Ergonomics)

本技能彙整 GitHub 開源專案（包含 design-systems、cursor-designer、laws-of-ux、unicef 兒童數位體驗指引）之實踐標準，提供前端工程師與 AI Agent 一套標準化的「設計檢核與實施流程」。

---

## 核心設計原則 (Guiding Principles)

1. **防禦型文字與狀態渲染 (Defensive Rendering)**
   * 所有動態注入 DOM 的變數必須有完備的 Fallback。
   * 絕不允許 `undefined`、`null`、`NaN` 出現在終端使用者的視線中。
   * 標籤、數字、行動呼籲（CTA）按鈕必須設定 `white-space: nowrap;` 防止折字。

2. **多裝置視窗適配與防裁切 (Zero-Clipping Responsive Layout)**
   * 測驗、算術與答題視圖強制實施「單屏容納」，動態計算 `vh`/`dvh` 或彈性縮放，嚴禁在手機上出現需要垂直滑動才能看見鍵盤的劣質體驗。
   * 虛擬鍵盤觸控標靶嚴格保持在 48px × 48px 以上，按鍵間隔 (gap) 保持 8px~12px。

3. **兒童護眼與神經感知安全 (Eye-Care & Motion Safety)**
   * 禁用快速高頻晃動（如連續震動、左右彈跳）。
   * 答錯提示使用輕微漸層光暈或柔和色彩切換（避免純紅爆閃）。
   * 動畫時長控制在 150ms ~ 250ms，以 ease-out 柔和收尾。

4. **教育閉環與成就防禦 (Pedagogical Guardrails)**
   * 取消容易導致投機的使用者手動清除弱點機制（如隨意一鍵清空錯題）。
   * 當存在未掌握的錯題時，以醒目標記引導或鎖定後續進階挑戰，促成「刻意練習」。

---

## 檢核清單 (UI/UX Audit Checklist)

在每次提交前端代碼或重構畫面時，執行以下五步驟檢驗：

### Step 1: 變數與字串滲透審查
* [ ] 檢查所有範本字串（Template Literals `` `${var}` ``），確認變數為 undefined 時是否有預設值。
* [ ] 檢查從 `localStorage` 或 API 讀取的歷史快照，是否有相容性補全（Sanitization）。

### Step 2: 版面穩定度與折行審查
* [ ] 檢查卡片內右側標籤是否有 `flex-shrink: 0;`。
* [ ] 檢查左側文本區是否有 `flex: 1; min-width: 0;`。
* [ ] 檢查主按鈕是否設定 `white-space: nowrap;`。

### Step 3: 手機與小螢幕觸控審查
* [ ] 使用 375px × 667px (iPhone SE) 模擬器測試。
* [ ] 確認虛擬鍵盤完整可見，沒有被瀏覽器底欄遮擋。
* [ ] 確認所有可點擊元素無重疊。

### Step 4: 色彩對比與動態審查
* [ ] 確認文字與背景之對比度符合 WCAG AA (≥ 4.5:1)。
* [ ] 確認無任何引發光敏性或眩暈的不必要動畫。

### Step 5: 行動確認
* [ ] 執行單元與瀏覽器自動化測試。
* [ ] 驗證通過後方可進行版本發布。
