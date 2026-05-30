import { useState } from 'react'
import ArtifactSelector from '@/components/ArtifactSelector'
import ArtifactDetail from '@/components/ArtifactDetail'
import type { Artifact } from '@/types'

export default function ArtifactPage() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)

  function handleSelect(artifact: Artifact) {
    setSelectedArtifact(artifact)
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-cinnabar text-2xl">◆</span>
            <h1 className="font-title text-5xl text-parchment tracking-widest">
              器物尺寸推定
            </h1>
            <span className="text-cinnabar text-2xl">◆</span>
          </div>
          <p className="font-body text-lg text-parchment/60 max-w-2xl mx-auto leading-relaxed">
            依据考古出土文物的实测数据，反向推算其在古代度量衡体系中的尺寸规格。
            选择文物类型，调整尺寸参数，即可查看各朝代的换算结果。
          </p>
        </section>

        <div className="cloud-divider" />

        <section className="mb-10">
          <h2 className="font-title text-2xl text-parchment tracking-wider mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-cinnabar rounded-full" />
            选择器物类型
          </h2>
          <ArtifactSelector
            selectedId={selectedArtifact?.id || null}
            onSelect={handleSelect}
          />
        </section>

        {selectedArtifact ? (
          <div className="animate-fade-in">
            <div className="cloud-divider" />
            <section>
              <ArtifactDetail artifact={selectedArtifact} />
            </section>
          </div>
        ) : (
          <div className="parchment-card p-12 text-center">
            <div className="text-6xl mb-4 opacity-30">📜</div>
            <p className="font-body text-xl text-parchment/40">
              请从上方选择一件器物，开始尺寸推定
            </p>
          </div>
        )}

        <div className="cloud-divider" />

        <section className="parchment-card p-8">
          <h2 className="font-title text-2xl text-parchment tracking-wider mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-bronze rounded-full" />
            关于考古数据
          </h2>
          <div className="space-y-4 font-body text-parchment/70 leading-relaxed">
            <p>
              本工具所采用的文物尺寸数据，来源于历年考古发掘报告中的实测记录。
              每件文物的尺寸范围均基于同类型器物的出土标本统计得出。
            </p>
            <p>
              由于古代度量衡制度在不同朝代、不同时期存在差异，
              同一器物在不同历史背景下可能对应不同的古制尺寸。
              换算结果仅供学术研究参考，不作为断代的唯一依据。
            </p>
            <div className="flex items-start gap-4 pt-4 border-t border-parchment/10">
              <span className="text-gold text-xl">◎</span>
              <p className="text-parchment/50 text-sm">
                数据来源：《中国古代度量衡图集》、《历代度量衡考》及各省市考古研究所发布的正式发掘报告。
                如您发现数据有误或有补充资料，欢迎指正。
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center mt-16 pb-8">
          <div className="flex items-center justify-center gap-2 text-parchment/30 font-body text-sm">
            <span className="text-cinnabar/50">◆</span>
            <span>度量衡 · 器物推定</span>
            <span className="text-cinnabar/50">◆</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
