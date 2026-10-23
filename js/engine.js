/**
 * 9x9 乘法大師 - 核心引擎與分級邏輯 (Core Engine & Leveling Progression)
 * 國小四年級以上高強度版：
 * 1. 全階 1~9 階皆採用 2~9 全段乘法。
 * 2. 難度大幅升級：9階為 100 題 / 正確率 100% (零失誤)，往下類推。
 * 3. 視覺讀寫 (Reading) 與聽力聽寫 (Dictation) 分階分離。
 * 4. 錯題復習限時 3 天 (72 小時)，逾期未清空觸發降階懲罰。
 */

// 經典高頻易錯題目列表 (國小高年級失誤率最高的乘法陷阱)
const HARD_PAIRS = [
    [7, 8], [8, 7], [6, 7], [7, 6], [8, 9], [9, 8],
    [6, 8], [8, 6], [7, 9], [9, 7], [7, 7], [8, 8],
    [6, 9], [9, 6], [4, 7], [7, 4], [4, 8], [8, 4],
    [3, 8], [8, 3], [3, 7], [7, 3], [9, 9], [6, 6]
];

// 3 天過期毫秒數 (3 days = 72 hours)
const MISTAKE_DEADLINE_MS = 3 * 24 * 60 * 60 * 1000;

// 九段階級晉升體系 (全階 2~9，專為小四以上設計的高強度梯隊)
const TIERS_CONFIG = [
    {
        id: 1,
        tier: '一階・初試鋒芒',
        title: '全表讀寫基礎 (2~9)',
        desc: '視覺讀寫題，掌握全域乘法快速反應',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 20,
        timePerQuestion: 4.5, // 每題限時 (秒)
        passRate: 0.85,       // 通關標準：至少答對 17/20 題 (85%)
        sensoryMode: 'reading', // 讀寫模式
        reverseRate: 0,
        hardWeight: 0.15,
        badge: '🌱'
    },
    {
        id: 2,
        tier: '二階・穩紮穩打',
        title: '極速讀寫進階 (2~9)',
        desc: '題數增加、作答時間縮短，強化抗壓連續作答',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 30,
        timePerQuestion: 4.0,
        passRate: 0.88,       // 至少答對 27/30 題 (88%)
        sensoryMode: 'reading',
        reverseRate: 0,
        hardWeight: 0.25,
        badge: '🌿'
    },
    {
        id: 3,
        tier: '三階・易錯加權',
        title: '魔王陷阱爆破 (2~9)',
        desc: '大幅提升 7x8, 6x7, 8x9 等國小最高頻易錯題出題比重',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 40,
        timePerQuestion: 3.6,
        passRate: 0.90,       // 至少答對 36/40 題 (90%)
        sensoryMode: 'reading',
        reverseRate: 0,
        hardWeight: 0.55,     // 55% 機率抽選高頻易錯題
        badge: '⚔️'
    },
    {
        id: 4,
        tier: '四階・逆向填空',
        title: '除法思維逆推 (2~9)',
        desc: '視覺逆向題（例如 7 × ? = 56），銜接國小高年級因數與除法心算',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 50,
        timePerQuestion: 3.3,
        passRate: 0.92,       // 至少答對 46/50 題 (92%)
        sensoryMode: 'reading',
        reverseRate: 0.50,    // 50% 機率逆向填空
        hardWeight: 0.35,
        badge: '🔮'
    },
    {
        id: 5,
        tier: '五階・聽寫啟蒙',
        title: '聽力盲測初探 (2~9)',
        desc: '視覺與聽寫交替！螢幕隱藏算式，純聽口訣「七乘八」盲測秒答',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 60,
        timePerQuestion: 3.0,
        passRate: 0.94,       // 至少答對 57/60 題 (94%)
        sensoryMode: 'mix',   // 50% 聽寫 + 50% 讀寫
        reverseRate: 0.2,
        hardWeight: 0.35,
        badge: '🎧'
    },
    {
        id: 6,
        tier: '六階・疾風聽寫',
        title: '全聽力聽寫盲測 (2~9)',
        desc: '100% 聽寫題！完全依靠耳朵聽音與大腦聽覺記憶秒按數字',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 70,
        timePerQuestion: 2.8,
        passRate: 0.96,       // 至少答對 68/70 題 (96%)
        sensoryMode: 'dictation', // 100% 純聽寫
        reverseRate: 0,
        hardWeight: 0.4,
        badge: '⚡'
    },
    {
        id: 7,
        tier: '七階・聽寫逆向',
        title: '聽覺逆向除法 (2~9)',
        desc: '聽寫逆向題（「幾乘八等於五十六」），純靠聽音進行逆向推導',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 80,
        timePerQuestion: 2.5,
        passRate: 0.98,       // 至少答對 79/80 題 (98%，最多錯1題)
        sensoryMode: 'dictation',
        reverseRate: 0.6,     // 60% 聽寫逆向
        hardWeight: 0.45,
        badge: '🔥'
    },
    {
        id: 8,
        tier: '八階・雙模狂暴',
        title: '極限雙模大亂鬥 (2~9)',
        desc: '每題 2.2 秒！讀寫逆向與聽寫盲測隨機混跳，極限刺激',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 90,
        timePerQuestion: 2.2,
        passRate: 0.99,       // 至少答對 90/90 或 89/90 (99%)
        sensoryMode: 'mix',
        reverseRate: 0.5,
        hardWeight: 0.5,
        badge: '🌪️'
    },
    {
        id: 9,
        tier: '九階・巔峰大宗師',
        title: '百題零容錯極致考核',
        desc: '連續 100 題！2.0秒極限反射，正確率必須為 100%！錯一題即淘汰',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 100,           // 100 題
        timePerQuestion: 2.0, // 每題 2.0 秒
        passRate: 1.00,       // 100% 正確率！零失誤
        sensoryMode: 'mix',   // 聽寫 + 讀寫 + 逆向全域混合
        reverseRate: 0.4,
        hardWeight: 0.4,
        badge: '👑'
    }
];

