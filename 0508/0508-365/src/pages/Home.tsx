import { Header } from '@/components/Header';
import { TextConverter } from '@/components/TextConverter';
import { FileToBase64 } from '@/components/FileToBase64';
import { Base64ToImage } from '@/components/Base64ToImage';
import { HexConverter } from '@/components/HexConverter';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="relative">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0">
              <TextConverter />
            </div>
            <div className="animate-[fadeInUp_0.6s_ease-out_0.1s_forwards] opacity-0">
              <HexConverter />
            </div>
            <div className="animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] opacity-0">
              <FileToBase64 />
            </div>
            <div className="animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] opacity-0 lg:col-span-2 xl:col-span-3">
              <Base64ToImage />
            </div>
          </div>

          <footer className="mt-16 text-center text-slate-500 text-sm">
            <p>所有转换均在浏览器本地完成，您的数据不会上传到任何服务器</p>
            <p className="mt-2">使用 FileReader、btoa/atob、TextEncoder/TextDecoder API 构建</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
