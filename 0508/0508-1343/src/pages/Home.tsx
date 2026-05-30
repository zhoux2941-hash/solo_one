import TimelineBar from '@/components/TimelineBar'
import OfficialSelector from '@/components/OfficialSelector'
import SalaryPanel from '@/components/SalaryPanel'
import ModernConverter from '@/components/ModernConverter'
import DynastyCompare from '@/components/DynastyCompare'
import RicePriceCard from '@/components/RicePriceCard'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B6914' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="bg-gradient-to-b from-[#1a1008] via-[#2a1c0e] to-[#3a2818] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10" />
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 relative z-10">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-serif text-amber-100 font-bold tracking-widest mb-2"
              style={{ fontFamily: "'Noto Serif SC', serif" }}>
              历代职官品秩与俸禄购买力对比
            </h1>
            <p className="text-amber-500/50 font-serif text-sm"
              style={{ fontFamily: "'LXGW WenKai', cursive" }}>
              横跨两千年 · 六大朝代 · 以米观薪
            </p>
          </div>

          <TimelineBar />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="sticky top-6">
              <OfficialSelector />
            </div>
          </div>

          <div className="col-span-9 space-y-6">
            <SalaryPanel />

            <div className="grid grid-cols-2 gap-6">
              <ModernConverter />
              <RicePriceCard />
            </div>

            <DynastyCompare />
          </div>
        </div>
      </main>

      <footer className="border-t border-amber-800/15 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-amber-700/30 font-serif">
            数据来源：《汉书》《新唐书》《宋史》《元史》《明史》《清史稿》· 米价折算为估算值，仅供参考
          </p>
        </div>
      </footer>
    </div>
  )
}
