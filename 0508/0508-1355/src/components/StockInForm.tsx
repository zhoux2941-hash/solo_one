import { useState, useEffect } from 'react';
import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { generateBatchNumber, formatDate } from '@/utils/helpers';

export function StockInForm() {
  const { products, loadProducts } = useProducts();
  const { stockIn, loadInventory } = useInventory();
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [productionDate, setProductionDate] = useState(formatDate(new Date()));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setBatchNumber(generateBatchNumber());
  }, []);

  const handleRefreshBatch = () => {
    setBatchNumber(generateBatchNumber());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !quantity || !batchNumber || !productionDate) {
      setMessage({ type: 'error', text: '请填写完整的入库信息' });
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage({ type: 'error', text: '请输入有效的数量' });
      return;
    }

    const result = await stockIn({
      productId: parseInt(productId),
      quantity: qty,
      batchNumber: batchNumber.trim(),
      productionDate,
    });

    setMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setProductId('');
      setQuantity('');
      setBatchNumber(generateBatchNumber());
      setProductionDate(formatDate(new Date()));
      loadProducts();
      loadInventory();
    }

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <ArrowDownToLine className="h-6 w-6 text-emerald-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          商品入库
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择商品 <span className="text-red-500">*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">请选择商品</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            入库数量 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            placeholder="请输入入库数量"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            批次号 <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 font-mono"
              placeholder="自动生成或手动输入"
            />
            <button
              type="button"
              onClick={handleRefreshBatch}
              className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
              title="重新生成批次号"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            生产日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
        >
          <ArrowDownToLine className="h-5 w-5" />
          <span>确认入库</span>
        </button>
      </form>
    </div>
  );
}
