import type { SignWord } from '../types'
import { Play } from 'lucide-react'

interface WordSelectorProps {
  words: SignWord[]
  selectedWord: SignWord | null
  onSelectWord: (word: SignWord) => void
}

export function WordSelector({ words, selectedWord, onSelectWord }: WordSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-600">选择词汇</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {words.map((word) => (
          <button
            key={word.id}
            onClick={() => onSelectWord(word)}
            className={`word-card p-3 rounded-lg border-2 text-left transition-all ${
              selectedWord?.id === word.id
                ? 'selected border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-800">{word.word}</span>
              <Play className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {word.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
