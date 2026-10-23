/**
 * 9x9 乘法大師 - 核心引擎與分級邏輯 (Core Engine & Leveling Progression)
 */

// 經典高頻易錯題目列表 (依據國小教育統計最容易混淆的算式)
const HARD_PAIRS = [
    [7, 8], [8, 7], [6, 7], [7, 6], [8, 9], [9, 8],
    [6, 8], [8, 6], [7, 9], [9, 7], [7, 7], [8, 8],
    [6, 9], [9, 6], [4, 7], [7, 4], [4, 8], [8, 4],
    [3, 8], [8, 3], [3, 7], [7, 3]
];

// 階級闖關關卡定義 (九段階級晉升體系)
const TIERS_CONFIG = [
    {
        id: 1,
        tier: '一階・初出茅廬',
        title: '入門倍數 (2, 5)',
        desc: '掌握最規律的 2 和 5，建立計算自信心',
        factors: [2, 5],
        count: 10,
        timePerQuestion: 8, // 每題限時 (秒)
        passRate: 0.8,
        reverseRate: 0,
        badge: '🌱',
        bgGradient: 'from-emerald-500 to-teal-700'
    },
    {
        id: 2,
        tier: '二階・漸入佳境',
        title: '基礎三四 (3, 4)',
        desc: '乘法進階練習，掌握 3 與 4 的跳數規律',
        factors: [3, 4],
        count: 12,
        timePerQuestion: 7,
        passRate: 0.85,
        reverseRate: 0,
        badge: '🌿',
        bgGradient: 'from-cyan-500 to-blue-700'
    },
    {
        id: 3,
        tier: '三階・小試身手',
        title: '偶數挑戰 (6, 8)',
        desc: '加強中高階偶數乘法，避免跳號失誤',
        factors: [6, 8],
        count: 14,
        timePerQuestion: 6.5,
        passRate: 0.85,
        reverseRate: 0,
        badge: '⚔️',
        bgGradient: 'from-blue-500 to-indigo-700'
    },
    {
        id: 4,
        tier: '四階・突破瓶頸',
        title: '神秘奇數 (7, 9)',
        desc: '攻克 99 乘法最容易卡關的 7 與 9',
        factors: [7, 9],
        count: 14,
        timePerQuestion: 6,
        passRate: 0.85,
        reverseRate: 0,
        badge: '🛡️',
        bgGradient: 'from-violet-500 to-purple-800'
    },
    {
        id: 5,
        tier: '五階・融會貫通',
        title: '全表大考驗 (2~9)',
        desc: '2到9全部打散隨機，考驗綜合記憶力',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 18,
        timePerQuestion: 5.5,
        passRate: 0.85,
        reverseRate: 0,
        badge: '🎯',
        bgGradient: 'from-amber-500 to-orange-700'
    },
    {
        id: 6,
        tier: '六階・疾風神速',
        title: '極速反射 (限時4秒)',
        desc: '直覺反射訓練，看題即知答案',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 20,
        timePerQuestion: 4.0,
        passRate: 0.9,
        reverseRate: 0,
        badge: '⚡',
        bgGradient: 'from-yellow-400 to-amber-600'
    },
    {
        id: 7,
        tier: '七階・火眼金睛',
        title: '易錯陷阱特訓',
        desc: '專攻 7x8、6x7、8x9 等國小最高頻易錯魔王題',
        factors: 'HARD_ONLY',
        count: 16,
        timePerQuestion: 5.0,
        passRate: 0.9,
        reverseRate: 0,
        badge: '🔥',
        bgGradient: 'from-rose-500 to-red-700'
    },
    {
        id: 8,
        tier: '八階・神機妙算',
        title: '逆向填空思維',
        desc: '例如 7 x ? = 56，銜接除法思維與邏輯推導',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 18,
        timePerQuestion: 5.5,
        passRate: 0.85,
        reverseRate: 1.0, // 100% 逆向題
        badge: '🔮',
        bgGradient: 'from-fuchsia-500 to-pink-700'
    },
    {
        id: 9,
        tier: '九階・乘法宗師',
        title: '巔峰全域考核',
        desc: '正反混合、極限時速、最高難度，榮登九九乘法大宗師',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        count: 25,
        timePerQuestion: 3.5,
        passRate: 0.92,
        reverseRate: 0.35,
        badge: '👑',
        bgGradient: 'from-amber-400 via-rose-500 to-purple-800'
    }
];

class MultiplicationEngine {
    constructor() {
        this.storageKey = 'math9x9_profile_v1';
        this.profile = this.loadProfile();
        this.currentQuestion = null;
        this.questionStartTime = 0;
        this.recentQuestions = []; // 防重複隊列
    }

