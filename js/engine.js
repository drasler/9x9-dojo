/**
 * 9x9 乘法大師 - 核心引擎與分級邏輯 (Core Engine & Leveling Progression)
 * 國小四年級以上高強度特化版本：
 * 1. 全階 1~9 階皆採用 2~9 全段乘法。
 * 2. 階級提升體系（三級三通）：每一階均劃分為「下級、中級、上級」三個小等級，
 *    每一級皆須過關 3 次（累積 3 顆修練印章 ●●●）才能晉升至下一級，上級過關 3 次方可晉階！
 * 3. 低階時間限制放寬（一階下級 8.0秒、中級 7.0秒、上級 6.0秒），建立兒童心算自信與扎實基礎。
 * 4. 視覺讀寫 (Reading) 與聽力聽寫 (Dictation) 分階分離。
 * 5. 奇獸伴學夥伴養成系統（奇獸蛋 -> 靈火狐 -> 疾風獵豹 -> 九天神龍）與每日連續修練打卡 (Streak)。
 * 6. 錯題復習限時 3 天 (72 小時)，逾期未清空觸發降階懲罰。
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

// 九段階級晉升體系 (三級三通：每階分下級、中級、上級，各需通關 3 次)
const TIERS_CONFIG = [
    {
        id: 1,
        tier: '一階・初試鋒芒',
        title: '全表讀寫基礎 (2~9)',
        desc: '視覺讀寫題，掌握全域乘法快速反應，充裕時間建立心算直覺',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'reading',
        reverseRate: 0,
        hardWeight: 0.15,
        badge: '🌱',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 15, timePerQuestion: 8.0, passRate: 0.80 },
            2: { name: '中級', subTitle: '精進篇', count: 18, timePerQuestion: 7.0, passRate: 0.85 },
            3: { name: '上級', subTitle: '巔峰篇', count: 20, timePerQuestion: 6.0, passRate: 0.85 }
        }
    },
    {
        id: 2,
        tier: '二階・穩紮穩打',
        title: '極速讀寫進階 (2~9)',
        desc: '題數增加、時間逐步微調，強化抗壓連續心算肌肉記憶',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'reading',
        reverseRate: 0,
        hardWeight: 0.25,
        badge: '🌿',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 18, timePerQuestion: 7.0, passRate: 0.85 },
            2: { name: '中級', subTitle: '精進篇', count: 24, timePerQuestion: 6.2, passRate: 0.88 },
            3: { name: '上級', subTitle: '巔峰篇', count: 30, timePerQuestion: 5.5, passRate: 0.88 }
        }
    },
    {
        id: 3,
        tier: '三階・易錯加權',
        title: '魔王陷阱爆破 (2~9)',
        desc: '大幅提升 7x8, 6x7, 8x9 等國小最高頻易錯題出題比重',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'reading',
        reverseRate: 0,
        hardWeight: 0.55,
        badge: '⚔️',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 20, timePerQuestion: 6.0, passRate: 0.88 },
            2: { name: '中級', subTitle: '精進篇', count: 28, timePerQuestion: 5.2, passRate: 0.90 },
            3: { name: '上級', subTitle: '巔峰篇', count: 35, timePerQuestion: 4.5, passRate: 0.90 }
        }
    },
    {
        id: 4,
        tier: '四階・逆向填空',
        title: '除法思維逆推 (2~9)',
        desc: '視覺逆向題（例如 7 × ? = 56），銜接國小高年級因數與除法心算',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'reading',
        reverseRate: 0.50,
        hardWeight: 0.35,
        badge: '🔮',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 24, timePerQuestion: 5.5, passRate: 0.90 },
            2: { name: '中級', subTitle: '精進篇', count: 32, timePerQuestion: 4.8, passRate: 0.90 },
            3: { name: '上級', subTitle: '巔峰篇', count: 40, timePerQuestion: 4.2, passRate: 0.92 }
        }
    },
    {
        id: 5,
        tier: '五階・聽寫啟蒙',
        title: '聽力盲測初探 (2~9)',
        desc: '視覺與聽寫交替！螢幕隱藏算式，純聽口訣「七乘八」盲測秒答',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'mix',
        reverseRate: 0.2,
        hardWeight: 0.35,
        badge: '🎧',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 25, timePerQuestion: 5.0, passRate: 0.90 },
            2: { name: '中級', subTitle: '精進篇', count: 35, timePerQuestion: 4.5, passRate: 0.92 },
            3: { name: '上級', subTitle: '巔峰篇', count: 45, timePerQuestion: 4.0, passRate: 0.94 }
        }
    },
    {
        id: 6,
        tier: '六階・疾風聽寫',
        title: '全聽力聽寫盲測 (2~9)',
        desc: '100% 聽寫題！完全依靠耳朵聽音與大腦聽覺記憶秒按數字',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'dictation',
        reverseRate: 0,
        hardWeight: 0.4,
        badge: '⚡',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 30, timePerQuestion: 4.2, passRate: 0.92 },
            2: { name: '中級', subTitle: '精進篇', count: 45, timePerQuestion: 3.8, passRate: 0.94 },
            3: { name: '上級', subTitle: '巔峰篇', count: 60, timePerQuestion: 3.5, passRate: 0.96 }
        }
    },
    {
        id: 7,
        tier: '七階・聽寫逆向',
        title: '聽覺逆向除法 (2~9)',
        desc: '聽寫逆向題（「幾乘八等於五十六」），純靠聽音進行逆向推導',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'dictation',
        reverseRate: 0.6,
        hardWeight: 0.45,
        badge: '🔥',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 40, timePerQuestion: 3.8, passRate: 0.94 },
            2: { name: '中級', subTitle: '精進篇', count: 55, timePerQuestion: 3.5, passRate: 0.96 },
            3: { name: '上級', subTitle: '巔峰篇', count: 70, timePerQuestion: 3.0, passRate: 0.98 }
        }
    },
    {
        id: 8,
        tier: '八階・雙模狂暴',
        title: '極限雙模大亂鬥 (2~9)',
        desc: '讀寫逆向與聽寫盲測隨機混跳，極限刺激',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'mix',
        reverseRate: 0.5,
        hardWeight: 0.5,
        badge: '🌪️',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 50, timePerQuestion: 3.0, passRate: 0.96 },
            2: { name: '中級', subTitle: '精進篇', count: 65, timePerQuestion: 2.6, passRate: 0.98 },
            3: { name: '上級', subTitle: '巔峰篇', count: 80, timePerQuestion: 2.3, passRate: 0.98 }
        }
    },
    {
        id: 9,
        tier: '九階・巔峰大宗師',
        title: '百題零容錯極致考核',
        desc: '百題 100% 正確率考核！錯一題即淘汰，唯有大宗師方能登頂',
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        sensoryMode: 'mix',
        reverseRate: 0.4,
        hardWeight: 0.4,
        badge: '👑',
        subLevels: {
            1: { name: '下級', subTitle: '初修篇', count: 50, timePerQuestion: 2.5, passRate: 1.00 },
            2: { name: '中級', subTitle: '精進篇', count: 75, timePerQuestion: 2.2, passRate: 1.00 },
            3: { name: '上級', subTitle: '巔峰篇', count: 100, timePerQuestion: 2.0, passRate: 1.00 }
        }
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
            unlockedTier: 1,      // 當前解鎖最高階級 (1~9)
            tierProgress: {},     // 三級三通進度 { 1: { currentSub: 1, clears: { 1:0, 2:0, 3:0 } } }
            tierStars: {},        // 各階級獲得星星數 { 1: 3, 2: 2, ... }
            totalSolved: 0,
            totalCorrect: 0,
            totalWrong: 0,
            maxCombo: 0,
            mistakes: {},         // 錯題本
            certificates: [],
            streak: { count: 0, lastDate: '' }, // 每日連續修練打卡
            beast: { exp: 0, level: 1 },         // 奇獸夥伴養成
            lastDemoteCheck: Date.now()
        };

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const loaded = Object.assign(defaultProfile, JSON.parse(raw));
                // 確保 tierProgress 結構完整
                if (!loaded.tierProgress) loaded.tierProgress = {};
                for (let t = 1; t <= 9; t++) {
                    if (!loaded.tierProgress[t]) {
                        const isFullyCleared = t < loaded.unlockedTier;
                        loaded.tierProgress[t] = {
                            currentSub: isFullyCleared ? 4 : 1,
                            clears: { 1: isFullyCleared ? 3 : 0, 2: isFullyCleared ? 3 : 0, 3: isFullyCleared ? 3 : 0 }
                        };
                    }
                }
                if (!loaded.streak) loaded.streak = { count: 0, lastDate: '' };
                if (!loaded.beast) loaded.beast = { exp: 0, level: 1 };
                return loaded;
            }
        } catch (e) {
            console.warn('無法讀取 LocalStorage:', e);
        }

        // 初始化全新進度
        for (let t = 1; t <= 9; t++) {
            defaultProfile.tierProgress[t] = {
                currentSub: t === 1 ? 1 : 1,
                clears: { 1: 0, 2: 0, 3: 0 }
            };
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
     * 取得指定階級的三級三通進度
     */
    getTierProgress(tierId) {
        if (!this.profile.tierProgress) {
            this.profile.tierProgress = {};
        }
        if (!this.profile.tierProgress[tierId]) {
            const isFullyCleared = tierId < this.profile.unlockedTier;
            this.profile.tierProgress[tierId] = {
                currentSub: isFullyCleared ? 4 : 1,
                clears: { 1: isFullyCleared ? 3 : 0, 2: isFullyCleared ? 3 : 0, 3: isFullyCleared ? 3 : 0 }
            };
        }
        return this.profile.tierProgress[tierId];
    }

    /**
     * 取得指定階級與子等級 (1:下級, 2:中級, 3:上級) 的出題規格
     */
    getSubConfig(tierId, subLevel = 1) {
        const tierCfg = this.getTierConfig(tierId);
        const sub = tierCfg.subLevels[subLevel] || tierCfg.subLevels[1];
        return {
            tierId,
            tierName: tierCfg.tier,
            subLevel,
            subName: sub.name,
            subTitle: sub.subTitle,
            fullTitle: `${tierCfg.tier}・${sub.name}`,
            count: sub.count,
            timePerQuestion: sub.timePerQuestion,
            passRate: sub.passRate,
            factors: tierCfg.factors,
            sensoryMode: tierCfg.sensoryMode,
            reverseRate: tierCfg.reverseRate,
            hardWeight: tierCfg.hardWeight,
            badge: tierCfg.badge
        };
    }

    /**
     * 記錄子等級挑戰結果 (達成合格率通關時 +1，滿 3 次晉級)
     */
    recordTierClearance(tierId, subLevel, isPassed) {
        const prog = this.getTierProgress(tierId);
        let promotedSub = false;
        let promotedTier = false;

        if (isPassed) {
            prog.clears[subLevel] = Math.min(3, (prog.clears[subLevel] || 0) + 1);

            // 若該小等級已成功通關 3 次
            if (prog.clears[subLevel] >= 3) {
                if (subLevel < 3) {
                    if (prog.currentSub <= subLevel) {
                        prog.currentSub = subLevel + 1;
                        promotedSub = true;
                    }
                } else if (subLevel === 3) {
                    // 上級通關 3 次 -> 該階大圓滿！解鎖下一階
                    prog.currentSub = 4;
                    if (this.profile.unlockedTier <= tierId && tierId < TIERS_CONFIG.length) {
                        this.profile.unlockedTier = tierId + 1;
                        promotedTier = true;
                    }
                }
            }

            // 更新星級：通過下級=1星、中級=2星、上級=3星
            let stars = 0;
            if (prog.clears[1] >= 3) stars++;
            if (prog.clears[2] >= 3) stars++;
            if (prog.clears[3] >= 3) stars++;
            this.profile.tierStars[tierId] = stars;

            // 獎勵奇獸 EXP：每次通關獲得 120 EXP
            this.addBeastExp(120);

            // 更新每日修練連勝打卡
            this.updateDailyStreak();

            this.saveProfile();
        }

        return {
            prog,
            clears: prog.clears[subLevel],
            targetClears: 3,
            promotedSub,
            promotedTier,
            newSub: prog.currentSub,
            newTier: this.profile.unlockedTier
        };
    }

    /**
     * 每日連續修練打卡 (Streak)
     */
    updateDailyStreak() {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        
        if (!this.profile.streak) {
            this.profile.streak = { count: 0, lastDate: '' };
        }
        
        const streak = this.profile.streak;
        if (streak.lastDate === todayStr) {
            return { streakCount: streak.count, isNewDay: false };
        }

        if (streak.lastDate) {
            const last = new Date(streak.lastDate);
            const diffDays = Math.round((now - last) / (1000 * 3600 * 24));
            if (diffDays === 1) {
                streak.count++;
            } else if (diffDays > 1) {
                streak.count = 1;
            }
        } else {
            streak.count = 1;
        }

        streak.lastDate = todayStr;
        this.saveProfile();
        return { streakCount: streak.count, isNewDay: true };
    }

    /**
     * 奇獸伴學夥伴養成系統 (EXP 與等級成長)
     */
    addBeastExp(expAmount) {
        if (!this.profile.beast) {
            this.profile.beast = { exp: 0, level: 1 };
        }
        const b = this.profile.beast;
        b.exp += expAmount;
        
        let leveledUp = false;
        let nextLevelExp = b.level * 150;
        while (b.exp >= nextLevelExp && b.level < 30) {
            b.exp -= nextLevelExp;
            b.level++;
            nextLevelExp = b.level * 150;
            leveledUp = true;
        }
        this.saveProfile();
        return {
            level: b.level,
            exp: b.exp,
            maxExp: b.level * 150,
            leveledUp,
            beastInfo: this.getBeastInfo(b.level)
        };
    }

    getBeastInfo(level) {
        if (level < 4) {
            return { name: '乘法奇獸蛋', icon: '🥚', title: '初生奇卵・蘊育心算潛能' };
        } else if (level < 9) {
            return { name: '靈火狐', icon: '🦊', title: '機敏伶俐・直覺反應倍增' };
        } else if (level < 16) {
            return { name: '疾風獵豹', icon: '🐆', title: '迅疾如風・秒答百步穿楊' };
        } else {
            return { name: '九天神龍', icon: '🐉', title: '乘法大宗師・通天霸氣修為' };
        }
    }

    /**
     * 檢查錯題是否超過 3 天 (72 小時) 期限
     */
    checkMistakesOverdue() {
        const now = Date.now();
        const mistakes = this.profile.mistakes;
        const keys = Object.keys(mistakes);
        if (keys.length === 0) return { demoted: false, overdueCount: 0 };

        let overdueCount = 0;
        keys.forEach(k => {
            const item = mistakes[k];
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
            isUrgent: minRemainingMs < 24 * 60 * 60 * 1000
        };
    }

    // 生成題目
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
            let attempts = 0;
            let pair;
            do {
                pair = HARD_PAIRS[Math.floor(Math.random() * HARD_PAIRS.length)];
                attempts++;
            } while (this.recentQuestions.includes(`${pair[0]}x${pair[1]}`) && attempts < 10);

            factorA = pair[0];
            factorB = pair[1];
        } else if (options.mode === 'sequence') {
            const factors = options.factors || [2, 3, 4, 5, 6, 7, 8, 9];
            factorA = factors[0];
            const seq = (options.seqIndex !== undefined ? options.seqIndex : 0) % 8;
            factorB = [2, 3, 4, 5, 6, 7, 8, 9][seq];
        } else {
            const factors = options.factors || [2, 3, 4, 5, 6, 7, 8, 9];
            let attempts = 0;
            do {
                factorA = factors[Math.floor(Math.random() * factors.length)];
                factorB = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
                attempts++;
            } while (this.recentQuestions.includes(`${factorA}x${factorB}`) && attempts < 10);
        }

        // 記錄最近出題
        this.recentQuestions.push(`${factorA}x${factorB}`);
        if (this.recentQuestions.length > 8) {
            this.recentQuestions.shift();
        }

        const product = factorA * factorB;
        let questionText, targetAnswer, isFillA = false;

        if (isReverse) {
            isFillA = Math.random() < 0.5;
            if (isFillA) {
                questionText = `? × ${factorB} = ${product}`;
                targetAnswer = factorA;
            } else {
                questionText = `${factorA} × ? = ${product}`;
                targetAnswer = factorB;
            }
        } else {
            questionText = `${factorA} × ${factorB}`;
            targetAnswer = product;
        }

        this.currentQuestion = {
            factorA,
            factorB,
            product,
            isReverse,
            isFillA,
            isDictation,
            questionText,
            targetAnswer
        };

        this.questionStartTime = Date.now();
        return this.currentQuestion;
    }

    // 檢查答案
    checkAnswer(userAnswer) {
        if (!this.currentQuestion) return { isCorrect: false };

        const numericAns = parseInt(userAnswer, 10);
        const isCorrect = numericAns === this.currentQuestion.targetAnswer;
        const timeTakenMs = Date.now() - this.questionStartTime;

        this.profile.totalSolved++;
        if (isCorrect) {
            this.profile.totalCorrect++;
            this.profile.maxCombo = Math.max(this.profile.maxCombo, 1);
            // 答對獲得 8 點奇獸 EXP
            this.addBeastExp(8);

            // 若在錯題本中，答對減少錯誤計數或移除
            const qKey = `${this.currentQuestion.factorA}x${this.currentQuestion.factorB}`;
            if (this.profile.mistakes[qKey]) {
                this.profile.mistakes[qKey].count--;
                if (this.profile.mistakes[qKey].count <= 0) {
                    delete this.profile.mistakes[qKey];
                }
            }
        } else {
            this.profile.totalWrong++;
            this.recordMistake(this.currentQuestion.factorA, this.currentQuestion.factorB);
        }

        this.saveProfile();

        return {
            isCorrect,
            targetAnswer: this.currentQuestion.targetAnswer,
            timeTakenMs,
            question: this.currentQuestion
        };
    }

    // 記錄錯題 (自建 3 天 deadline)
    recordMistake(factorA, factorB) {
        const key = `${factorA}x${factorB}`;
        const now = Date.now();
        if (this.profile.mistakes[key]) {
            this.profile.mistakes[key].count++;
            this.profile.mistakes[key].lastWrongAt = now;
            this.profile.mistakes[key].deadline = now + MISTAKE_DEADLINE_MS;
        } else {
            this.profile.mistakes[key] = {
                factorA,
                factorB,
                text: `${factorA} × ${factorB}`,
                answer: factorA * factorB,
                count: 1,
                createdAt: now,
                deadline: now + MISTAKE_DEADLINE_MS
            };
        }
        this.saveProfile();
    }

    // 取得所有錯題陣列
    getMistakesList() {
        return Object.values(this.profile.mistakes).sort((a, b) => {
            const deadA = a.deadline || 0;
            const deadB = b.deadline || 0;
            return deadA - deadB;
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
