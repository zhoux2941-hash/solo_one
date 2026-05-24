import React, { useState } from 'react';
import { X, Save, FileText, Clock, Calendar } from 'lucide-react';

interface SaveVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, type: 'manual' | 'nightly' | 'auto') => void;
}

export const SaveVersionDialog: React.FC<SaveVersionDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'manual' | 'nightly' | 'auto'>('manual');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), type);
    setName('');
    setDescription('');
    setType('manual');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-bold text-lg text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            保存版本
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">版本名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：白班值班图_05-24"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">版本类型</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setType('manual')}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                  type === 'manual'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <FileText size={18} />
                <span className="text-xs">手动保存</span>
              </button>
              <button
                onClick={() => setType('nightly')}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                  type === 'nightly'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Clock size={18} />
                <span className="text-xs">夜班快照</span>
              </button>
              <button
                onClick={() => setType('auto')}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                  type === 'auto'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Calendar size={18} />
                <span className="text-xs">自动归档</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">备注说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选：添加版本备注..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            保存版本
          </button>
        </div>
      </div>
    </div>
  );
};
