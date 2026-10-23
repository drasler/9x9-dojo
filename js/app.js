/**
 * 9x9 乘法大師 - 主應用控制器 (Main Application Controller)
 * 國小四年級以上特化版本：
 * 1. 全階 2~9 出題。
 * 2. 9階百題 100% 正確率考核。
 * 3. 讀寫與聽寫分開分階支援。
 * 4. 錯題 3 天限時與降階機制整合。
 */

document.addEventListener('DOMContentLoaded', () => {
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
        totalTimeRemaining: 0,
        totalTimeAllocated: 0,
        questionTimeRemaining: 0,
        questionTimeAllocated: 0,
        roundStartTime: 0,

        // 自由練習配置
        practiceFactors: [2, 3, 4, 5, 6, 7, 8, 9],
        practiceOrder: 'random',
        practiceType: 'normal',
        practiceSensory: 'reading',
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
        overdueBannerContainer: document.getElementById('overdue-banner-container'),

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
        practiceSensorySelect: document.getElementById('practice-sensory-select'),
        btnStartPractice: document.getElementById('btn-start-practice'),

        // 作答戰場 Arena
        arenaModeBadge: document.getElementById('arena-mode-badge'),
        arenaSensoryBadge: document.getElementById('arena-sensory-badge'),
        arenaProgressText: document.getElementById('arena-progress-text'),
        arenaComboDisplay: document.getElementById('arena-combo-display'),
        arenaTimeText: document.getElementById('arena-time-text'),
        arenaTimeBar: document.getElementById('arena-time-bar'),
        arenaQuestionText: document.getElementById('arena-question-text'),
        arenaDictationControls: document.getElementById('arena-dictation-controls'),
        btnReplaySpeech: document.getElementById('btn-replay-speech'),
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
        tabChartMatrix: document.getElementById('tab-chart-matrix'),
        tabChartCards: document.getElementById('tab-chart-cards'),
        chartViewMatrix: document.getElementById('chart-view-matrix'),
        chartViewCards: document.getElementById('chart-view-cards'),
        chartChipsContainer: document.getElementById('chart-chips-container'),
        chartCardsList: document.getElementById('chart-cards-list'),
        interactiveMultTable: document.getElementById('interactive-mult-table'),

        modalMistakes: document.getElementById('modal-mistakes'),
        btnCloseMistakes: document.getElementById('btn-close-mistakes'),
        mistakesDeadlineSummary: document.getElementById('mistakes-deadline-summary'),
        mistakesListContainer: document.getElementById('mistakes-list-container'),
        btnClearMistakes: document.getElementById('btn-clear-mistakes'),
        btnDrillMistakes: document.getElementById('btn-drill-mistakes')
    };

    // ==========================================
    // 1. 初始化與介面刷新
    // ==========================================
    function initApp() {
        checkOverdueAndDemotion();
        renderStages();
        renderStats();
        renderMultTable();
        updateMistakesBadge();
        setupEventListeners();

        // 恢復主題
        const savedTheme = localStorage.getItem('math9x9_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // 檢測 3 天未復習與降階懲罰
    function checkOverdueAndDemotion() {
        const result = engine.checkMistakesOverdue();
        DOM.overdueBannerContainer.innerHTML = '';

        if (result.demoted) {
            DOM.overdueBannerContainer.innerHTML = `
                <div class="overdue-alert-banner">
                    <div>
                        <strong>⚠️ 降階懲罰警告：</strong>您有 ${result.overdueCount} 道錯題超過 3 天 (72小時) 未復習！<br>
                        系統已依規定扣除 1 個階級（目前退回至 Lv.${result.currentTier}）。請立即進行錯題特訓清空！
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" id="btn-banner-drill" style="white-space:nowrap; margin-left:12px;">立即特訓</button>
                </div>
            `;
            const btnDrill = document.getElementById('btn-banner-drill');
            if (btnDrill) {
                btnDrill.addEventListener('click', startMistakesDrill);
            }
        } else {
            const urgentStatus = engine.getMostUrgentMistakeStatus();
            if (urgentStatus && urgentStatus.isUrgent) {
                DOM.overdueBannerContainer.innerHTML = `
                    <div class="overdue-alert-banner" style="background: rgba(245, 158, 11, 0.15); border-color: var(--accent-amber);">
                        <div>
                            ⏳ <strong>錯題復習時效提醒：</strong>您有即將到期的錯題（${urgentStatus.text}）！超過 3 天未清空將被扣除 1 個階級！
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-banner-drill" style="white-space:nowrap; margin-left:12px;">立即消滅</button>
                    </div>
                `;
                const btnDrill = document.getElementById('btn-banner-drill');
                if (btnDrill) {
                    btnDrill.addEventListener('click', startMistakesDrill);
                }
            }
        }
    }

    // 刷新頂部個人數據展示
    function renderStats() {
        const p = engine.profile;
        const highestTier = TIERS_CONFIG.find(t => t.id === p.unlockedTier) || TIERS_CONFIG[0];
        DOM.headerUserTier.textContent = highestTier.tier;
        DOM.statCurrentTier.textContent = `Lv.${p.unlockedTier}`;

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

            const urgent = engine.getMostUrgentMistakeStatus();
            if (urgent && (urgent.isOverdue || urgent.isUrgent)) {
                DOM.btnOpenMistakes.style.borderColor = 'var(--accent-rose)';
                DOM.btnOpenMistakes.style.animation = 'shake 2.5s infinite';
            } else {
                DOM.btnOpenMistakes.style.borderColor = 'var(--border-card)';
                DOM.btnOpenMistakes.style.animation = 'none';
            }
        } else {
            DOM.mistakeCountBadge.style.display = 'none';
            DOM.btnOpenMistakes.style.borderColor = 'var(--border-card)';
            DOM.btnOpenMistakes.style.animation = 'none';
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

            let starsHtml = '';
            for (let i = 1; i <= 3; i++) {
                starsHtml += `<span class="${i <= stars ? 'filled' : ''}">★</span>`;
            }

            // 感官標籤文字
            let sensoryLabel = '📖 讀寫';
            let sensoryClass = 'reading';
            if (cfg.sensoryMode === 'dictation') {
                sensoryLabel = '🎧 聽寫盲測';
                sensoryClass = 'dictation';
            } else if (cfg.sensoryMode === 'mix') {
                sensoryLabel = '🔀 雙模混合';
                sensoryClass = 'mix';
            }

            // 嚴苛標準文字
            let targetText = `${cfg.count} 題 / 正確率 ≥ ${Math.round(cfg.passRate * 100)}%`;
            if (cfg.id === 9) {
                targetText = `🔥 100 題 / 正確率 100% (零容錯)`;
            }

            card.innerHTML = `
                <div>
                    <div class="stage-header">
                        <span class="stage-badge">${cfg.badge}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="sensory-tag ${sensoryClass}">${sensoryLabel}</span>
                            <div class="stage-stars">${starsHtml}</div>
                        </div>
                    </div>
                    <div class="stage-tier">${cfg.tier}</div>
                    <h3 class="stage-title">${cfg.title}</h3>
                    <p class="stage-desc">${cfg.desc}</p>
                </div>
                <div class="stage-footer">
                    <span>${targetText} (限時 ${cfg.timePerQuestion}s/題)</span>
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

    // 生成 9x9 對照表 (全矩陣 + 行動端單段大字卡)
    function renderMultTable() {
        // 1. 生成 100% 適配的 9x9 矩陣
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

        DOM.interactiveMultTable.querySelectorAll('td').forEach(cell => {
            cell.addEventListener('click', () => {
                const r = parseInt(cell.dataset.r, 10);
                const c = parseInt(cell.dataset.c, 10);
                sound.speakQuestion(r, c, false);
                sound.playCorrect(1);
            });
        });

        // 2. 生成行動端單數口訣大卡片 (2~9)
        let selectedFactor = 2;
        function renderCards(factor) {
            selectedFactor = factor;
            // 更新 chips
            if (DOM.chartChipsContainer) {
                DOM.chartChipsContainer.innerHTML = '';
                for (let f = 2; f <= 9; f++) {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = `chart-chip ${f === factor ? 'active' : ''}`;
                    chip.textContent = f;
                    chip.addEventListener('click', () => renderCards(f));
                    DOM.chartChipsContainer.appendChild(chip);
                }
            }

            // 更新 9 道卡片
            if (DOM.chartCardsList) {
                DOM.chartCardsList.innerHTML = '';
                for (let m = 1; m <= 9; m++) {
                    const row = document.createElement('div');
                    row.className = 'chart-card-row';
                    row.innerHTML = `
                        <span style="font-size:1.15rem; font-weight:800;">${factor} × ${m} = <strong style="color:var(--primary-light); font-size:1.25rem;">${factor * m}</strong></span>
                        <span style="font-size:0.85rem; color:var(--accent-cyan); display:flex; align-items:center; gap:4px;">
                            🔊 唸口訣
                        </span>
                    `;
                    row.addEventListener('click', () => {
                        sound.speakQuestion(factor, m, false);
                        sound.playCorrect(1);
                    });
                    DOM.chartCardsList.appendChild(row);
                }
            }
        }
        renderCards(2);

        // 3. 綁定查閱切換按鈕
        if (DOM.tabChartMatrix && DOM.tabChartCards) {
            DOM.tabChartMatrix.addEventListener('click', () => {
                DOM.tabChartMatrix.classList.add('active');
                DOM.tabChartCards.classList.remove('active');
                DOM.chartViewMatrix.style.display = 'block';
                DOM.chartViewCards.style.display = 'none';
            });
            DOM.tabChartCards.addEventListener('click', () => {
                DOM.tabChartCards.classList.add('active');
                DOM.tabChartMatrix.classList.remove('active');
                DOM.chartViewMatrix.style.display = 'none';
                DOM.chartViewCards.style.display = 'block';
            });
        }
    }

    // ==========================================
    // 2. 視圖切換
    // ==========================================
    function switchTab(tabKey) {
        document.body.classList.remove('in-arena');
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
        checkOverdueAndDemotion();
    }

    function showArena() {
        document.body.classList.add('in-arena');
        DOM.viewAdventure.style.display = 'none';
        DOM.viewExam.style.display = 'none';
        DOM.viewPractice.style.display = 'none';
        DOM.viewArena.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // ==========================================
    // 3. 遊戲模式啟動
    // ==========================================
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
            state.totalQuestionsInRound = 999;
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
        state.totalQuestionsInRound = 999;
        DOM.arenaModeBadge.textContent = '自由練習';

        showArena();
        loadNextQuestion();
    }

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

        DOM.arenaModeBadge.textContent = '🔥 錯題限時特訓';
        showArena();
        loadNextQuestion();
    }

    // ==========================================
    // 4. 戰場出題與流程控制
    // ==========================================
    function loadNextQuestion() {
        if (!state.inGame) return;

        clearInput();

        if (state.gameMode === 'tier' || state.gameMode === 'exam_count' || state.gameMode === 'mistakes') {
            if (state.currentQuestionIndex >= state.totalQuestionsInRound) {
                finishRound();
                return;
            }
        }

        state.currentQuestionIndex++;
        updateProgressBar();

        let q;
        if (state.gameMode === 'tier') {
            const cfg = engine.getTierConfig(state.activeTierId);
            q = engine.generateQuestion({
                factors: cfg.factors,
                sensoryMode: cfg.sensoryMode,
                reverseRate: cfg.reverseRate,
                hardWeight: cfg.hardWeight
            });
            startPerQuestionTimer(cfg.timePerQuestion);
        } else if (state.gameMode === 'exam_time' || state.gameMode === 'exam_count') {
            q = engine.generateQuestion({
                factors: [2, 3, 4, 5, 6, 7, 8, 9],
                sensoryMode: 'mix', // 檢定考採讀寫+聽寫混測
                reverseRate: 0.25,
                hardWeight: 0.35
            });
        } else if (state.gameMode === 'mistakes') {
            const item = state.mistakesQueue[(state.currentQuestionIndex - 1) % state.mistakesQueue.length];
            q = engine.generateQuestion({
                factors: [item.factorA],
                sensoryMode: 'reading',
                mode: 'sequence',
                seqIndex: item.factorB - 1
            });
        } else {
            // practice 自由練習
            q = engine.generateQuestion({
                factors: state.practiceFactors,
                sensoryMode: state.practiceSensory,
                mode: state.practiceOrder,
                reverseRate: state.practiceType === 'reverse' ? 1 : (state.practiceType === 'mix' ? 0.5 : 0),
                seqIndex: state.practiceSeqIndex++
            });
        }

        // 判斷聽寫 vs 讀寫
        if (q.isDictation) {
            DOM.arenaSensoryBadge.textContent = '🎧 盲測';
            DOM.arenaSensoryBadge.className = 'sensory-tag dictation';
            DOM.arenaQuestionText.innerHTML = `
                <div class="dictation-container">
                    <div class="dictation-wave">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                    <div class="dictation-title">🎧 請聽口訣心算作答</div>
                </div>
            `;
            DOM.arenaDictationControls.style.display = 'block';
            sound.speakQuestion(q.factorA, q.factorB, q.isReverse, q.isFillA, true);
        } else {
            DOM.arenaSensoryBadge.textContent = '📖 讀寫';
            DOM.arenaSensoryBadge.className = 'sensory-tag reading';
            DOM.arenaQuestionText.textContent = q.questionText;
            DOM.arenaDictationControls.style.display = 'none';
            sound.speakQuestion(q.factorA, q.factorB, q.isReverse, q.isFillA, false);
        }
    }

    function updateProgressBar() {
        if (state.totalQuestionsInRound === 999) {
            DOM.arenaProgressText.textContent = `第 ${state.currentQuestionIndex} 題`;
        } else {
            DOM.arenaProgressText.textContent = `${state.currentQuestionIndex} / ${state.totalQuestionsInRound}`;
        }

        if (state.combo >= 2) {
            DOM.arenaComboDisplay.style.visibility = 'visible';
            DOM.arenaComboDisplay.textContent = `🔥 ${state.combo} COMBO!`;
        } else {
            DOM.arenaComboDisplay.style.visibility = 'hidden';
        }
    }

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
                handleAnswerSubmit(true);
            }
        }, stepMs);
    }

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

        if (state.inputBuffer.length < 3) {
            state.inputBuffer += key;
            DOM.arenaAnswerVal.textContent = state.inputBuffer;

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

    function handleAnswerSubmit(isTimeout = false) {
        if (!state.inGame || !engine.currentQuestion) return;

        clearInterval(state.timerId);

        const result = engine.checkAnswer(isTimeout ? -999 : state.inputBuffer);

        if (result.isCorrect) {
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
            state.wrongCount++;
            state.combo = 0;
            sound.playWrong();
            DOM.arenaAnswerBox.className = 'answer-display-box wrong';

            DOM.arenaAnswerVal.textContent = isTimeout ? `時間到! Ans:${result.targetAnswer}` : `Ans: ${result.targetAnswer}`;

            // 若在聽寫模式下答錯，立刻揭曉算式原文給予大腦反饋
            if (engine.currentQuestion.isDictation) {
                DOM.arenaQuestionText.innerHTML = `<span style="font-size:2.8rem; color:var(--accent-rose);">${engine.currentQuestion.questionText} = ${engine.currentQuestion.targetAnswer}</span>`;
            }

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
            const cfg = engine.getTierConfig(state.activeTierId);
            let stars = 0;

            if (state.activeTierId === 9) {
                // 第 9 階：百題零容錯！必須 100% 正確率
                if (accuracy === 1.0) {
                    stars = 3;
                }
            } else {
                if (accuracy >= cfg.passRate) {
                    stars = 1;
                    if (accuracy >= 0.95) stars = 2;
                    if (accuracy === 1.0) stars = 3;
                }
            }

            engine.recordTierResult(state.activeTierId, stars, accuracy, avgSpeed);

            DOM.modalClearIcon.textContent = stars > 0 ? '🏆' : '💪';
            DOM.modalClearTitle.textContent = stars > 0 ? `${cfg.tier} 挑戰成功！` : `${cfg.tier} 未達通關標準`;

            let starsHtml = '';
            for (let i = 1; i <= 3; i++) {
                starsHtml += `<span class="${i <= stars ? 'filled' : ''}">★</span>`;
            }
            DOM.modalClearStars.innerHTML = starsHtml;
            DOM.modalClearAccuracy.textContent = `${Math.round(accuracy * 100)}% (標準: ${Math.round(cfg.passRate * 100)}%)`;
            DOM.modalClearSpeed.textContent = `${avgSpeed}s/題`;

            DOM.btnModalNext.style.display = (stars > 0 && state.activeTierId < TIERS_CONFIG.length) ? 'inline-flex' : 'none';

            openModal(DOM.modalStageClear);
        } else if (state.gameMode === 'exam_time' || state.gameMode === 'exam_count') {
            let rank = '初階達人';
            if (state.correctCount >= 50 && accuracy >= 0.95) rank = '九段宗師';
            else if (state.correctCount >= 35 && accuracy >= 0.90) rank = '高階專家';
            else if (state.correctCount >= 20 && accuracy >= 0.85) rank = '進階好手';

            const cert = engine.generateCertificate({
                title: '九九乘法能力檢定證書',
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
            alert(`🎉 特訓結束！\n總共練習: ${totalAttempted} 題\n答對題數: ${state.correctCount} 題\n正確率: ${Math.round(accuracy * 100)}%`);
            document.body.classList.remove('in-arena');
            switchTab(state.activeTab);
        }

        renderStages();
        renderStats();
        checkOverdueAndDemotion();
    }

    function endRound(confirmPrompt = true) {
        state.inGame = false;
        clearInterval(state.timerId);
        document.body.classList.remove('in-arena');
        switchTab(state.activeTab);
    }

    // ==========================================
    // 7. 錯題簿渲染 (含 3 天期限倒數)
    // ==========================================
    function renderMistakesList() {
        const list = engine.getMistakesList();
        DOM.mistakesListContainer.innerHTML = '';

        const urgent = engine.getMostUrgentMistakeStatus();
        if (urgent) {
            DOM.mistakesDeadlineSummary.innerHTML = `
                <div style="color: ${urgent.isOverdue || urgent.isUrgent ? 'var(--accent-rose)' : 'var(--accent-amber)'};">
                    ⏳ <strong>最急迫復習時效：</strong>${urgent.text}
                </div>
            `;
        } else {
            DOM.mistakesDeadlineSummary.innerHTML = '';
        }

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
        const now = Date.now();

        list.forEach(item => {
            const row = document.createElement('div');
            row.className = 'mistake-item';

            const deadline = item.deadline || (now + 3 * 24 * 3600 * 1000);
            const diff = deadline - now;
            const diffHours = Math.floor(diff / (1000 * 3600));
            let remainText = '';
            let isUrgent = false;

            if (diff <= 0) {
                remainText = '⚠️ 已逾期！';
                isUrgent = true;
            } else if (diffHours >= 24) {
                remainText = `剩餘 ${Math.floor(diffHours / 24)}天 ${diffHours % 24}小時`;
            } else {
                remainText = `剩餘 ${diffHours}小時 (緊急)`;
                isUrgent = true;
            }

            row.innerHTML = `
                <div>
                    <div style="font-size: 1.1rem; font-weight: 800;">${item.qText}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                        失誤次數: ${item.count} 次 ｜ 最後誤答: ${item.lastWrongAnswer || '未作答'}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span class="mistake-badge">連對2次消滅</span>
                    <span class="mistake-deadline-tag ${isUrgent ? 'urgent' : ''}">${remainText}</span>
                </div>
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
        DOM.btnBrandHome.addEventListener('click', () => {
            if (state.inGame) {
                endRound(true);
            } else {
                switchTab('adventure');
            }
        });

        DOM.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.mode);
            });
        });

        DOM.btnToggleSound.addEventListener('click', () => {
            sound.soundEnabled = !sound.soundEnabled;
            DOM.btnToggleSound.textContent = sound.soundEnabled ? '🔊' : '🔇';
            DOM.btnToggleSound.classList.toggle('active', sound.soundEnabled);
        });

        DOM.btnToggleVoice.addEventListener('click', () => {
            sound.voiceEnabled = !sound.voiceEnabled;
            DOM.btnToggleVoice.classList.toggle('active', sound.voiceEnabled);
            if (sound.voiceEnabled) {
                sound.speakQuestion(5, 5, false);
            }
        });

        // 聽寫模式重聽按鈕
        DOM.btnReplaySpeech.addEventListener('click', () => {
            sound.replaySpeech();
        });

        DOM.btnOpenChart.addEventListener('click', () => openModal(DOM.modalChart));
        DOM.btnCloseChart.addEventListener('click', () => closeModal(DOM.modalChart));
        const bottomChartClose = document.getElementById('btn-chart-bottom-close');
        if (bottomChartClose) {
            bottomChartClose.addEventListener('click', () => closeModal(DOM.modalChart));
        }

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
                checkOverdueAndDemotion();
            }
        });
        DOM.btnDrillMistakes.addEventListener('click', startMistakesDrill);

        DOM.btnToggleTheme.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('math9x9_theme', next);
        });

        DOM.arenaNumpad.addEventListener('click', (e) => {
            const btn = e.target.closest('.num-key');
            if (btn) {
                handleKeyInput(btn.dataset.key);
            }
        });

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
            } else if (e.key === 'r' || e.key === 'R') {
                // 按 R 鍵快速重聽口訣
                sound.replaySpeech();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                endRound(true);
            }
        });

        DOM.btnSubmitAnswer.addEventListener('click', () => handleAnswerSubmit(false));
        DOM.btnQuitArena.addEventListener('click', () => endRound(true));

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
        if (DOM.practiceSensorySelect) {
            DOM.practiceSensorySelect.addEventListener('change', (e) => {
                state.practiceSensory = e.target.value;
            });
        }
        DOM.btnStartPractice.addEventListener('click', startPractice);

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

        DOM.btnCertClose.addEventListener('click', () => {
            closeModal(DOM.modalExamResult);
            switchTab('exam');
        });
        DOM.btnCertAgain.addEventListener('click', () => {
            closeModal(DOM.modalExamResult);
            startExam();
        });

        const btnForceRefresh = document.getElementById('btn-force-refresh');
        if (btnForceRefresh) {
            btnForceRefresh.addEventListener('click', async () => {
                btnForceRefresh.textContent = '⏳ 清理中...';
                try {
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                    }
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let reg of registrations) {
                            await reg.unregister();
                        }
                    }
                } catch (e) {
                    console.error('Cache clear error:', e);
                }
                window.location.reload(true);
            });
        }

        [DOM.modalChart, DOM.modalMistakes].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
    }

    initApp();
});
