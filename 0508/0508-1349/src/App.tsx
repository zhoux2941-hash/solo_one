import { DateNavigator } from './components/DateNavigator';
import { TaskList } from './components/TaskList';
import { WeeklyStats } from './components/WeeklyStats';
import { useTasksStore } from './store/useTasksStore';

function App() {
  const isInitialized = useTasksStore((state) => state.isInitialized);
  const isLoading = useTasksStore((state) => state.isLoading);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-600 font-sans">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 font-sans">
      <div className="flex flex-col min-h-screen max-w-xl mx-auto px-4 pt-10 pb-0">
        <header className="text-center mb-6">
          <h2 className="text-sm tracking-widest text-warm-500 uppercase font-medium">
            每日三件事
          </h2>
          <p className="text-ink-600 text-sm mt-1">
            专注最重要的事，每天进步一点点
          </p>
        </header>

        <DateNavigator />

        <main className="flex-1 pb-8">
          <TaskList />
        </main>

        <footer className="sticky bottom-0 -mx-4">
          <WeeklyStats />
        </footer>
      </div>
    </div>
  );
}

export default App;
