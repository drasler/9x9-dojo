/**
 * 9x9 乘法大師 - 主應用控制器 (Main Application Controller)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 取得引擎與音效全域實例
    const engine = window.multiplicationEngine;
    const sound = window.soundEngine;

    // 應用狀態
    const state = {
        activeTab: 'adventure',      // 'adventure' | 'exam' | 'practice'
        inGame: false,
        gameMode: null,              // 'tier' | 'exam_time' | 'exam_count' | 'practice' | 'mistakes'
        activeTierId: 1,

        // 題目與統計
        currentQuestionIndex: 0,
        totalQuestionsInRound: 10,
        correctCount: 0,
        wrongCount: 0,
        combo: 0,
        maxComboInRound: 0,
        inputBuffer: '',

        // 計時器
        timerId: null,
        totalTimeRemaining: 0,       // 整局倒數 (例如檢定考 60s)
        totalTimeAllocated: 0,
        questionTimeRemaining: 0,    // 單題倒數 (例如疾風關卡 4s)
        questionTimeAllocated: 0,
        roundStartTime: 0,

        // 自由練習配置
        practiceFactors: [2, 3, 4, 5, 6, 7, 8, 9],
        practiceOrder: 'random',
        practiceType: 'normal',
        practiceSeqIndex: 0,

        // 錯題特訓隊列
        mistakesQueue: []
    };

    // DOM 元素快取
    const DOM = {
        // 頂部導航
        btnBrandHome: document.getElementById('btn-brand-home'),
        headerUserTier: document.getElementById('header-user-tier'),
        btnToggleSound: document.getElementById('btn-toggle-sound'),
        btnToggleVoice: document.getElementById('btn-toggle-voice'),
        btnOpenChart: document.getElementById('btn-open-chart'),
        btnOpenMistakes: document.getElementById('btn-open-mistakes'),
        mistakeCountBadge: document.getElementById('mistake-count-badge'),
        btnToggleTheme: document.getElementById('btn-toggle-theme'),

        // 模式切換 Tabs
        mainModeTabs: document.getElementById('main-mode-tabs'),
        modeTabs: document.querySelectorAll('.mode-tab'),

        // 主視圖
        viewAdventure: document.getElementById('view-adventure'),
        viewExam: document.getElementById('view-exam'),
        viewPractice: document.getElementById('view-practice'),
        viewArena: document.getElementById('view-arena'),

        // 統計概覽
        statCurrentTier: document.getElementById('stat-current-tier'),
        statTotalStars: document.getElementById('stat-total-stars'),
        statTotalCorrect: document.getElementById('stat-total-correct'),
        statMaxCombo: document.getElementById('stat-max-combo'),

        // 關卡網格
        adventureStagesGrid: document.getElementById('adventure-stages-grid'),

        // 檢定考設置
        examTypeBtns: document.querySelectorAll('.exam-type-btn'),
        examTimeOptions: document.getElementById('exam-time-options'),
        examCountOptions: document.getElementById('exam-count-options'),
        examOptBtns: document.querySelectorAll('.exam-opt-btn'),
        examCountBtns: document.querySelectorAll('.exam-count-btn'),
        btnStartExam: document.getElementById('btn-start-exam'),

        // 自由練習設置
        practiceFactorsSelector: document.getElementById('practice-factors-selector'),
        practiceOrderSelect: document.getElementById('practice-order-select'),
        practiceTypeSelect: document.getElementById('practice-type-select'),
        btnStartPractice: document.getElementById('btn-start-practice'),

        // 作答戰場 Arena
        arenaModeBadge: document.getElementById('arena-mode-badge'),
        arenaProgressText: document.getElementById('arena-progress-text'),
        arenaComboDisplay: document.getElementById('arena-combo-display'),
        arenaTimeText: document.getElementById('arena-time-text'),
        arenaTimeBar: document.getElementById('arena-time-bar'),
        arenaQuestionText: document.getElementById('arena-question-text'),
        arenaAnswerBox: document.getElementById('arena-answer-box'),
        arenaAnswerVal: document.getElementById('arena-answer-val'),
        arenaNumpad: document.getElementById('arena-numpad'),
        btnQuitArena: document.getElementById('btn-quit-arena'),
        btnSubmitAnswer: document.getElementById('btn-submit-answer'),

        // 彈窗
        modalStageClear: document.getElementById('modal-stage-clear'),
        modalClearIcon: document.getElementById('modal-clear-icon'),
        modalClearTitle: document.getElementById('modal-clear-title'),
        modalClearStars: document.getElementById('modal-clear-stars'),
        modalClearAccuracy: document.getElementById('modal-clear-accuracy'),
        modalClearSpeed: document.getElementById('modal-clear-speed'),
        btnModalRetry: document.getElementById('btn-modal-retry'),
        btnModalNext: document.getElementById('btn-modal-next'),

        modalExamResult: document.getElementById('modal-exam-result'),
        certRank: document.getElementById('cert-rank'),
        certAccuracy: document.getElementById('cert-accuracy'),
        certScore: document.getElementById('cert-score'),
        certSerial: document.getElementById('cert-serial'),
        certDate: document.getElementById('cert-date'),
        btnCertClose: document.getElementById('btn-cert-close'),
        btnCertAgain: document.getElementById('btn-cert-again'),

        modalChart: document.getElementById('modal-chart'),
        btnCloseChart: document.getElementById('btn-close-chart'),
        interactiveMultTable: document.getElementById('interactive-mult-table'),

        modalMistakes: document.getElementById('modal-mistakes'),
        btnCloseMistakes: document.getElementById('btn-close-mistakes'),
        mistakesListContainer: document.getElementById('mistakes-list-container'),
        btnClearMistakes: document.getElementById('btn-clear-mistakes'),
        btnDrillMistakes: document.getElementById('btn-drill-mistakes')
    };

    // ==========================================
    // 1. 初始化與介面刷新
    // ==========================================
    function initApp() {
        renderStages();
        renderStats();
        renderMultTable();
        updateMistakesBadge();
        setupEventListeners();

        // 恢復主題
        const savedTheme = localStorage.getItem('math9x9_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // 刷新頂部個人數據展示
    function renderStats() {
        const p = engine.profile;
        const highestTier = TIERS_CONFIG.find(t => t.id === p.unlockedTier) || TIERS_CONFIG[0];
        DOM.headerUserTier.textContent = highestTier.tier;
        DOM.statCurrentTier.textContent = `Lv.${p.unlockedTier}`;

        // 計算獲得星數
        let totalStars = 0;
        Object.values(p.tierStars).forEach(s => totalStars += s);
        DOM.statTotalStars.textContent = `${totalStars} ★`;
        DOM.statTotalCorrect.textContent = p.totalCorrect.toLocaleString();
        DOM.statMaxCombo.textContent = `${p.maxCombo} Combo`;
        updateMistakesBadge();
    }

    // 更新錯題紅點徽章
    function updateMistakesBadge() {
        const count = Object.keys(engine.profile.mistakes).length;
        if (count > 0) {
            DOM.mistakeCountBadge.style.display = 'flex';
            DOM.mistakeCountBadge.textContent = count > 99 ? '99+' : count;
        } else {
            DOM.mistakeCountBadge.style.display = 'none';
        }
    }

    // 生成 9 大關卡卡片
    function renderStages() {
        DOM.adventureStagesGrid.innerHTML = '';
        const unlockedTier = engine.profile.unlockedTier;

        TIERS_CONFIG.forEach(cfg => {
            const isUnlocked = cfg.id <= unlockedTier;
            const isCurrent = cfg.id === unlockedTier;
            const stars = engine.profile.tierStars[cfg.id] || 0;

            const card = document.createElement('div');
            card.className = `stage-card ${isUnlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''}`;
            card.dataset.tierId = cfg.id;

            // 星星 HTML
            let starsHtml = '';
            for (let i = 1; i <= 3; i++) {
                starsHtml += `<span class="${i <= stars ? 'filled' : ''}">★</span>`;
            }

            card.innerHTML = `
                <div>
                    <div class="stage-header">
                        <span class="stage-badge">${cfg.badge}</span>
                        <div class="stage-stars">${starsHtml}</div>
                    </div>
                    <div class="stage-tier">${cfg.tier}</div>
                    <h3 class="stage-title">${cfg.title}</h3>
                    <p class="stage-desc">${cfg.desc}</p>
                </div>
                <div class="stage-footer">
                    <span>${cfg.count} 題 / 限時 ${cfg.timePerQuestion}s</span>
                    <span>${isUnlocked ? (stars > 0 ? '✓ 已通關' : '⚡ 挑戰中') : '🔒 未解鎖'}</span>
                </div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    startTierAdventure(cfg.id);
                });
            }

            DOM.adventureStagesGrid.appendChild(card);
        });
    }

    // 生成 9x9 對照表
    function renderMultTable() {
        let html = '<thead><tr><th>×</th>';
        for (let col = 1; col <= 9; col++) {
            html += `<th>${col}</th>`;
        }
        html += '</tr></thead><tbody>';

        for (let row = 1; row <= 9; row++) {
            html += `<tr><th>${row}</th>`;
            for (let col = 1; col <= 9; col++) {
                html += `<td data-r="${row}" data-c="${col}">${row * col}</td>`;
            }
            html += '</tr>';
        }
        html += '</tbody>';
        DOM.interactiveMultTable.innerHTML = html;

        // 綁定點擊朗讀
        DOM.interactiveMultTable.querySelectorAll('td').forEach(cell => {
            cell.addEventListener('click', () => {
                const r = parseInt(cell.dataset.r, 10);
                const c = parseInt(cell.dataset.c, 10);
                sound.speakQuestion(r, c, false);
                sound.playCorrect(1);
            });
        });
    }

    // ==========================================
    // 2. 視圖與頁籤切換
    // ==========================================
    function switchTab(tabKey) {
        state.activeTab = tabKey;
        DOM.modeTabs.forEach(tab => {
            const isActive = tab.dataset.mode === tabKey;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        DOM.viewAdventure.style.display = tabKey === 'adventure' ? 'block' : 'none';
        DOM.viewExam.style.display = tabKey === 'exam' ? 'block' : 'none';
        DOM.viewPractice.style.display = tabKey === 'practice' ? 'block' : 'none';
        DOM.viewArena.style.display = 'none';

        if (state.inGame) {
            endRound(false);
        }
    }

    function showArena() {
        DOM.viewAdventure.style.display = 'none';
        DOM.viewExam.style.display = 'none';
        DOM.viewPractice.style.display = 'none';
        DOM.viewArena.style.display = 'block';
    }

    // ==========================================
    // 3. 遊戲模式啟動
    // ==========================================

    // 啟動關卡闖關
    function startTierAdventure(tierId) {
        const cfg = engine.getTierConfig(tierId);
        state.gameMode = 'tier';
        state.activeTierId = tierId;
        state.totalQuestionsInRound = cfg.count;
        state.currentQuestionIndex = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.combo = 0;
        state.maxComboInRound = 0;
        state.roundStartTime = Date.now();
        state.inGame = true;

        DOM.arenaModeBadge.textContent = cfg.tier;
        showArena();
        loadNextQuestion();
    }

    // 啟動檢定考試
    function startExam() {
        const typeBtn = document.querySelector('.exam-type-btn.active');
        const examType = typeBtn ? typeBtn.dataset.type : 'time';

        state.currentQuestionIndex = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.combo = 0;
        state.maxComboInRound = 0;
        state.roundStartTime = Date.now();
        state.inGame = true;

        if (examType === 'time') {
            const activeTimeBtn = document.querySelector('.exam-opt-btn.active');
            const totalSec = activeTimeBtn ? parseInt(activeTimeBtn.dataset.val, 10) : 60;
            state.gameMode = 'exam_time';
            state.totalTimeRemaining = totalSec;
            state.totalTimeAllocated = totalSec;
            state.totalQuestionsInRound = 999; // 限時模式直到時間結束
            DOM.arenaModeBadge.textContent = `隨機檢定 (${totalSec}s)`;
            startGlobalCountdown();
        } else {
            const activeCountBtn = document.querySelector('.exam-count-btn.active');
            const totalCount = activeCountBtn ? parseInt(activeCountBtn.dataset.val, 10) : 20;
            state.gameMode = 'exam_count';
            state.totalQuestionsInRound = totalCount;
            state.totalTimeRemaining = 0;
            DOM.arenaModeBadge.textContent = `隨機檢定 (${totalCount}題)`;
        }

        showArena();
        loadNextQuestion();
    }

    // 啟動自由練習
    function startPractice() {
        state.gameMode = 'practice';
        state.currentQuestionIndex = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.combo = 0;
        state.maxComboInRound = 0;
        state.practiceSeqIndex = 0;
        state.roundStartTime = Date.now();
        state.inGame = true;
        state.totalQuestionsInRound = 999; // 自由練習無上限
        DOM.arenaModeBadge.textContent = '自由練習';

        showArena();
        loadNextQuestion();
    }

    // 啟動錯題攻堅特訓
    function startMistakesDrill() {
        const list = engine.getMistakesList();
        if (list.length === 0) {
            alert('目前沒有錯題記錄，太棒了！');
            return;
        }

        closeModal(DOM.modalMistakes);
        state.gameMode = 'mistakes';
        state.mistakesQueue = [...list];
        state.totalQuestionsInRound = list.length;
        state.currentQuestionIndex = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.combo = 0;
        state.maxComboInRound = 0;
        state.roundStartTime = Date.now();
        state.inGame = true;

        DOM.arenaModeBadge.textContent = '🔥 錯題特訓';
        showArena();
        loadNextQuestion();
    }

    // ==========================================
    // 4. 戰場出題與流程控制
    // ==========================================
    function loadNextQuestion() {
        if (!state.inGame) return;

        // 清空輸入
        clearInput();

        // 檢查是否已達目標題數 (針對闖關或定量考試)
        if (state.gameMode === 'tier' || state.gameMode === 'exam_count' || state.gameMode === 'mistakes') {
            if (state.currentQuestionIndex >= state.totalQuestionsInRound) {
                finishRound();
                return;
            }
        }

        state.currentQuestionIndex++;
        updateProgressBar();

        // 依模式取得題目
        let q;
        if (state.gameMode === 'tier') {
            const cfg = engine.getTierConfig(state.activeTierId);
            q = engine.generateQuestion({
                factors: cfg.factors,
                reverseRate: cfg.reverseRate
            });
            startPerQuestionTimer(cfg.timePerQuestion);
        } else if (state.gameMode === 'exam_time' || state.gameMode === 'exam_count') {
            q = engine.generateQuestion({
                factors: [2, 3, 4, 5, 6, 7, 8, 9],
                reverseRate: 0.15
            });
        } else if (state.gameMode === 'mistakes') {
            const item = state.mistakesQueue[(state.currentQuestionIndex - 1) % state.mistakesQueue.length];
            q = engine.generateQuestion({
                factors: [item.factorA],
                mode: 'sequence',
                seqIndex: item.factorB - 1
            });
        } else {
            // practice 自由練習
            q = engine.generateQuestion({
                factors: state.practiceFactors,
                mode: state.practiceOrder,
                reverseRate: state.practiceType === 'reverse' ? 1 : (state.practiceType === 'mix' ? 0.5 : 0),
                seqIndex: state.practiceSeqIndex++
            });
        }

        // 渲染題目
        DOM.arenaQuestionText.textContent = q.questionText;

        // 播放語音朗讀
        sound.speakQuestion(q.factorA, q.factorB, q.isReverse, q.isFillA);
    }

    // 更新進度與資訊列
    function updateProgressBar() {
        if (state.totalQuestionsInRound === 999) {
            DOM.arenaProgressText.textContent = `第 ${state.currentQuestionIndex} 題`;
        } else {
            DOM.arenaProgressText.textContent = `第 ${state.currentQuestionIndex} / ${state.totalQuestionsInRound} 題`;
        }

        // Combo 儀表板
        if (state.combo >= 2) {
            DOM.arenaComboDisplay.style.visibility = 'visible';
            DOM.arenaComboDisplay.textContent = `🔥 ${state.combo} COMBO!`;
        } else {
            DOM.arenaComboDisplay.style.visibility = 'hidden';
        }
    }

    // 單題計時器 (用於闖關疾風關卡)
    function startPerQuestionTimer(durationSec) {
        clearInterval(state.timerId);
        state.questionTimeAllocated = durationSec;
        state.questionTimeRemaining = durationSec;
        DOM.arenaTimeText.textContent = `${durationSec.toFixed(1)}s`;
        DOM.arenaTimeBar.style.width = '100%';

        const stepMs = 100;
        state.timerId = setInterval(() => {
            state.questionTimeRemaining -= stepMs / 1000;
            const pct = Math.max(0, (state.questionTimeRemaining / state.questionTimeAllocated) * 100);
            DOM.arenaTimeBar.style.width = `${pct}%`;
            DOM.arenaTimeText.textContent = `${Math.max(0, state.questionTimeRemaining).toFixed(1)}s`;

            if (state.questionTimeRemaining <= 0) {
                clearInterval(state.timerId);
                // 超時視同答錯
                handleAnswerSubmit(true);
            }
        }, stepMs);
    }

    // 全域總計時器 (用於檢定考 60s/120s/180s)
    function startGlobalCountdown() {
        clearInterval(state.timerId);
        DOM.arenaTimeText.textContent = `${state.totalTimeRemaining}s`;
        DOM.arenaTimeBar.style.width = '100%';

        state.timerId = setInterval(() => {
            state.totalTimeRemaining--;
            const pct = Math.max(0, (state.totalTimeRemaining / state.totalTimeAllocated) * 100);
            DOM.arenaTimeBar.style.width = `${pct}%`;
            DOM.arenaTimeText.textContent = `${state.totalTimeRemaining}s`;

            if (state.totalTimeRemaining <= 3 && state.totalTimeRemaining > 0) {
                sound.playBeep(false);
            }

            if (state.totalTimeRemaining <= 0) {
                clearInterval(state.timerId);
                sound.playBeep(true);
                finishRound();
            }
        }, 1000);
    }

    // ==========================================
    // 5. 輸入與作答驗證
    // ==========================================
    function handleKeyInput(key) {
        if (!state.inGame) return;

        sound.playClick();
        sound.vibrate(12);

        if (key === 'clear') {
            clearInput();
            return;
        }
        if (key === 'backspace') {
            state.inputBuffer = state.inputBuffer.slice(0, -1);
            DOM.arenaAnswerVal.textContent = state.inputBuffer;
            return;
        }

        // 數字輸入 (最多支援 3 位數，乘法 9x9 最大為 81)
        if (state.inputBuffer.length < 3) {
            state.inputBuffer += key;
            DOM.arenaAnswerVal.textContent = state.inputBuffer;

            // 智能自動快速核對：若長度已達到目標答案長度且數值正確，直接秒送出
            if (engine.currentQuestion) {
                const targetStr = String(engine.currentQuestion.targetAnswer);
                if (state.inputBuffer === targetStr) {
                    setTimeout(() => {
                        handleAnswerSubmit(false);
                    }, 40);
                }
            }
        }
    }

    function clearInput() {
        state.inputBuffer = '';
        DOM.arenaAnswerVal.textContent = '';
        DOM.arenaAnswerBox.className = 'answer-display-box';
    }

    // 提交答案處理
    function handleAnswerSubmit(isTimeout = false) {
        if (!state.inGame || !engine.currentQuestion) return;

        clearInterval(state.timerId);

        const result = engine.checkAnswer(isTimeout ? -999 : state.inputBuffer);

        if (result.isCorrect) {
            // 答對
            state.correctCount++;
            state.combo++;
            if (state.combo > state.maxComboInRound) {
                state.maxComboInRound = state.combo;
            }
            if (state.combo > engine.profile.maxCombo) {
                engine.profile.maxCombo = state.combo;
                engine.saveProfile();
            }

            sound.playCorrect(state.combo);
            DOM.arenaAnswerBox.className = 'answer-display-box correct';

            setTimeout(() => {
                loadNextQuestion();
            }, 180);
        } else {
            // 答錯
            state.wrongCount++;
            state.combo = 0;
            sound.playWrong();
            DOM.arenaAnswerBox.className = 'answer-display-box wrong';

            // 顯示正確答案提示短暫閃爍
            DOM.arenaAnswerVal.textContent = isTimeout ? `時間到! Ans:${result.targetAnswer}` : `Ans: ${result.targetAnswer}`;

            setTimeout(() => {
                loadNextQuestion();
            }, 750);
        }

        renderStats();
    }

    // ==========================================
    // 6. 結算與證書頒發
    // ==========================================
    function finishRound() {
        state.inGame = false;
        clearInterval(state.timerId);

        const totalAttempted = state.correctCount + state.wrongCount;
        const accuracy = totalAttempted > 0 ? (state.correctCount / totalAttempted) : 0;
        const totalDurationSec = Math.max(1, (Date.now() - state.roundStartTime) / 1000);
        const avgSpeed = (totalDurationSec / Math.max(1, totalAttempted)).toFixed(1);

        sound.playFanfare();

        if (state.gameMode === 'tier') {
            // 闖關模式結算
            const cfg = engine.getTierConfig(state.activeTierId);
            let stars = 0;
            if (accuracy >= cfg.passRate) {
                stars = 1;
                if (accuracy >= 0.92) stars = 2;
                if (accuracy === 1.0) stars = 3;
            }

            engine.recordTierResult(state.activeTierId, stars, accuracy, avgSpeed);

            // 渲染彈窗
            DOM.modalClearIcon.textContent = stars > 0 ? '🏆' : '💪';
            DOM.modalClearTitle.textContent = stars > 0 ? `${cfg.tier} 挑戰成功！` : `${cfg.tier} 再接再厲！`;

            let starsHtml = '';
            for (let i = 1; i <= 3; i++) {
                starsHtml += `<span class="${i <= stars ? 'filled' : ''}">★</span>`;
            }
            DOM.modalClearStars.innerHTML = starsHtml;
            DOM.modalClearAccuracy.textContent = `${Math.round(accuracy * 100)}%`;
            DOM.modalClearSpeed.textContent = `${avgSpeed}s/題`;

            // 按鈕控制
            DOM.btnModalNext.style.display = (stars > 0 && state.activeTierId < TIERS_CONFIG.length) ? 'inline-flex' : 'none';

            openModal(DOM.modalStageClear);
        } else if (state.gameMode === 'exam_time' || state.gameMode === 'exam_count') {
            // 檢定考結算 -> 頒發證書
            let rank = '初級達人';
            if (state.correctCount >= 50 || accuracy >= 0.95) rank = '九段宗師';
            else if (state.correctCount >= 30 || accuracy >= 0.9) rank = '高階專家';
            else if (state.correctCount >= 15 || accuracy >= 0.8) rank = '進階好手';

            const cert = engine.generateCertificate({
                title: '九九乘法能力合格證書',
                rank,
                score: state.correctCount,
                accuracy: `${Math.round(accuracy * 100)}%`,
                speed: `${avgSpeed}s/題`,
                totalQuestions: totalAttempted,
                timeSpent: `${Math.round(totalDurationSec)}秒`
            });

            DOM.certRank.textContent = rank;
            DOM.certAccuracy.textContent = `${Math.round(accuracy * 100)}%`;
            DOM.certScore.textContent = `${state.correctCount} 題`;
            DOM.certSerial.textContent = cert.id;
            DOM.certDate.textContent = cert.date;

            openModal(DOM.modalExamResult);
        } else {
            // 自由練習或錯題特訓
            alert(`🎉 特訓結束！\n總共練習: ${totalAttempted} 題\n答對題數: ${state.correctCount} 題\n正確率: ${Math.round(accuracy * 100)}%`);
            switchTab(state.activeTab);
        }

        renderStages();
        renderStats();
    }

    function endRound(confirmPrompt = true) {
        state.inGame = false;
        clearInterval(state.timerId);
        switchTab(state.activeTab);
    }

    // ==========================================
    // 7. 錯題簿渲染
    // ==========================================
    function renderMistakesList() {
        const list = engine.getMistakesList();
        DOM.mistakesListContainer.innerHTML = '';

        if (list.length === 0) {
            DOM.mistakesListContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 24px 0;">
                    🎉 太厲害了！目前沒有任何錯題記錄！
                </div>
            `;
            DOM.btnDrillMistakes.disabled = true;
            return;
        }

        DOM.btnDrillMistakes.disabled = false;
        list.forEach(item => {
            const row = document.createElement('div');
            row.className = 'mistake-item';
            row.innerHTML = `
                <div>
                    <div style="font-size: 1.1rem; font-weight: 800;">${item.qText}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">最後誤答: ${item.lastWrongAnswer || '未作答'}</div>
                </div>
                <span class="mistake-badge">累計失誤 ${item.count} 次</span>
            `;
            DOM.mistakesListContainer.appendChild(row);
        });
    }

    // ==========================================
    // 8. 彈窗管理
    // ==========================================
    function openModal(modalEl) {
        modalEl.classList.add('open');
    }
    function closeModal(modalEl) {
        modalEl.classList.remove('open');
    }

    // ==========================================
    // 9. 事件監聽綁定
    // ==========================================
    function setupEventListeners() {
        // 返回主頁
        DOM.btnBrandHome.addEventListener('click', () => {
            if (state.inGame) {
                endRound(true);
            } else {
                switchTab('adventure');
            }
        });

        // 頁籤點擊
        DOM.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.mode);
            });
        });

        // 音效切換
        DOM.btnToggleSound.addEventListener('click', () => {
            sound.soundEnabled = !sound.soundEnabled;
            DOM.btnToggleSound.textContent = sound.soundEnabled ? '🔊' : '🔇';
            DOM.btnToggleSound.classList.toggle('active', sound.soundEnabled);
        });

        // 語音朗讀口訣切換
        DOM.btnToggleVoice.addEventListener('click', () => {
            sound.voiceEnabled = !sound.voiceEnabled;
            DOM.btnToggleVoice.classList.toggle('active', sound.voiceEnabled);
            if (sound.voiceEnabled) {
                sound.speakQuestion(5, 5, false);
            }
        });

        // 乘法對照表彈窗
        DOM.btnOpenChart.addEventListener('click', () => openModal(DOM.modalChart));
        DOM.btnCloseChart.addEventListener('click', () => closeModal(DOM.modalChart));
        const bottomChartClose = document.getElementById('btn-chart-bottom-close');
        if (bottomChartClose) {
            bottomChartClose.addEventListener('click', () => closeModal(DOM.modalChart));
        }

        // 錯題本彈窗
        DOM.btnOpenMistakes.addEventListener('click', () => {
            renderMistakesList();
            openModal(DOM.modalMistakes);
        });
        DOM.btnCloseMistakes.addEventListener('click', () => closeModal(DOM.modalMistakes));
        DOM.btnClearMistakes.addEventListener('click', () => {
            if (confirm('確定要清空所有錯題記錄嗎？')) {
                engine.clearMistakes();
                renderMistakesList();
                updateMistakesBadge();
            }
        });
        DOM.btnDrillMistakes.addEventListener('click', startMistakesDrill);

        // 主題切換
        DOM.btnToggleTheme.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('math9x9_theme', next);
        });

        // 虛擬九宮格按鍵點擊
        DOM.arenaNumpad.addEventListener('click', (e) => {
            const btn = e.target.closest('.num-key');
            if (btn) {
                handleKeyInput(btn.dataset.key);
            }
        });

        // 實體鍵盤事件監聽
        window.addEventListener('keydown', (e) => {
            if (!state.inGame) return;

            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleKeyInput(e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleKeyInput('backspace');
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAnswerSubmit(false);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                endRound(true);
            }
        });

        // 作答送出按鈕
        DOM.btnSubmitAnswer.addEventListener('click', () => handleAnswerSubmit(false));
        DOM.btnQuitArena.addEventListener('click', () => endRound(true));

        // 檢定考設定按鈕
        DOM.examTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.examTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const isTime = btn.dataset.type === 'time';
                DOM.examTimeOptions.style.display = isTime ? 'block' : 'none';
                DOM.examCountOptions.style.display = isTime ? 'none' : 'block';
            });
        });
        DOM.examOptBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.examOptBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        DOM.examCountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.examCountBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        DOM.btnStartExam.addEventListener('click', startExam);

        // 自由練習段數選擇
        DOM.practiceFactorsSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.factor-btn');
            if (!btn) return;

            const factor = btn.dataset.factor;
            if (factor === 'all') {
                DOM.practiceFactorsSelector.querySelectorAll('.factor-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.practiceFactors = [2, 3, 4, 5, 6, 7, 8, 9];
            } else {
                DOM.practiceFactorsSelector.querySelector('[data-factor="all"]').classList.remove('active');
                btn.classList.toggle('active');
                const activeBtns = Array.from(DOM.practiceFactorsSelector.querySelectorAll('.factor-btn.active'));
                if (activeBtns.length === 0) {
                    btn.classList.add('active');
                }
                state.practiceFactors = Array.from(DOM.practiceFactorsSelector.querySelectorAll('.factor-btn.active'))
                    .map(b => parseInt(b.dataset.factor, 10))
                    .filter(n => !isNaN(n));
            }
        });
        DOM.practiceOrderSelect.addEventListener('change', (e) => {
            state.practiceOrder = e.target.value;
        });
        DOM.practiceTypeSelect.addEventListener('change', (e) => {
            state.practiceType = e.target.value;
        });
        DOM.btnStartPractice.addEventListener('click', startPractice);

        // 闖關彈窗按鈕
        DOM.btnModalRetry.addEventListener('click', () => {
            closeModal(DOM.modalStageClear);
            startTierAdventure(state.activeTierId);
        });
        DOM.btnModalNext.addEventListener('click', () => {
            closeModal(DOM.modalStageClear);
            if (state.activeTierId < TIERS_CONFIG.length) {
                startTierAdventure(state.activeTierId + 1);
            }
        });

        // 證書彈窗按鈕
        DOM.btnCertClose.addEventListener('click', () => {
            closeModal(DOM.modalExamResult);
            switchTab('exam');
        });
        DOM.btnCertAgain.addEventListener('click', () => {
            closeModal(DOM.modalExamResult);
            startExam();
        });

        // 點擊彈窗遮罩關閉
        [DOM.modalChart, DOM.modalMistakes].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
    }

    // 啟動應用
    initApp();
});
