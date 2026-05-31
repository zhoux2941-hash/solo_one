import { Phone, Mail, User, Settings, Check, Merge } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useContactStore } from '../../store/contactStore';
import { contactDeduplicator } from '../../utils/deduplicator';
import { DedupStrategy } from '../../types/contact';

interface DedupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const strategies: { value: DedupStrategy; icon: React.ReactNode; label: string; description: string }[] = [
  {
    value: 'phone-first',
    icon: <Phone className="w-5 h-5" />,
    label: '电话优先',
    description: '先按电话号码匹配重复项，再按邮箱匹配',
  },
  {
    value: 'email-first',
    icon: <Mail className="w-5 h-5" />,
    label: '邮箱优先',
    description: '先按邮箱地址匹配重复项，再按电话匹配',
  },
  {
    value: 'richest-first',
    icon: <User className="w-5 h-5" />,
    label: '保留信息最全者',
    description: '匹配所有条件，合并时采用信息最完整的联系人作为基础',
  },
];

export default function DedupSettingsModal({ isOpen, onClose }: DedupSettingsModalProps) {
  const { dedupConfig, setDedupConfig, duplicateGroups, mergeAllDuplicates, deduplicateAll, contacts } = useContactStore();

  const handleMergeAll = () => {
    if (confirm(`确定要合并所有 ${duplicateGroups.length} 组重复联系人吗？`)) {
      mergeAllDuplicates();
      onClose();
    }
  };

  const handleDeduplicateAll = () => {
    if (confirm('确定要对所有联系人执行去重吗？这将自动合并所有检测到的重复项。')) {
      deduplicateAll();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="去重设置" size="lg">
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            匹配规则
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {strategies.map((strategy) => (
              <button
                key={strategy.value}
                onClick={() => setDedupConfig({ strategy: strategy.value })}
                className={`
                  flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left
                  ${dedupConfig.strategy === strategy.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                  ${dedupConfig.strategy === strategy.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                  }
                `}>
                  {strategy.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{strategy.label}</span>
                    {dedupConfig.strategy === strategy.value && (
                      <Check className="w-5 h-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{strategy.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">检测条件</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={dedupConfig.checkPhone}
                onChange={(e) => setDedupConfig({ checkPhone: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">电话号码匹配</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={dedupConfig.checkEmail}
                onChange={(e) => setDedupConfig({ checkEmail: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">邮箱地址匹配</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={dedupConfig.checkNameOrg}
                onChange={(e) => setDedupConfig({ checkNameOrg: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">姓名 + 组织匹配</span>
            </label>
          </div>
        </div>

        {duplicateGroups.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="font-medium text-amber-800">
                检测到 {duplicateGroups.length} 组重复联系人
              </span>
            </div>
            <p className="text-sm text-amber-700">
              当前策略：{contactDeduplicator.getStrategyLabel(dedupConfig.strategy)}
            </p>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
            <Button 
              variant="accent" 
              onClick={handleDeduplicateAll}
              className="w-full"
            >
              <Merge className="w-4 h-4" />
              自动去重所有联系人
            </Button>
            {duplicateGroups.length > 0 && (
              <Button 
                variant="primary" 
                onClick={handleMergeAll}
                className="w-full"
              >
                <Merge className="w-4 h-4" />
                合并 {duplicateGroups.length} 组重复项
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            完成
          </Button>
        </div>
      </div>
    </Modal>
  );
}
