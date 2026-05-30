import { useState } from 'react'
import DynastyTimeline from '@/components/DynastyTimeline'
import ComparisonTable from '@/components/ComparisonTable'
import ComparisonChart from '@/components/ComparisonChart'
import type { DynastyName, UnitCategory } from '@/types'
import { cn } from '@/lib/utils'

export default function Home() {
  const [selectedDynasty, setSelectedDynasty] = useState<DynastyName>('汉')
  const [category, setCategory] = useState<UnitCategory>('length')

  return (
    <div className="min-h-screen bg-ink">
      <section
        className={cn(
          'relative pt-20 pb-16 px-4 overflow-hidden',
          'bg-gradient-to-b from-ink-light via-ink to-ink'
        )}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(194, 54, 22, 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(45, 106, 79, 0.15) 0%, transparent 50%)`,
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <h1
            className={cn(
              'font-title text-6xl md:text-7xl lg:text-8xl tracking-widest',
              'text-parchment mb-4 animate-fade-in text-shadow-ink'
            )}
          >
            历代度量衡对照
          </h1>

          <p
            className={cn(
              'font-body text-lg md:text-xl text-parchment/60',
              'tracking-wider mb-8 animate-slide-up',
              'max-w-2xl mx-auto'
            )}
          >
            探索从周到清三千年间，中国古代度量衡制度的演变与传承
          </p>

          <div className="cloud-divider animate-fade-in" style={{ animationDelay: '0.3s' }} />
        </div>
      </section>

      <section className="px-4 py-8 bg-ink">
        <div className="max-w-6xl mx-auto">
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <DynastyTimeline
              selectedDynasty={selectedDynasty}
              onSelectDynasty={setSelectedDynasty}
            />
          </div>
        </div>
      </section>

      <div className="cloud-divider max-w-4xl mx-auto" />

      <section className="px-4 py-8 bg-ink">
        <div className="max-w-6xl mx-auto">
          <div
            className="animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            <ComparisonTable
              category={category}
              selectedDynasty={selectedDynasty}
              onCategoryChange={setCategory}
            />
          </div>
        </div>
      </section>

      <div className="cloud-divider max-w-4xl mx-auto" />

      <section className="px-4 py-8 bg-ink">
        <div className="max-w-6xl mx-auto">
          <div
            className="animate-slide-up"
            style={{ animationDelay: '0.6s' }}
          >
            <ComparisonChart
              category={category}
              selectedDynasty={selectedDynasty}
            />
          </div>
        </div>
      </section>

      <div className="cloud-divider max-w-4xl mx-auto" />

      <section className="px-4 py-12 bg-ink">
        <div className="max-w-4xl mx-auto">
          <div
            className="parchment-card-solid p-8 animate-slide-up"
            style={{ animationDelay: '0.7s' }}
          >
            <h2 className="section-title text-center mb-6">
              度量衡的历史渊源
            </h2>

            <div className="space-y-4 font-body text-parchment/80 leading-relaxed">
              <p>
                中国古代度量衡制度源远流长，自商周时期已初具雏形。秦始皇统一六国后，
                推行"一法度衡石丈尺"，奠定了中国两千多年度量衡制度的基础。
              </p>

              <p>
                度量衡分别指长度、容量和重量三个方面的计量标准。度为长度单位，
                如尺、寸、丈；量为容量单位，如升、斗、斛；衡为重量单位，如斤、两、铢。
                这些单位不仅是经济活动的基础，更与礼制、法律、科技发展密切相关。
              </p>

              <p>
                历代度量衡单位的实际数值多有变化，总体呈现逐渐增大的趋势。
                例如，汉代一尺约合今23.1厘米，而清代一尺已达32厘米。这种变化反映了
                社会经济发展、赋税制度演变以及度量衡管理的历史轨迹。
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 bg-ink border-t border-parchment/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-body text-parchment/40 text-sm">
            中国古代度量衡 · 传承三千年的计量智慧
          </p>
        </div>
      </footer>
    </div>
  )
}
