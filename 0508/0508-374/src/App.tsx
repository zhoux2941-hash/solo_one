import { useState, useCallback, useMemo } from 'react';
import type { ModeType } from '@/types';
import { Header } from '@/components/Header';
import { InputPanel } from '@/components/InputPanel';
import { OutputPanel } from '@/components/OutputPanel';
import { ControlPanel } from '@/components/ControlPanel';
import { TrainingPanel } from '@/components/TrainingPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { CustomMappingPanel } from '@/components/CustomMappingPanel';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useTraining } from '@/hooks/useTraining';
import { textToMorse, morseToText } from '@/utils/morseCode';

function App() {
  const [mode, setMode] = useState<ModeType>('encode');
  const [inputText, setInputText] = useState('');
  const [wpm, setWpm] = useState(10);
  const [frequency, setFrequency] = useState(800);

  const { play, stop, isPlaying } = useAudioPlayer(wpm, frequency);
  const { state, startNewRound, checkAnswer, resetStats, setPlaying } = useTraining();

  const outputText = useMemo(() => {
    if (mode === 'encode') {
      return textToMorse(inputText);
    } else {
      return morseToText(inputText);
    }
  }, [inputText, mode]);

  const handlePlay = useCallback(() => {
    const textToPlay = mode === 'encode' ? outputText : inputText;
    play(textToPlay);
  }, [mode, outputText, inputText, play]);

  const handleTrainingPlay = useCallback(() => {
    setPlaying(true);
    play(state.currentMorse);
    setTimeout(() => setPlaying(false), 2000);
  }, [state.currentMorse, play, setPlaying]);

  return (
    <div className="min-h-screen bg-morse-bg">
      <Header mode={mode} onModeChange={setMode} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {mode !== 'train' ? (
          <div className="space-y-6">
            <InputPanel
              value={inputText}
              onChange={setInputText}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入摩尔斯电码...'}
              mode={mode}
            />
            
            <OutputPanel
              value={outputText}
              onPlay={handlePlay}
              onStop={stop}
              isPlaying={isPlaying}
              mode={mode}
            />
            
            <ControlPanel
              wpm={wpm}
              onWpmChange={setWpm}
              frequency={frequency}
              onFrequencyChange={setFrequency}
            />
            
            <CustomMappingPanel />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <TrainingPanel
              state={state}
              onStart={startNewRound}
              onAnswer={checkAnswer}
              onPlay={handleTrainingPlay}
              isPlaying={isPlaying}
            />
            
            <div className="space-y-6">
              <StatsPanel
                score={state.score}
                total={state.total}
                correct={state.correct}
                wrong={state.wrong}
                successRate={state.successRate}
                streak={state.streak}
                onReset={resetStats}
              />
              
              <ControlPanel
                wpm={wpm}
                onWpmChange={setWpm}
                frequency={frequency}
                onFrequencyChange={setFrequency}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-morse-primary/10 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-morse-text/50">
            <p>摩尔斯电码工具 - 使用 Web Audio API 实现音频播放</p>
            <p className="mt-1">支持中英文文本与摩尔斯电码互转，以及训练模式</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
