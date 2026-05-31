import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { LOW_STOCK_THRESHOLD } from '@/types';

export function InventoryTable() {
  const { inventory, loading } = useInventory();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpand = (productId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const lowStockCount = inventory.filter(item => item.isLowStock).length;
  const totalProducts = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-purple-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            库存列表
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-purple-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            库存列表
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-gray-600">
            <Package className="h-4 w-4" />
            <span>商品种类: <strong>{totalProducts}</strong></span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <BarChart3 className="h-4 w-4" />
            <span>总库存: <strong>{totalQuantity}</strong></span>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center space-x-1 text-red-600 bg-red-50 px-3 py-1 rounded-full animate-pulse-slow">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">预警: {lowStockCount} 种</span>
            </div>
          )}
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">暂无库存数据</p>
          <p className="text-sm mt-1">请先添加商品并进行入库操作</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-10"></th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">商品名称</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">分类</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">单位</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">总数量</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">批次</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <>
                  <tr
                    key={item.product.id}
                    className={`border-b border-gray-100 transition-all duration-300 cursor-pointer hover:bg-gray-50 ${
                      item.isLowStock ? 'bg-red-50/50 low-stock-row' : ''
                    }`}
                    onClick={() => toggleExpand(item.product.id!)}
                  >
                    <td className="py-3 px-4">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        {expandedRows.has(item.product.id!) ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{item.product.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.product.category}</td>
                    <td className="py-3 px-4 text-gray-600">{item.product.unit}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold text-lg ${
                      item.isLowStock ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {item.totalQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {item.batches.length}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>库存不足</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedRows.has(item.product.id!) && item.batches.length > 0 && (
                    <tr className="bg-gray-50/80">
                      <td colSpan={7} className="py-0">
                        <div className="px-8 py-4 overflow-hidden transition-all duration-300">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">批次明细</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 text-gray-600 font-medium">批次号</th>
                                  <th className="text-left py-2 px-3 text-gray-600 font-medium">数量</th>
                                  <th className="text-left py-2 px-3 text-gray-600 font-medium">生产日期</th>
                                  <th className="text-left py-2 px-3 text-gray-600 font-medium">入库时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.batches.map((batch, idx) => (
                                  <tr key={batch.id} className="border-b border-gray-100 last:border-0 hover:bg-white/50">
                                    <td className="py-2 px-3 font-mono text-gray-700">{batch.batchNumber}</td>
                                    <td className="py-2 px-3 text-gray-700">
                                      {batch.quantity.toLocaleString()} {item.product.unit}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">{batch.productionDate}</td>
                                    <td className="py-2 px-3 text-gray-500 text-xs">{batch.inboundTime}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedRows.has(item.product.id!) && item.batches.length === 0 && (
                    <tr className="bg-gray-50/80">
                      <td colSpan={7} className="py-0">
                        <div className="px-8 py-4 text-center text-gray-500 text-sm">
                          暂无批次数据，请先进行入库操作
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>低库存阈值: {LOW_STOCK_THRESHOLD} 个单位</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300"></span>
          <span>低库存预警</span>
        </div>
      </div>
    </div>
  );
}