class MultiplicationEngine {
    constructor() {
        this.storageKey = 'math9x9_profile_v2';
        this.profile = this.loadProfile();
        this.currentQuestion = null;
        this.questionStartTime = 0;
        this.recentQuestions = [];
    }

    // 載入本地記錄
    loadProfile() {
        const defaultProfile = {
            unlockedTier: 1,      // 當前解鎖最高階級
            tierStars: {},        // 各階級獲得星星數 { 1: 3, 2: 2, ... }
            totalSolved: 0,
            totalCorrect: 0,
            totalWrong: 0,
            maxCombo: 0,
            mistakes: {},         // 錯題本 { "7x8": { q: "7 X 8", a: 56, count: 2, createdAt: 1234567, deadline: 1234567 } }
            certificates: [],
            lastDemoteCheck: Date.now()
        };

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                return Object.assign(defaultProfile, JSON.parse(raw));
            }
        } catch (e) {
            console.warn('無法讀取 LocalStorage:', e);
        }
        return defaultProfile;
    }

    // 儲存本地記錄
    saveProfile() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
        } catch (e) {
            console.warn('無法寫入 LocalStorage:', e);
        }
    }

    /**
     * 檢查錯題是否超過 3 天 (72 小時) 期限
     * 若有任何錯題逾期未清空，執行降階懲罰 (unlockedTier - 1，最低為 1)
     */
    checkMistakesOverdue() {
        const now = Date.now();
        const mistakes = this.profile.mistakes;
        const keys = Object.keys(mistakes);
        if (keys.length === 0) return { demoted: false, overdueCount: 0 };

        let overdueCount = 0;
        keys.forEach(k => {
            const item = mistakes[k];
            // 若為舊格式無 deadline，自動補上 3 天期限
            if (!item.deadline) {
                item.createdAt = item.createdAt || now;
                item.deadline = item.createdAt + MISTAKE_DEADLINE_MS;
            }
            if (now > item.deadline) {
                overdueCount++;
            }
        });

        if (overdueCount > 0) {
            const prevTier = this.profile.unlockedTier;
            let demoted = false;

            if (this.profile.unlockedTier > 1) {
                this.profile.unlockedTier--;
                demoted = true;
            }

            // 延長逾期錯題的 deadline 另外 3 天，避免每次刷新連續降階至 1
            keys.forEach(k => {
                if (now > mistakes[k].deadline) {
                    mistakes[k].deadline = now + MISTAKE_DEADLINE_MS;
                }
            });

            this.profile.lastDemoteCheck = now;
            this.saveProfile();

            return {
                demoted,
                prevTier,
                currentTier: this.profile.unlockedTier,
                overdueCount
            };
        }

        return { demoted: false, overdueCount: 0 };
    }

    /**
     * 計算最急迫錯題的剩餘復習時間
     */
    getMostUrgentMistakeStatus() {
        const mistakes = Object.values(this.profile.mistakes);
        if (mistakes.length === 0) return null;

        const now = Date.now();
        let minRemainingMs = Infinity;

        mistakes.forEach(item => {
            const deadline = item.deadline || (item.createdAt ? item.createdAt + MISTAKE_DEADLINE_MS : now + MISTAKE_DEADLINE_MS);
            const diff = deadline - now;
            if (diff < minRemainingMs) {
                minRemainingMs = diff;
            }
        });

        if (minRemainingMs <= 0) {
            return { isOverdue: true, text: '已逾期！降階警告' };
        }

        const totalHours = Math.floor(minRemainingMs / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;

        let text = '';
        if (days > 0) {
            text = `剩餘 ${days}天 ${hours}小時`;
        } else {
            const minutes = Math.floor((minRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
            text = `剩餘 ${hours}小時 ${minutes}分 (緊急)`;
        }

        return {
            isOverdue: false,
            remainingMs: minRemainingMs,
            text,
            isUrgent: minRemainingMs < 24 * 60 * 60 * 1000 // 少於 24 小時視為緊急
        };
    }

    // 生成題目
    // options: { factors, sensoryMode: 'reading'|'dictation'|'mix', reverseRate, hardWeight, mode, seqIndex }
    generateQuestion(options = {}) {
        const reverseRate = options.reverseRate || 0;
        const isReverse = Math.random() < reverseRate;
        const hardWeight = options.hardWeight || 0;
        const useHard = Math.random() < hardWeight;

        // 決定感官模式 (讀寫 vs 聽寫)
        let isDictation = false;
        if (options.sensoryMode === 'dictation') {
            isDictation = true;
        } else if (options.sensoryMode === 'mix') {
            isDictation = Math.random() < 0.5;
        } else {
            isDictation = false;
        }

        let factorA, factorB;

        if (useHard) {
            // 從高頻易錯庫隨機抽選，避開最近題目
            let attempts = 0;
            let pair;
            do {
                pair = HARD_PAIRS[Math.floor(Math.random() * HARD_PAIRS.length)];
                attempts++;
            } while (this.recentQuestions.includes(`${pair[0]}x${pair[1]}`) && attempts < 10);

            factorA = pair[0];
            factorB = pair[1];
        } else if (options.mode === 'sequence') {
            const availableFactors = options.factors && options.factors.length > 0 ? options.factors : [2,3,4,5,6,7,8,9];
            const baseIndex = options.seqIndex || 0;
            const factorIndex = Math.floor(baseIndex / 9) % availableFactors.length;
            const multiplier = (baseIndex % 9) + 1;
            factorA = availableFactors[factorIndex];
            factorB = multiplier;
        } else {
            const availableFactors = options.factors && options.factors.length > 0 ? options.factors : [2,3,4,5,6,7,8,9];
            let attempts = 0;
            do {
                factorA = availableFactors[Math.floor(Math.random() * availableFactors.length)];
                factorB = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
                attempts++;
            } while (this.recentQuestions.includes(`${factorA}x${factorB}`) && attempts < 10);
        }

        this.recentQuestions.push(`${factorA}x${factorB}`);
        if (this.recentQuestions.length > 8) {
            this.recentQuestions.shift();
        }

        const product = factorA * factorB;
        let questionText = '';
        let targetAnswer = 0;
        let isFillA = false;
        let isFillB = false;

        if (isReverse) {
            // 逆向填空題: ? x B = C 或 A x ? = C
            if (Math.random() < 0.5) {
                questionText = `? × ${factorB} = ${product}`;
                targetAnswer = factorA;
                isFillA = true;
            } else {
                questionText = `${factorA} × ? = ${product}`;
                targetAnswer = factorB;
                isFillB = true;
            }
        } else {
            // 正向題目: A x B = ?
            questionText = `${factorA} × ${factorB}`;
            targetAnswer = product;
        }

        this.questionStartTime = Date.now();
        this.currentQuestion = {
            factorA,
            factorB,
            product,
            questionText,
            targetAnswer,
            isReverse,
            isFillA,
            isFillB,
            isDictation, // 是否為聽寫題 (畫面上隱藏算式，純聽語音)
            rawKey: `${factorA}x${factorB}`
        };

        return this.currentQuestion;
    }

    // 檢查作答結果
    checkAnswer(userAns) {
        if (!this.currentQuestion) return { isCorrect: false };

        const numericAns = parseInt(userAns, 10);
        const isCorrect = numericAns === this.currentQuestion.targetAnswer;
        const timeSpent = Math.max(0.1, (Date.now() - this.questionStartTime) / 1000);
        const now = Date.now();

        this.profile.totalSolved++;
        if (isCorrect) {
            this.profile.totalCorrect++;
            const rawKey = this.currentQuestion.rawKey;
            if (this.profile.mistakes[rawKey]) {
                this.profile.mistakes[rawKey].correctAfterFail = (this.profile.mistakes[rawKey].correctAfterFail || 0) + 1;
                // 連續答對 2 次後自錯題本畢業移除
                if (this.profile.mistakes[rawKey].correctAfterFail >= 2) {
                    delete this.profile.mistakes[rawKey];
                }
            }
        } else {
            this.profile.totalWrong++;
            const rawKey = this.currentQuestion.rawKey;
            if (!this.profile.mistakes[rawKey]) {
                this.profile.mistakes[rawKey] = {
                    factorA: this.currentQuestion.factorA,
                    factorB: this.currentQuestion.factorB,
                    product: this.currentQuestion.product,
                    qText: `${this.currentQuestion.factorA} × ${this.currentQuestion.factorB} = ${this.currentQuestion.product}`,
                    count: 1,
                    lastWrongAnswer: userAns,
                    correctAfterFail: 0,
                    createdAt: now,
                    deadline: now + MISTAKE_DEADLINE_MS // 3 天復習時效
                };
            } else {
                this.profile.mistakes[rawKey].count++;
                this.profile.mistakes[rawKey].lastWrongAnswer = userAns;
                this.profile.mistakes[rawKey].correctAfterFail = 0;
                // 再次失誤重置 3 天計時
                this.profile.mistakes[rawKey].deadline = now + MISTAKE_DEADLINE_MS;
            }
        }

        this.saveProfile();

        return {
            isCorrect,
            targetAnswer: this.currentQuestion.targetAnswer,
            timeSpent,
            question: this.currentQuestion
        };
    }

    // 記錄段位過關成績
    recordTierResult(tierId, stars, accuracy, avgTime) {
        if (!this.profile.tierStars[tierId] || stars > this.profile.tierStars[tierId]) {
            this.profile.tierStars[tierId] = stars;
        }

        // 若成功獲得至少 1 顆星，且此關是當前最高關，解鎖下一關
        if (stars > 0 && tierId === this.profile.unlockedTier && tierId < TIERS_CONFIG.length) {
            this.profile.unlockedTier = tierId + 1;
        }

        this.saveProfile();
        return {
            unlockedNext: this.profile.unlockedTier > tierId,
            newUnlockedTier: this.profile.unlockedTier
        };
    }

    // 取得所有錯題陣列 (依期限與錯誤次數排序)
    getMistakesList() {
        return Object.values(this.profile.mistakes).sort((a, b) => {
            const deadA = a.deadline || 0;
            const deadB = b.deadline || 0;
            return deadA - deadB; // 越急迫的排在最前
        });
    }

    // 清空錯題本
    clearMistakes() {
        this.profile.mistakes = {};
        this.saveProfile();
    }

    // 取得段位配置
    getTierConfig(tierId) {
        return TIERS_CONFIG.find(t => t.id === tierId) || TIERS_CONFIG[0];
    }

    // 生成段位合格證書資料
    generateCertificate(data) {
        const cert = {
            id: 'CERT-' + Date.now().toString(36).toUpperCase(),
            date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
            title: data.title || '九九乘法高階能力檢定',
            rank: data.rank || '卓越級',
            score: data.score,
            accuracy: data.accuracy,
            speed: data.speed,
            totalQuestions: data.totalQuestions,
            timeSpent: data.timeSpent
        };

        this.profile.certificates.unshift(cert);
        if (this.profile.certificates.length > 20) {
            this.profile.certificates.pop();
        }
        this.saveProfile();
        return cert;
    }
}

// 導出引擎實例
window.multiplicationEngine = new MultiplicationEngine();
