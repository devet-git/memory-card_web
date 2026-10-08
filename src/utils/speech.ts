// Browser Web Speech API for Text-to-Speech pronunciation
export function speakWord(text: string, preferredLang?: string, rate: number = 0.95): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) return;

    const cleanText = text.trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    // Detect language if not specified:
    // If it has typical Vietnamese diacritics, use vi-VN, else default to en-US for English words
    const hasVietnameseMarks = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(cleanText);
    const lang = preferredLang || (hasVietnameseMarks ? 'vi-VN' : 'en-US');
    utterance.lang = lang;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase().substring(0, 2)));
      if (match) {
        utterance.voice = match;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
