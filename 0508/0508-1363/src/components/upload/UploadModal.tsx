import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { vcardParser } from '../../utils/vcardParser';
import { useContactStore } from '../../store/contactStore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadResult {
  filename: string;
  success: boolean;
  count?: number;
  error?: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const addContacts = useContactStore(state => state.addContacts);

  const processFile = async (file: File): Promise<UploadResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const contacts = vcardParser.parse(content);
          
          if (contacts.length === 0) {
            resolve({
              filename: file.name,
              success: false,
              error: '未找到有效联系人数据',
            });
            return;
          }

          addContacts(contacts, true);
          
          resolve({
            filename: file.name,
            success: true,
            count: contacts.length,
          });
        } catch (error) {
          resolve({
            filename: file.name,
            success: false,
            error: '解析文件失败',
          });
        }
      };

      reader.onerror = () => {
        resolve({
          filename: file.name,
          success: false,
          error: '读取文件失败',
        });
      };

      reader.readAsText(file);
    });
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    setResults([]);

    const vcfFiles = Array.from(files).filter(f => 
      f.name.toLowerCase().endsWith('.vcf') || f.name.toLowerCase().endsWith('.vcard')
    );

    if (vcfFiles.length === 0) {
      setResults([{
        filename: '',
        success: false,
        error: '请选择 .vcf 或 .vcard 文件',
      }]);
      setIsProcessing(false);
      return;
    }

    const newResults: UploadResult[] = [];
    
    for (const file of vcfFiles) {
      const result = await processFile(file);
      newResults.push(result);
    }

    setResults(newResults);
    setIsProcessing(false);
  }, [addContacts]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleClose = () => {
    setResults([]);
    onClose();
  };

  const totalImported = results.filter(r => r.success).reduce((acc, r) => acc + (r.count || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="导入 vCard 文件" size="lg">
      <div className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
            }
          `}
        >
          <input
            type="file"
            multiple
            accept=".vcf,.vcard"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
            <p className="text-slate-700 font-medium mb-1">
              拖拽文件到此处或点击选择
            </p>
            <p className="text-sm text-slate-500">
              支持 .vcf 和 .vcard 格式，可多选
            </p>
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center gap-3 py-4">
            <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-slate-600">正在处理文件...</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">处理结果</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {result.filename || '错误'}
                    </p>
                    <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success 
                        ? `成功导入 ${result.count} 个联系人`
                        : result.error
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {totalImported > 0 && (
              <div className="p-4 bg-primary-50 rounded-lg text-center">
                <p className="text-primary-700">
                  共导入 <span className="font-bold">{totalImported}</span> 个联系人
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            {results.length > 0 ? '完成' : '取消'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
