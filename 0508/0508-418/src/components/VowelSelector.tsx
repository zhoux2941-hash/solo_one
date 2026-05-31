import { ChevronDown } from 'lucide-react';
import { VOWELS } from '@/data/vowels';
import { useAppStore } from '@/store/useAppStore';

export const VowelSelector = () => {
  const { selectedVowelId, setSelectedVowelId } = useAppStore();

  const selectedVowel = VOWELS.find((v) => v.id === selectedVowelId);

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-slate-400 mb-2">
        选择元音音素
      </label>
      <div className="relative">
        <select
          value={selectedVowelId}
          onChange={(e) => setSelectedVowelId(e.target.value)}
          className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-white py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 hover:border-slate-600 cursor-pointer text-lg"
        >
          {VOWELS.map((vowel) => (
            <option key={vowel.id} value={vowel.id} className="bg-slate-800">
              [{vowel.ipa}] — {vowel.exampleWord}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-sky-400 transition-colors">
          <ChevronDown size={20} className="transition-transform duration-300 group-hover:translate-y-0.5" />
        </div>
      </div>
      {selectedVowel && (
        <div className="mt-3 text-center">
          <span
            className="text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {selectedVowel.ipa}
          </span>
        </div>
      )}
    </div>
  );
};
