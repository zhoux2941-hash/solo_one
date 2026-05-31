import { useState } from 'react';
import { UserPlus, Download, Trash2, AlertCircle, Settings } from 'lucide-react';
import Button from '../common/Button';
import { useContactStore } from '../../store/contactStore';
import { vcardExporter } from '../../utils/vcardExporter';
import { csvExporter } from '../../utils/csvExporter';
import UploadModal from '../upload/UploadModal';
import DedupSettingsModal from '../deduplicate/DedupSettingsModal';

export default function Header() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dedupSettingsOpen, setDedupSettingsOpen] = useState(false);
  const { contacts, selectedIds, clearAll, duplicateGroups } = useContactStore();
  const hasSelected = selectedIds.size > 0;

  const exportVCF = () => {
    const toExport = hasSelected 
      ? contacts.filter(c => selectedIds.has(c.id))
      : contacts;
    vcardExporter.download(toExport, `contacts_${Date.now()}.vcf`);
  };

  const exportCSV = () => {
    const toExport = hasSelected 
      ? contacts.filter(c => selectedIds.has(c.id))
      : contacts;
    csvExporter.download(toExport, `contacts_${Date.now()}.csv`);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">
                vCard Manager
              </h1>
              <p className="text-xs text-slate-500">联系人管理系统</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {duplicateGroups.length > 0 && (
              <button
                onClick={() => setDedupSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  发现 {duplicateGroups.length} 组重复联系人
                </span>
              </button>
            )}

            <Button variant="secondary" onClick={() => setUploadOpen(true)}>
              <UserPlus className="w-4 h-4" />
              导入 vCard
            </Button>

            {contacts.length > 0 && (
              <Button variant="secondary" onClick={() => setDedupSettingsOpen(true)}>
                <Settings className="w-4 h-4" />
                去重设置
              </Button>
            )}

            <div className="relative group">
              <Button variant="accent" disabled={contacts.length === 0}>
                <Download className="w-4 h-4" />
                导出
              </Button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={exportVCF}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg"
                >
                  导出为 vCard (.vcf)
                  {hasSelected && <span className="text-xs text-slate-400 ml-1">(已选)</span>}
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 last:rounded-b-lg"
                >
                  导出为 CSV
                  {hasSelected && <span className="text-xs text-slate-400 ml-1">(已选)</span>}
                </button>
              </div>
            </div>

            {contacts.length > 0 && (
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      <DedupSettingsModal 
        isOpen={dedupSettingsOpen} 
        onClose={() => setDedupSettingsOpen(false)} 
      />
    </header>
  );
}