    // 載入本地記錄
    loadProfile() {
        const defaultProfile = {
            unlockedTier: 1,      // 當前解鎖最高階級
            tierStars: {},        // 各階級獲得星星數 { 1: 3, 2: 2, ... }
            highScores: {
                time60: 0,
                time120: 0,
                time180: 0,
                count20: 0,
                count50: 0
            },
            totalSolved: 0,
            totalCorrect: 0,
            totalWrong: 0,
            maxCombo: 0,
            mistakes: {},         // 錯題本 { "7x8": { q: "7 X 8", a: 56, count: 2, lastTime: 1234567 } }
            certificates: []      // 考試合格證書歷史
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

    // 生成題目
    // options: { factors: [2..9] | 'HARD_ONLY', mode: 'random' | 'sequence', reverseRate: 0~1, seqIndex: 0 }
    generateQuestion(options = {}) {
        const reverseRate = options.reverseRate || 0;
        const isReverse = Math.random() < reverseRate;
        let factorA, factorB;

        if (options.factors === 'HARD_ONLY') {
            // 從高頻易錯庫隨機抽選，避免與前3題重複
            let attempts = 0;
            let pair;
            do {
                pair = HARD_PAIRS[Math.floor(Math.random() * HARD_PAIRS.length)];
                attempts++;
            } while (this.recentQuestions.includes(`${pair[0]}x${pair[1]}`) && attempts < 10);

            factorA = pair[0];
            factorB = pair[1];
        } else if (options.mode === 'sequence') {
            // 依序出題 (例如 2x1, 2x2, ... 2x9)
            const availableFactors = options.factors && options.factors.length > 0 ? options.factors : [2,3,4,5,6,7,8,9];
            const baseIndex = options.seqIndex || 0;
            const factorIndex = Math.floor(baseIndex / 9) % availableFactors.length;
            const multiplier = (baseIndex % 9) + 1;
            factorA = availableFactors[factorIndex];
            factorB = multiplier;
        } else {
            // 隨機出題
            const availableFactors = options.factors && options.factors.length > 0 ? options.factors : [2,3,4,5,6,7,8,9];
            let attempts = 0;
            do {
                factorA = availableFactors[Math.floor(Math.random() * availableFactors.length)];
                factorB = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
                attempts++;
            } while (this.recentQuestions.includes(`${factorA}x${factorB}`) && attempts < 10);
        }

        // 維護最近題目隊列 (最多5個)
        this.recentQuestions.push(`${factorA}x${factorB}`);
        if (this.recentQuestions.length > 6) {
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
                // ? x B = C (求 A)
                questionText = `? × ${factorB} = ${product}`;
                targetAnswer = factorA;
                isFillA = true;
            } else {
                // A x ? = C (求 B)
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
            rawKey: `${factorA}x${factorB}`
        };

        return this.currentQuestion;
    }

    // 檢查作答結果
    // userAns: 使用者輸入數值 (Number 或 String)
    checkAnswer(userAns) {
        if (!this.currentQuestion) return { isCorrect: false };

        const numericAns = parseInt(userAns, 10);
        const isCorrect = numericAns === this.currentQuestion.targetAnswer;
        const timeSpent = Math.max(0.1, (Date.now() - this.questionStartTime) / 1000);

        // 更新累積題數
        this.profile.totalSolved++;
        if (isCorrect) {
            this.profile.totalCorrect++;
            // 若此題在錯題本中且答對，減少記錄
            const rawKey = this.currentQuestion.rawKey;
            if (this.profile.mistakes[rawKey]) {
                this.profile.mistakes[rawKey].correctAfterFail = (this.profile.mistakes[rawKey].correctAfterFail || 0) + 1;
                // 連續答對 2 次後自錯題本移除
                if (this.profile.mistakes[rawKey].correctAfterFail >= 2) {
                    delete this.profile.mistakes[rawKey];
                }
            }
        } else {
            this.profile.totalWrong++;
            // 記錄至錯題本
            const rawKey = this.currentQuestion.rawKey;
            if (!this.profile.mistakes[rawKey]) {
                this.profile.mistakes[rawKey] = {
                    factorA: this.currentQuestion.factorA,
                    factorB: this.currentQuestion.factorB,
                    product: this.currentQuestion.product,
                    qText: `${this.currentQuestion.factorA} × ${this.currentQuestion.factorB} = ${this.currentQuestion.product}`,
                    count: 1,
                    lastWrongAnswer: userAns,
                    correctAfterFail: 0
                };
            } else {
                this.profile.mistakes[rawKey].count++;
                this.profile.mistakes[rawKey].lastWrongAnswer = userAns;
                this.profile.mistakes[rawKey].correctAfterFail = 0;
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

    // 取得所有錯題陣列
    getMistakesList() {
        return Object.values(this.profile.mistakes).sort((a, b) => b.count - a.count);
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
            title: data.title || '九九乘法能力檢定',
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
