import { Trash2, Tag } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

export function ProductList() {
  const { products, loading, deleteProduct } = useProducts();

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`确定要删除商品"${name}"吗？删除后相关库存数据也会被清除。`)) {
      await deleteProduct(id);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tag className="h-6 w-6 text-blue-700" />
          </div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            商品列表
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Tag className="h-6 w-6 text-blue-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          商品列表
        </h2>
        <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          共 {products.length} 种
        </span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无商品，请先添加商品</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.category} · 单位：{product.unit}
                </p>
              </div>
              <button
                onClick={() => handleDelete(product.id!, product.name)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="删除商品"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
