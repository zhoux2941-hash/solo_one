import React, { useState } from 'react';
import { Mail, Trash2, Sparkles } from 'lucide-react';

interface EmailInputProps {
  onClassify: (text: string) => void;
  isLoading: boolean;
}

const exampleEmails = [
  {
    title: '垃圾邮件示例',
    text: 'Congratulations! You have won a free iPhone. Click here to claim your prize now! This is an exclusive limited time offer. Act fast before it expires!'
  },
  {
    title: '正常邮件示例',
    text: 'Dear Team, please find attached the project report for review. Let me know if you have any questions or need further clarification on the implementation details. Thanks!'
  }
];

export const EmailInput: React.FC<EmailInputProps> = ({ onClassify, isLoading }) => {
  const [emailText, setEmailText] = useState('');

  const handleClassify = () => {
    if (emailText.trim()) {
      onClassify(emailText);
    }
  };

  const handleClear = () => {
    setEmailText('');
  };

  const handleExampleClick = (example: typeof exampleEmails[0]) => {
    setEmailText(example.text);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">邮件输入</h2>
          <p className="text-sm text-gray-500">粘贴或输入邮件内容进行分类</p>
        </div>
      </div>

      <textarea
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        placeholder="在此输入邮件内容..."
        className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 placeholder-gray-400"
      />

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-sm text-gray-500 mr-2 self-center">快速示例:</span>
        {exampleEmails.map((example, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(example)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {example.title}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleClassify}
          disabled={!emailText.trim() || isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          {isLoading ? '分析中...' : '开始分类'}
        </button>
        <button
          onClick={handleClear}
          disabled={!emailText.trim()}
          className="flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <Trash2 className="w-5 h-5" />
          清空
        </button>
      </div>
    </div>
  );
};
