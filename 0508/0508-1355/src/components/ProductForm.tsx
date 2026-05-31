import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

export function ProductForm() {
  const { addProduct } = useProducts();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !unit.trim()) {
      setMessage({ type: 'error', text: '请填写完整的商品信息' });
      return;
    }

    const result = await addProduct({ 
      name: name.trim(), 
      category: category.trim(), 
      unit: unit.trim() 
    });
    
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setName('');
      setCategory('');
      setUnit('');
    }

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Package className="h-6 w-6 text-green-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          添加商品
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            placeholder="请输入商品名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品分类 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            placeholder="如：食品、日用品、电子产品"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            计量单位 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            placeholder="如：个、箱、件、千克"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-green-700 hover:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>添加商品</span>
        </button>
      </form>
    </div>
  );
}
