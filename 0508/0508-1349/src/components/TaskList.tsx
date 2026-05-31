import { useTasksStore } from '../store/useTasksStore';
import { TaskCard } from './TaskCard';
import { cn } from '../lib/utils';

export const TaskList = () => {
  const { tasks, isLoading, direction } = useTasksStore();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 bg-cream-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-4',
        direction === 'left' && 'animate-[slideInLeft_0.3s_ease-out]',
        direction === 'right' && 'animate-[slideInRight_0.3s_ease-out]'
      )}
    >
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
};
