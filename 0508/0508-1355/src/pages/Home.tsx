import { Header } from '@/components/Header';
import { ProductForm } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';
import { StockInForm } from '@/components/StockInForm';
import { StockOutForm } from '@/components/StockOutForm';
import { InventoryTable } from '@/components/InventoryTable';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProductForm />
          <ProductList />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StockInForm />
          <StockOutForm />
        </div>

        <div className="mb-8">
          <InventoryTable />
        </div>

        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200/50">
          <p>仓库进销存管理系统 · 数据本地存储 · 安全可靠</p>
          <p className="mt-1">所有数据保存在浏览器 IndexedDB 中，请勿清除浏览器数据</p>
        </footer>
      </main>
    </div>
  );
}
