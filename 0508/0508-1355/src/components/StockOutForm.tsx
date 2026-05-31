import { useState } from 'react';
import { ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryBatch } from '@/types';

export function StockOutForm() {
  const { inventory, stockOut } = useInventory();
  const [productId, setProductId] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedProduct = inventory.find(item => item.product.id === parseInt(productId));
  const availableBatches = selectedProduct?.batches.filter(b => b.quantity > 0) ?? [];
  const selectedBatch = availableBatches.find(b => b.batchNumber === batchNumber);

  const handleProductChange = (value: string) => {
    setProductId(value);
    setBatchNumber('');
    setQuantity('');
  };

  const handleBatchChange = (value: string) => {
    setBatchNumber(value);
    setQuantity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !batchNumber || !quantity) {
      setMessage({ type: 'error', text: '请填写完整的出库信息' });
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage({ type: 'error', text: '请输入有效的数量' });
      return;
    }

    if (selectedBatch && qty > selectedBatch.quantity) {
      setMessage({
        type: 'error',
        text: `批次 ${batchNumber} 库存不足，当前批次库存仅 ${selectedBatch.quantity} ${selectedProduct?.product.unit ?? '个'}`,
      });
      return;
    }

    const result = await stockOut({
      productId: parseInt(productId),
      quantity: qty,
      batchNumber,
    });

    setMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setProductId('');
      setBatchNumber('');
      setQuantity('');
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const availableProducts = inventory.filter(item => item.totalQuantity > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <ArrowUpFromLine className="h-6 w-6 text-orange-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          商品出库
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择商品 <span className="text-red-500">*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">请选择商品</option>
            {availableProducts.map((item) => (
              <option key={item.product.id} value={item.product.id}>
                {item.product.name} (总库存: {item.totalQuantity} {item.product.unit})
              </option>
            ))}
          </select>
          {availableProducts.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">暂无可出库商品</p>
          )}
        </div>

        {selectedProduct && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择批次 <span className="text-red-500">*</span>
            </label>
            <select
              value={batchNumber}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">请选择出库批次</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.batchNumber}>
                  {batch.batchNumber} (库存: {batch.quantity} {selectedProduct.product.unit}，生产日期: {batch.productionDate})
                </option>
              ))}
            </select>
            {availableBatches.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">该商品暂无可用批次</p>
            )}
          </div>
        )}

        {selectedBatch && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  批次 {selectedBatch.batchNumber}
                </p>
                <p className="text-amber-700 mt-1">
                  库存：<strong>{selectedBatch.quantity}</strong> {selectedProduct?.product.unit} ·
                  生产日期：{selectedBatch.productionDate} ·
                  入库时间：{selectedBatch.inboundTime}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            出库数量 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={selectedBatch?.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              placeholder="请输入出库数量"
              disabled={!batchNumber}
            />
            {selectedBatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                / {selectedBatch.quantity} {selectedProduct?.product.unit}
              </span>
            )}
          </div>
          {selectedBatch && parseInt(quantity) > selectedBatch.quantity && (
            <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>出库数量超过该批次库存 ({selectedBatch.quantity} {selectedProduct?.product.unit})</span>
            </p>
          )}
        </div>

        {selectedProduct && !selectedBatch && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              总库存：<span className="font-semibold text-gray-800">{selectedProduct.totalQuantity} {selectedProduct.product.unit}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              共 {availableBatches.length} 个批次可供选择
            </p>
          </div>
        )}

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
          disabled={!productId || !batchNumber || !quantity}
          className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:hover:scale-100"
        >
          <ArrowUpFromLine className="h-5 w-5" />
          <span>确认出库</span>
        </button>
      </form>
    </div>
  );
}
