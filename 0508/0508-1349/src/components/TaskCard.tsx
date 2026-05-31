import { useState, useRef, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Task } from '../types';
import { useTasksStore } from '../store/useTasksStore';
import { cn } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  animationDelay: number;
}

export const TaskCard = ({ task, index, animationDelay }: TaskCardProps) => {
  const { updateTaskContent, toggleTaskComplete } = useTasksStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEditValue(task.content);
  }, [task.content, task.id]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const debouncedSave = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateTaskContent(index, value);
      }, 500);
    },
    [index, updateTaskContent]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditValue(value);
    debouncedSave(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (editValue !== task.content) {
      updateTaskContent(index, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditValue(task.content);
      setIsEditing(false);
    }
  };

  const handleToggleComplete = () => {
    toggleTaskComplete(index);
  };

  const handleStartEditing = () => {
    if (!task.completed) {
      setIsEditing(true);
    }
  };

  const placeholder = ['第一件事...', '第二件事...', '第三件事...'][index];

  return (
    <div
      className={cn(
        'group flex items-start gap-4 p-5 bg-white rounded-2xl border border-cream-200',
        'shadow-sm hover:shadow-md transition-all duration-300',
        'opacity-0 animate-fade-in-up',
        task.completed && 'bg-cream-50'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <button
        onClick={handleToggleComplete}
        className={cn(
          'flex-shrink-0 w-7 h-7 mt-0.5 rounded-full border-2 transition-all duration-300',
          'flex items-center justify-center',
          task.completed
            ? 'bg-mint-500 border-mint-500'
            : 'border-ink-600/30 hover:border-mint-400'
        )}
        aria-label={task.completed ? '标记为未完成' : '标记为完成'}
      >
        <Check
          className={cn(
            'w-4 h-4 text-white transition-all duration-300',
            task.completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )}
        />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleContentChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full min-h-[60px] p-0 font-sans text-lg leading-relaxed',
              'bg-transparent border-none outline-none resize-none',
              'text-ink-800 placeholder:text-ink-600/30'
            )}
            rows={2}
          />
        ) : (
          <div
            onClick={handleStartEditing}
            className={cn(
              'min-h-[60px] cursor-text font-sans text-lg leading-relaxed',
              'transition-all duration-300',
              task.completed
                ? 'text-ink-600/50 line-through'
                : task.content
                ? 'text-ink-800'
                : 'text-ink-600/30'
            )}
          >
            {task.content || placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
