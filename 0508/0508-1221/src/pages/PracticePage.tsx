import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import GoBoard from '@/components/GoBoard';
import ProblemInfo from '@/components/ProblemInfo';
import GameControls from '@/components/GameControls';
import StatsPanel from '@/components/StatsPanel';
import ProblemList from '@/components/ProblemList';
import { ArrowLeft } from 'lucide-react';

export default function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setCurrentProblem = useGameStore(state => state.setCurrentProblem);
  const currentProblem = useGameStore(state => state.currentProblem);

  useEffect(() => {
    if (id) {
      setCurrentProblem(id);
    }
  }, [id, setCurrentProblem]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white text-shadow-sm">
                围棋死活题练习
              </h1>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 h-[600px] hidden lg:block">
            <ProblemList />
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="flex items-start justify-center">
                <GoBoard size={520} />
              </div>

              <div className="space-y-4">
                <ProblemInfo />
                <StatsPanel />
                <GameControls />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
