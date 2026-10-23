/**
 * 9x9 乘法大師 - 音效與語音合成引擎 (Web Audio API & Web Speech API)
 * 完全零外部檔案依賴，支援完全離線發聲與繁體中文口訣朗讀
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.voiceEnabled = false; // 預設語音關閉，使用者可一鍵開啟
        this.speechSynth = window.speechSynthesis || null;
        this.speechVoice = null;

        // 初始化語音聲音選擇
        if (this.speechSynth) {
            const loadVoices = () => {
                const voices = this.speechSynth.getVoices();
                // 優先選擇台灣中文或通用中文
                this.speechVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-HK')) ||
                                   voices.find(v => v.lang.startsWith('zh')) || null;
            };
            loadVoices();
            if (this.speechSynth.onvoiceschanged !== undefined) {
                this.speechSynth.onvoiceschanged = loadVoices;
            }
        }
    }

    // 延遲初始化 AudioContext (符合瀏覽器自動播放策略，使用者第一次點擊時解鎖)
    initAudio() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 播放答對音效 (清脆鈴聲，支援連擊升調)
    playCorrect(combo = 1) {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // 隨著連擊加高音高
        const baseFreq = Math.min(523.25 * Math.pow(1.05, Math.min(combo, 12)), 1046.5); // C5 upwards

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // 播放答錯音效 (低沉短促嘟聲)
    playWrong() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 播放按鍵點擊音
    playClick() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // 播放倒數計時嗶聲
    playBeep(isFinal = false) {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const freq = isFinal ? 880 : 440; // 最終嗶為高音 A5，其餘 A4
        const duration = isFinal ? 0.35 : 0.15;

        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    // 播放通關 / 升級歡呼琶音 (Fanfare)
    playFanfare() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C大調和弦上行
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + idx * 0.07;
            const noteLen = idx === notes.length - 1 ? 0.6 : 0.18;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.15, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteLen);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + noteLen);
        });
    }

    // 播放中文口訣語音 (例如 "7 乘以 8 等於多少")
    speakQuestion(factorA, factorB, isReverse = false, isFillA = false) {
        if (!this.voiceEnabled || !this.speechSynth) return;

        // 取消前一個未播完的語音
        this.speechSynth.cancel();

        let text = '';
        if (isReverse) {
            if (isFillA) {
                text = `幾 乘以 ${factorB} 等於 ${factorA * factorB}`;
            } else {
                text = `${factorA} 乘以 幾 等於 ${factorA * factorB}`;
            }
        } else {
            text = `${factorA} 乘 ${factorB}`;
        }

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.1; // 稍快，不拖沓
        utter.pitch = 1.05;
        if (this.speechVoice) {
            utter.voice = this.speechVoice;
        }
        this.speechSynth.speak(utter);
    }

    // 觸控震動 (支援的手機設備)
    vibrate(pattern = 15) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // 忽略不支援情況
            }
        }
    }
}

// 導出全域單例
window.soundEngine = new SoundEngine();
