import { Theater } from 'lucide-react';

const Header = () => {
  return (
    <header className="relative py-8 px-6 bg-gradient-to-r from-amber-900 via-red-900 to-amber-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEMyMCAwIDMwIDEwIDIwIDIwQzEwIDMwIDIwIDQwIDIwIDQwQzIwIDQwIDEwIDMwIDIwIDIwQzMwIDEwIDIwIDAgMjAgMFoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PC9zdmc+')]"></div>
      </div>
      <div className="relative max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <Theater className="w-12 h-12 text-yellow-400" strokeWidth={1.5} />
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-100 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
            屯堡地戏面具色彩知识库
          </h1>
          <Theater className="w-12 h-12 text-yellow-400" strokeWidth={1.5} />
        </div>
        <p className="text-yellow-200 text-lg md:text-xl max-w-3xl mx-auto opacity-90">
          探索国家级非物质文化遗产 · 传承六百年大明遗风 · 体验传统面具色彩艺术
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <span className="w-20 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
