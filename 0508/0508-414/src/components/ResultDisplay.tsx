import React from 'react';
import { Download, MessageSquare, CheckCircle } from 'lucide-react';

interface ResultDisplayProps {
  type: 'encode' | 'decode' | null;
  encodedImageUrl?: string;
  decodedMessage?: string;
  onDownload: () => void;
}

export default function ResultDisplay({ type, encodedImageUrl, decodedMessage, onDownload }: ResultDisplayProps) {
  if (!type) return null;

  return (
    <div className="glass rounded-2xl p-6 card-hover animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-slate-100">
          {type === 'encode' ? '编码完成' : '解码完成'}
        </h3>
      </div>

      {type === 'encode' && encodedImageUrl && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-accent-500/30">
            <img
              src={encodedImageUrl}
              alt="Encoded"
              className="w-full max-h-64 object-contain bg-slate-900/50"
            />
          </div>
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-medium transition-all duration-200 btn-glow"
          >
            <Download className="w-5 h-5" />
            下载隐写图片
          </button>
        </div>
      )}

      {type === 'decode' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-medium text-slate-300">提取的消息</span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-200 whitespace-pre-wrap break-all font-mono text-sm">
              {decodedMessage || '未检测到隐藏消息'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
