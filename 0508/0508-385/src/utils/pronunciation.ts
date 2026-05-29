export function speak(word: string): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser');
    return;
  }

  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  utterance.pitch = 1;
  
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    voice => voice.lang.startsWith('en') && voice.name.includes('English')
  ) || voices.find(voice => voice.lang.startsWith('en'));
  
  if (englishVoice) {
    utterance.voice = englishVoice;
  }
  
  utterance.onend = () => {
    console.log('Speech finished');
  };
  
  utterance.onerror = (event) => {
    console.error('Speech error:', event.error);
  };
  
  window.speechSynthesis.speak(utterance);
}

export function speakWithSyllables(
  syllables: string[],
  onSyllableChange: (index: number) => void,
  onComplete: () => void
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser');
    return;
  }

  window.speechSynthesis.cancel();
  
  let currentIndex = -1;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const speakNextSyllable = () => {
    currentIndex++;
    
    if (currentIndex >= syllables.length) {
      onSyllableChange(-1);
      onComplete();
      return;
    }

    onSyllableChange(currentIndex);
    
    const syllable = syllables[currentIndex];
    const utterance = new SpeechSynthesisUtterance(syllable);
    utterance.lang = 'en-US';
    utterance.rate = 0.6;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      voice => voice.lang.startsWith('en') && voice.name.includes('English')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onend = () => {
      timeoutId = setTimeout(speakNextSyllable, 300);
    };
    
    utterance.onerror = () => {
      if (timeoutId) clearTimeout(timeoutId);
      onSyllableChange(-1);
      onComplete();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  speakNextSyllable();
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}
