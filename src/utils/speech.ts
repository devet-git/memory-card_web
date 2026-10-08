// Free Text-to-Speech (TTS) Service
// Dual Engine: Browser Web Speech API (Offline, Zero latency) + Free Online Audio Stream Fallback

export interface TTSOptions {
  lang?: string;
  rate?: number; // 0.5 to 1.5
  voiceURI?: string;
  forceOnline?: boolean;
  onStart?: () => void; // fired when audio actually begins playing
}

let activeAudio: HTMLAudioElement | null = null;

// Get available system voices
export function getSystemVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome and Safari load voices asynchronously
    const handleVoicesChanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    // Timeout fallback after 1 second if event doesn't fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

// Online Free Audio Pronunciation Fallback
export function playOnlineAudioTTS(text: string, lang = "en-US", onStart?: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }

      const cleanText = encodeURIComponent(text.trim());
      let audioUrl = "";

      const isEnglish = lang.toLowerCase().startsWith("en");
      if (isEnglish && text.split(" ").length <= 5) {
        // High-fidelity Oxford/American dictionary pronunciation stream (completely free, clear pronunciation)
        audioUrl = `https://dict.youdao.com/dictvoice?audio=${cleanText}&type=2`;
      } else {
        // Free Google Translate Audio stream
        const tl = isEnglish ? "en" : "vi";
        audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${cleanText}`;
      }

      const audio = new Audio(audioUrl);
      activeAudio = audio;

      audio.onplaying = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        resolve(true);
      };

      audio.onerror = () => {
        resolve(false);
      };

      audio.play().catch(() => {
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Main speakWord function. Resolves when playback finishes (or fails / is interrupted).
export function speakWord(text: string, options?: TTSOptions | string, rateMultiplier = 1.0): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !text || !text.trim()) {
      resolve();
      return;
    }

    const cleanText = text.trim();

    // Normalize options
    let opts: TTSOptions = {};
    if (typeof options === "string") {
      opts = { lang: options, rate: rateMultiplier };
    } else if (options) {
      opts = options;
    }

    // Detect language if not specified:
    // Check for Vietnamese diacritics
    const hasVietnameseMarks = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(cleanText);
    const detectedLang = opts.lang || (hasVietnameseMarks ? "vi-VN" : "en-US");
    const speechRate = opts.rate || 0.95;

    const playOnline = () => {
      playOnlineAudioTTS(cleanText, detectedLang, opts.onStart).then(() => resolve());
    };

    // If force online requested
    if (opts.forceOnline) {
      playOnline();
      return;
    }

    // Primary: Try native browser SpeechSynthesis
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();

        if (activeAudio) {
          activeAudio.pause();
          activeAudio = null;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = speechRate;
        utterance.lang = detectedLang;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          let selectedVoice: SpeechSynthesisVoice | undefined;

          if (opts.voiceURI) {
            selectedVoice = voices.find((v) => v.voiceURI === opts.voiceURI);
          }

          if (!selectedVoice) {
            // Prefer natural/Google/Microsoft high quality voices for matching language
            selectedVoice =
              voices.find((v) => v.lang.toLowerCase().replace("_", "-") === detectedLang.toLowerCase() && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))) ||
              voices.find((v) => v.lang.toLowerCase().startsWith(detectedLang.toLowerCase().substring(0, 2)));
          }

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onstart = () => {
          if (opts.onStart) opts.onStart();
        };
        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          // A newer request cancelled this one: nothing to fall back to
          if (e.error === "canceled" || e.error === "interrupted") {
            resolve();
            return;
          }
          // Fallback to online stream if synthesis encounters error
          playOnline();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback
      }
    }

    // Secondary fallback: Online Audio TTS stream
    playOnline();
  });
}

// Stop any current playing speech
export function stopSpeech(): void {
  if (typeof window !== "undefined") {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
  }
}
