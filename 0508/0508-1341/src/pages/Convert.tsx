import UnitConverter from '@/components/UnitConverter'
import { BookOpen, Compass, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const infoCards = [
  {
    icon: Compass,
    title: '三步完成换算',
    content: '输入数值、选择单位与源朝代、勾选目标朝代，即可获得各朝代对应数值及现代公制换算结果。'
  },
  {
    icon: BookOpen,
    title: '单位名称释义',
    content: '长度单位有尺、寸、丈；容量单位有升、斗、斛；重量单位有斤、两、铢。各朝代单位实际数值有所差异。'
  },
  {
    icon: Sparkles,
    title: '实用小技巧',
    content: '点击收藏按钮可保存常用换算结果，便于日后查阅。支持多朝代同时对比，直观展现度量衡演变脉络。'
  }
]

const unitExplanations = [
  {
    category: '长度',
    units: [
      { name: '尺', description: '基本长度单位，约合现代20-35厘米' },
      { name: '寸', description: '十分之一尺，约合现代2-3.5厘米' },
      { name: '丈', description: '十尺，约合现代2-3.5米' }
    ]
  },
  {
    category: '容量',
    units: [
      { name: '升', description: '基本容量单位，约合现代200-1000毫升' },
      { name: '斗', description: '十升，约合现代2-10升' },
      { name: '斛', description: '十斗（后改为五斗），约合现代20-50升' }
    ]
  },
  {
    category: '重量',
    units: [
      { name: '斤', description: '基本重量单位，约合现代220-600克' },
      { name: '两', description: '十六分之一斤，约合现代14-37克' },
      { name: '铢', description: '二十四分之一两，约合现代0.6-1.5克' }
    ]
  }
]

export default function Convert() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <section className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-cinnabar text-2xl">◆</span>
            <h1 className="font-title text-5xl md:text-6xl text-parchment tracking-widest">
              单位换算
            </h1>
            <span className="text-cinnabar text-2xl">◆</span>
          </div>
          <p className="font-body text-lg text-parchment/70 max-w-2xl mx-auto leading-relaxed">
            跨越三千年时空，探索中国古代度量衡的演变奥秘。
            输入数值，即可将周秦汉唐宋明清各朝代的长度、容量、重量单位
            换算为现代公制度量，并进行跨朝代对比。
          </p>
        </section>

        <div className="cloud-divider" />

        <section className="animate-slide-up animation-delay-100">
          <UnitConverter />
        </section>

        <div className="cloud-divider" />

        <section className="space-y-8 animate-fade-in animation-delay-200">
          <div className="text-center mb-8">
            <h2 className="font-title text-3xl text-parchment tracking-wider mb-3">
              使用指南
            </h2>
            <p className="font-body text-parchment/50">
              掌握换算工具，领略古人智慧
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {infoCards.map(({ icon: Icon, title, content }, index) => (
              <div
                key={index}
                className={cn(
                  'parchment-card p-6 hover:bg-parchment/15 transition-all duration-300',
                  'hover:border-cinnabar/30 hover:shadow-lg hover:shadow-cinnabar/5',
                  'transform hover:-translate-y-1'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-cinnabar/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-cinnabar" />
                </div>
                <h3 className="font-title text-xl text-parchment mb-2">{title}</h3>
                <p className="font-body text-sm text-parchment/60 leading-relaxed">
                  {content}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="cloud-divider" />

        <section className="space-y-8 animate-fade-in animation-delay-300">
          <div className="text-center mb-8">
            <h2 className="font-title text-3xl text-parchment tracking-wider mb-3">
              古制单位详解
            </h2>
            <p className="font-body text-parchment/50">
              了解传统度量衡单位的历史渊源
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {unitExplanations.map((category, catIndex) => (
              <div
                key={catIndex}
                className="parchment-card p-6"
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-parchment/10">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    catIndex === 0 && 'bg-cinnabar',
                    catIndex === 1 && 'bg-bronze',
                    catIndex === 2 && 'bg-gold'
                  )} />
                  <h3 className="font-title text-xl text-parchment">
                    {category.category}单位
                  </h3>
                </div>
                <div className="space-y-4">
                  {category.units.map((unit, unitIndex) => (
                    <div key={unitIndex} className="flex gap-3">
                      <span className={cn(
                        'font-title text-2xl w-10 text-center shrink-0',
                        catIndex === 0 && 'text-cinnabar',
                        catIndex === 1 && 'text-bronze',
                        catIndex === 2 && 'text-gold'
                      )}>
                        {unit.name}
                      </span>
                      <p className="font-body text-sm text-parchment/60 leading-relaxed pt-1">
                        {unit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="cloud-divider" />

        <section className="parchment-card-solid p-8 text-center animate-fade-in animation-delay-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gold text-lg">◇</span>
            <h3 className="font-title text-2xl text-parchment">小知识</h3>
            <span className="text-gold text-lg">◇</span>
          </div>
          <p className="font-body text-parchment/70 max-w-3xl mx-auto leading-relaxed">
            中国度量衡制度历史悠久，最早可追溯至商周时期。秦始皇统一度量衡，
            奠定了中国两千多年度量衡制度的基础。各朝代度量衡数值虽有变化，
            但「尺、寸、丈」「升、斗、斛」「斤、两、铢」的单位体系
            一直沿用至清末民初。了解这些单位，不仅有助于阅读古籍，
            更能深刻理解中国古代社会的经济、科技与文化发展。
          </p>
        </section>

        <footer className="text-center mt-12 pt-8 border-t border-parchment/10">
          <div className="flex items-center justify-center gap-2 text-parchment/30">
            <span className="text-cinnabar/50">◆</span>
            <p className="font-body text-sm">度量衡 · 传承千年的计量智慧</p>
            <span className="text-cinnabar/50">◆</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
