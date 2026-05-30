import { useState } from 'react';
import { Calculator, RotateCcw, Eraser } from 'lucide-react';
import type { Operator } from '../types';

interface ControlPanelProps {
  onCalculate: (op1: number, op2: number, operator: Operator) => void;
  onClear: () => void;
  onReset: () => void;
  disabled?: boolean;
  currentExpression?: string;
}

export const ControlPanel = ({ onCalculate, onClear, onReset, disabled, currentExpression }: ControlPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [operand1, setOperand1] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);

  const operators: { op: Operator; label: string }[] = [
    { op: '+', label: '+' },
    { op: '-', label: '-' },
    { op: '×', label: '×' },
    { op: '÷', label: '÷' },
  ];

  const handleNumberClick = (num: string) => {
    if (disabled) return;
    setInputValue(prev => prev + num);
  };

  const handleOperatorClick = (op: Operator) => {
    if (disabled) return;
    if (inputValue === '' && operand1 === null) return;
    
    if (inputValue !== '') {
      const num = parseInt(inputValue, 10);
      if (operand1 === null) {
        setOperand1(num);
      }
      setInputValue('');
    }
    setOperator(op);
  };

  const handleEquals = () => {
    if (disabled) return;
    if (operand1 === null || inputValue === '' || operator === null) return;

    const operand2 = parseInt(inputValue, 10);
    onCalculate(operand1, operand2, operator);
  };

  const handleClear = () => {
    setInputValue('');
    setOperand1(null);
    setOperator(null);
    onClear();
  };

  const handleBackspace = () => {
    if (disabled) return;
    setInputValue(prev => prev.slice(0, -1));
  };

  const displayExpression = currentExpression || (
    operand1 !== null && operator !== null
      ? `${operand1} ${operator} ${inputValue || '?'}`
      : inputValue || '0'
  );

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-stone-800/70 border border-stone-700/50">
      <div className="flex items-center gap-2 mb-3">
      <Calculator className="w-5 h-5 text-amber-400" />
      <h3 className="text-amber-200 font-semibold">运算输入</h3>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-amber-100 font-mono tracking-wider">
          {displayExpression}
        </div>
        <div className="text-sm text-amber-400/70 mt-1">
          {operand1 !== null ? '输入第二个数' : '输入第一个数'}
        </div>
      </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className="aspect-square rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleOperatorClick('÷')}
          disabled={disabled}
          className="aspect-square rounded-xl bg-amber-700/70 hover:bg-amber-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ÷
        </button>

        {[4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className="aspect-square rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleOperatorClick('×')}
          disabled={disabled}
          className="aspect-square rounded-xl bg-amber-700/70 hover:bg-amber-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ×
        </button>

        {[1, 2, 3].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className="aspect-square rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleOperatorClick('-')}
          disabled={disabled}
          className="aspect-square rounded-xl bg-amber-700/70 hover:bg-amber-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          onClick={() => handleNumberClick('0')}
          disabled={disabled}
          className="aspect-square rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={disabled}
          className="aspect-square rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-100 text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <button
          onClick={handleEquals}
          disabled={disabled || operand1 === null || inputValue === '' || operator === null}
          className="aspect-square rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          =
        </button>
        <button
          onClick={() => handleOperatorClick('+')}
          disabled={disabled}
          className="aspect-square rounded-xl bg-amber-700/70 hover:bg-amber-600/70 text-amber-100 text-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 py-3 rounded-xl bg-stone-700/70 hover:bg-stone-600/70 text-amber-200 font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser className="w-4 h-4" />
          清空
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl bg-red-900/50 hover:bg-red-800/50 text-red-200 font-medium flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  );
};
