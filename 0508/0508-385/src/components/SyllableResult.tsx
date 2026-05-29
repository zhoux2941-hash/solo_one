import { useState } from 'react';
import { Volume2, Play, Pause, SkipForward } from 'lucide-react';
import type { SyllableResult as SyllableResultType } from '../types';
import { speak, speakWithSyllables, stopSpeech, isSpeechSupported } from '../utils/pronunciation';

interface SyllableResultProps {
  result: SyllableResultType;
}

export const SyllableResult: React.FC<SyllableResultProps> = ({ result }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSyllable, setActiveSyllable] = useState(-1);
  const [playMode, setPlayMode] = useState<'word' | 'syllables'>('word');

  const handleSpeakWord = () => {
    if (!result.word) return;
    stopSpeech();
    setActiveSyllable(-1);
    setPlayMode('word');
    setIsSpeaking(true);
    speak(result.word);
    setTimeout(() => setIsSpeaking(false), 2000);
  };

  const handleSpeakSyllables = () => {
    if (!result.word || result.syllables.length === 0) return;
    
    if (isSpeaking && playMode === 'syllables') {
      stopSpeech();
      setActiveSyllable(-1);
      setIsSpeaking(false);
      return;
    }
    
    stopSpeech();
    setPlayMode('syllables');
    setIsSpeaking(true);
    
    speakWithSyllables(
      result.syllables,
      (index) => setActiveSyllable(index),
      () => {
        setIsSpeaking(false);
        setTimeout(() => setActiveSyllable(-1), 500);
      }
    );
  };

  if (!result.word) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-bold text-white capitalize">
          {result.word}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakWord}
            disabled={!isSpeechSupported() || (isSpeaking && playMode === 'word')}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              isSpeechSupported()
                ? isSpeaking && playMode === 'word'
                  ? 'bg-blue-500/50 text-blue-200 cursor-not-allowed'
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:scale-110'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={isSpeechSupported() ? '整体发音' : '浏览器不支持语音功能'}
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleSpeakSyllables}
            disabled={!isSpeechSupported() || result.syllables.length <= 1}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              isSpeechSupported() && result.syllables.length > 1
                ? isSpeaking && playMode === 'syllables'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 hover:bg-gradient-to-r from-green-500/30 to-green-600/30 hover:scale-110'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={isSpeechSupported() && result.syllables.length > 1 ? '逐音节播放' : '需要多个音节才能使用'}
          >
            {isSpeaking && playMode === 'syllables' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {result.ipa && (
        <div className="mb-4">
          <span className="text-sm text-gray-400">音标 (IPA)</span>
          <p className="text-lg text-blue-300 font-mono">{result.ipa}</p>
        </div>
      )}

      <div className="mb-4">
        <span className="text-sm text-gray-400">音节切分</span>
        <p className="text-xl text-white font-medium tracking-wider">
          {result.syllableDisplay}
        </p>
      </div>

      <div>
        <span className="text-sm text-gray-400">重音标记</span>
        <p className="text-xl text-green-300 font-medium tracking-wider">
          {result.stressedDisplay}
          <span className="ml-2 text-xs text-gray-400">
            (重音在第 {result.stressIndex + 1} 音节)
          </span>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {result.syllables.map((syllable, index) => (
          <div key={index} className="flex items-center">
            <span
              className={`relative px-4 py-2 rounded-full text-lg font-medium transition-all duration-300 ${
                index === activeSyllable
                  ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg shadow-green-500/50 scale-110 animate-pulse'
                  : index === result.stressIndex
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                  : 'bg-white/10 text-gray-300'
              }`}
            >
              {index === result.stressIndex && 'ˈ'}{syllable}
              {index === activeSyllable && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              )}
            </span>
            {index < result.syllables.length - 1 && (
              <span className="mx-1 text-gray-500 text-xl font-bold">·</span>
            )}
          </div>
        ))}
      </div>

      {result.syllables.length > 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>播放模式:</span>
            <div className="flex gap-1">
              <button
                onClick={() => !isSpeaking && setPlayMode('word')}
                className={`px-3 py-1 rounded-full transition-all duration-300 ${
                  playMode === 'word' && !isSpeaking
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                整体
              </button>
              <button
                onClick={() => !isSpeaking && setPlayMode('syllables')}
                className={`px-3 py-1 rounded-full transition-all duration-300 flex items-center gap-1 ${
                  playMode === 'syllables' && !isSpeaking
                    ? 'bg-green-500/30 text-green-300'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                <SkipForward className="h-3 w-3" />
                逐音节
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
