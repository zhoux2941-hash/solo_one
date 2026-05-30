import React, { useState } from 'react'
import { useChariotStore } from '@/store/useChariotStore'
import { Check, X } from 'lucide-react'

interface DropZone {
  targetType: string
  label: string
  placedPartId: string | null
  isCorrect: boolean | null
}

interface DragState {
  isDragging: boolean
  partId: string | null
}

const HarnessDragDrop: React.FC = () => {
  const { harnessParts, setPlacements, calculate } = useChariotStore()

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    partId: null,
  })

  const [dropZones, setDropZones] = useState<DropZone[]>([
    { targetType: 'neck', label: '马颈/胸部', placedPartId: null, isCorrect: null },
    { targetType: 'shoulder', label: '马肩部', placedPartId: null, isCorrect: null },
    { targetType: 'flank', label: '轭两侧', placedPartId: null, isCorrect: null },
    { targetType: 'head', label: '马头部', placedPartId: null, isCorrect: null },
  ])

  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const partIcons: Record<string, string> = {
    belt: '⚙',
    yoke: '◈',
    trace: '〰',
    bridle: '☍',
  }

  const handleDragStart = (e: React.DragEvent, partId: string) => {
    e.dataTransfer.setData('partId', partId)
    setDragState({ isDragging: true, partId })
  }

  const handleDragEnd = () => {
    setDragState({ isDragging: false, partId: null })
    setHoveredZone(null)
  }

  const handleDragOver = (e: React.DragEvent, targetType: string) => {
    e.preventDefault()
    setHoveredZone(targetType)
  }

  const handleDragLeave = () => {
    setHoveredZone(null)
  }

  const handleDrop = (e: React.DragEvent, targetType: string) => {
    e.preventDefault()
    setHoveredZone(null)
    setDragState({ isDragging: false, partId: null })

    const partId = e.dataTransfer.getData('partId')
    if (!partId) return

    const part = harnessParts.find(p => p.id === partId)
    if (!part) return

    const isCorrect = part.targetType === targetType

    setDropZones(prev => {
      const newZones = prev.map(zone => {
        if (zone.targetType === targetType) {
          return { ...zone, placedPartId: partId, isCorrect }
        }
        if (zone.placedPartId === partId) {
          return { ...zone, placedPartId: null, isCorrect: null }
        }
        return zone
      })

      const allPlaced = newZones.filter(z => z.placedPartId).length === 4
      const allCorrect = newZones.every(z => z.isCorrect)

      if (allPlaced) {
        const placements = newZones.map(zone => ({
          partId: zone.placedPartId!,
          correct: zone.isCorrect!,
        }))
        setPlacements(placements)
        if (allCorrect) {
          setTimeout(() => calculate(), 500)
        }
      }

      return newZones
    })
  }

  const isPartPlaced = (partId: string) => {
    return dropZones.some(zone => zone.placedPartId === partId)
  }

  return (
    <div className="bg-[#1E1E32] rounded-xl p-4">
      <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-lg mb-3">挽具部件拖拽匹配</h3>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <p className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/60 mb-2">可用部件</p>
          <div className="grid grid-cols-4 gap-2">
            {harnessParts.map((part) => {
              const placed = isPartPlaced(part.id)
              return (
                <div
                  key={part.id}
                  draggable={!placed}
                  onDragStart={(e) => handleDragStart(e, part.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-[#2A2A3E] rounded-lg p-3 text-center cursor-grab active:cursor-grabbing transition-all duration-200 border-2 ${
                    placed
                      ? 'opacity-40 cursor-not-allowed border-transparent'
                      : dragState.isDragging && dragState.partId === part.id
                      ? 'opacity-50 border-[#B87333]'
                      : 'border-transparent hover:border-[#B87333]/50 hover:bg-[#2A2A3E]/80'
                  }`}
                >
                  <div className="text-2xl mb-1">{partIcons[part.id] || '⚙'}</div>
                  <div className="font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">{part.name}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1">
          <p className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/60 mb-2">目标位置</p>
          <div className="grid grid-cols-4 gap-2">
            {dropZones.map((zone) => {
              const placedPart = zone.placedPartId
                ? harnessParts.find(p => p.id === zone.placedPartId)
                : null

              return (
                <div
                  key={zone.targetType}
                  onDragOver={(e) => handleDragOver(e, zone.targetType)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone.targetType)}
                  className={`min-h-[80px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 ${
                    zone.isCorrect === true
                      ? 'bg-[#4A7C59]/20 border-[#4A7C59]'
                      : zone.isCorrect === false
                      ? 'bg-[#C73E1A]/20 border-[#C73E1A] animate-pulse'
                      : hoveredZone === zone.targetType
                      ? 'bg-[#B87333]/10 border-[#B87333]'
                      : 'bg-[#2A2A3E] border-[#B87333]/40'
                  }`}
                >
                  <div className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/70 text-center mb-2">
                    {zone.label}
                  </div>
                  {placedPart && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xl">{partIcons[placedPart.id] || '⚙'}</div>
                      <div className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]">
                        {placedPart.name}
                      </div>
                      {zone.isCorrect !== null && (
                        <div className="mt-1">
                          {zone.isCorrect ? (
                            <Check size={16} className="text-[#4A7C59]" />
                          ) : (
                            <X size={16} className="text-[#C73E1A]" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/50 mt-3 text-center">
        拖拽左侧部件到右侧对应位置，全部正确匹配后将自动进行力学模拟计算
      </p>
    </div>
  )
}

export default HarnessDragDrop
