import React from 'react'
import { useChariotStore } from '@/store/useChariotStore'
import { Download, Gauge, Wind, Compass, Weight, Cog, Activity, Mountain, ArrowDown, FileSpreadsheet } from 'lucide-react'
import { generateCsvReport, downloadCsv } from '@/utils/csvExport'

const ControlPanel: React.FC = () => {
  const {
    chariotTypes,
    harnessTypes,
    terrainTypes,
    selectedChariotType,
    horseCount,
    selectedHarnessType,
    selectedTerrainType,
    calculationResult,
    placements,
    setSelectedChariotType,
    setHorseCount,
    setSelectedHarnessType,
    setSelectedTerrainType,
    setShowPdfModal,
  } = useChariotStore()

  const selectedChariot = chariotTypes.find(c => c.id === selectedChariotType)
  const selectedHarness = harnessTypes.find(h => h.id === selectedHarnessType)
  const selectedTerrain = terrainTypes.find(t => t.id === selectedTerrainType)

  const harnessDescriptions: Record<string, string> = {
    neckband: '以颈带系驾，压迫气管，影响马匹呼吸',
    chestband: '以胸带系驾，受力均匀，马匹呼吸通畅',
  }

  const terrainIcons: Record<string, string> = {
    flat: ' plains',
    slope: ' ridge',
    mud: ' swamp',
  }

  return (
    <div className="bg-[#1E1E32] rounded-xl p-4 h-full overflow-y-auto">
      <h2 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-xl mb-4">战车控制面板</h2>

      <div className="bg-[#2A2A3E] rounded-lg p-3 mb-3">
        <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-2">战车类型</h3>
        <div className="flex gap-2 mb-3">
          {chariotTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedChariotType(type.id)}
              className={`flex-1 py-2 px-3 rounded-lg font-['Noto_Serif_SC'] text-sm transition-all duration-200 ${
                selectedChariotType === type.id
                  ? 'bg-[#B87333] text-[#F5F0E8] shadow-lg'
                  : 'bg-[#1A1A2E] text-[#F5F0E8]/70 hover:bg-[#1A1A2E]/80'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
        {selectedChariot && (
          <div className="grid grid-cols-2 gap-2 text-xs font-['Noto_Serif_SC'] text-[#F5F0E8]/80">
            <div><span className="text-[#B87333]">轮径:</span> {selectedChariot.wheelDiameter}米</div>
            <div><span className="text-[#B87333]">轴距:</span> {selectedChariot.axleDistance}米</div>
            <div><span className="text-[#B87333]">车厢宽:</span> {selectedChariot.carriageWidth}米</div>
            <div><span className="text-[#B87333]">车重:</span> {selectedChariot.weight}公斤</div>
          </div>
        )}
      </div>

      <div className="bg-[#2A2A3E] rounded-lg p-3 mb-3">
        <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-2">马匹数量</h3>
        <div className="flex gap-2">
          {[2, 4].map((count) => (
            <button
              key={count}
              onClick={() => setHorseCount(count)}
              className={`flex-1 py-2 px-3 rounded-lg font-['Noto_Serif_SC'] text-sm transition-all duration-200 ${
                horseCount === count
                  ? 'bg-[#B87333] text-[#F5F0E8] shadow-lg'
                  : 'bg-[#1A1A2E] text-[#F5F0E8]/70 hover:bg-[#1A1A2E]/80'
              }`}
            >
              {count}匹
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#2A2A3E] rounded-lg p-3 mb-3">
        <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-2">系驾方式</h3>
        <div className="flex gap-2 mb-2">
          {harnessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedHarnessType(type.id)}
              className={`flex-1 py-2 px-3 rounded-lg font-['Noto_Serif_SC'] text-sm transition-all duration-200 ${
                selectedHarnessType === type.id
                  ? 'bg-[#B87333] text-[#F5F0E8] shadow-lg'
                  : 'bg-[#1A1A2E] text-[#F5F0E8]/70 hover:bg-[#1A1A2E]/80'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
        <p className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/60">
          {harnessDescriptions[selectedHarnessType]}
        </p>
      </div>

      <div className="bg-[#2A2A3E] rounded-lg p-3 mb-3">
        <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-2 flex items-center gap-1">
          <Mountain size={14} />
          地形
        </h3>
        <div className="flex gap-2 mb-2">
          {terrainTypes.map((terrain) => (
            <button
              key={terrain.id}
              onClick={() => setSelectedTerrainType(terrain.id)}
              className={`flex-1 py-2 px-3 rounded-lg font-['Noto_Serif_SC'] text-sm transition-all duration-200 ${
                selectedTerrainType === terrain.id
                  ? 'bg-[#B87333] text-[#F5F0E8] shadow-lg'
                  : 'bg-[#1A1A2E] text-[#F5F0E8]/70 hover:bg-[#1A1A2E]/80'
              }`}
            >
              {terrain.name}
            </button>
          ))}
        </div>
        {selectedTerrain && (
          <div className="flex items-center justify-between">
            <p className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/60">
              {selectedTerrain.description}
            </p>
            <span className="font-['Noto_Serif_SC'] text-xs text-[#C73E1A]">
              阻力×{selectedTerrain.resistanceCoeff}
            </span>
          </div>
        )}
      </div>

      <div className="bg-[#2A2A3E] rounded-lg p-3 mb-3">
        <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-3">力学参数</h3>
        {calculationResult ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]/80">
                  <Weight size={14} className="text-[#B87333]" />
                  总拉力
                </div>
                <span className="font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                  {calculationResult.totalPullForce.toFixed(1)} kgf
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4A7C59] to-[#B87333] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((calculationResult.totalPullForce / 300) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]/80">
                  <Gauge size={14} className="text-[#B87333]" />
                  有效拉力
                </div>
                <span className="font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                  {calculationResult.effectivePullForce.toFixed(1)} kgf
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4A7C59] to-[#B87333] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((calculationResult.effectivePullForce / 250) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]/80">
                  <ArrowDown size={14} className="text-[#C73E1A]" />
                  地形阻力
                </div>
                <span className="font-['Noto_Serif_SC'] text-sm text-[#C73E1A]">
                  -{calculationResult.rollingResistance.toFixed(1)} kgf
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C73E1A] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((calculationResult.rollingResistance / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#1A1A2E] rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                  <Activity size={14} className="text-[#4A7C59]" />
                  净拉力
                </div>
                <span className="font-['Noto_Serif_SC'] text-base font-bold text-[#4A7C59]">
                  {calculationResult.netPullForce.toFixed(1)} kgf
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#2A2A3E] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#4A7C59] to-[#6AAF7A] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((calculationResult.netPullForce / 200) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/80">
                    <Cog size={12} className="text-[#B87333]" />
                    系驾效率
                  </div>
                  <span className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]">
                    {(calculationResult.harnessEfficiency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B87333] rounded-full transition-all duration-500"
                    style={{ width: `${calculationResult.harnessEfficiency * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/80">
                    <Wind size={12} className="text-[#B87333]" />
                    呼吸效率
                  </div>
                  <span className="font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]">
                    {(calculationResult.breathEfficiency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A7C59] rounded-full transition-all duration-500"
                    style={{ width: `${calculationResult.breathEfficiency * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]/80">
                  <Compass size={14} className="text-[#B87333]" />
                  转弯灵活性
                </div>
                <span className="font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                  {calculationResult.turnFlexScore.toFixed(1)}/10
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C73E1A] to-[#B87333] rounded-full transition-all duration-500"
                  style={{ width: `${(calculationResult.turnFlexScore / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]/50 text-center py-4">
            请完成挽具匹配后查看
          </div>
        )}
      </div>

      <button
        onClick={() => setShowPdfModal(true)}
        className="w-full py-3 px-4 bg-[#C73E1A] hover:bg-[#A02F15] text-[#F5F0E8] rounded-lg font-['ZCOOL_XiaoWei'] text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl mb-2"
      >
        <Download size={18} />
        导出PDF结构示意图
      </button>

      <button
        onClick={() => {
          if (!selectedChariot || !selectedHarness || !selectedTerrain || !calculationResult) return
          const csv = generateCsvReport({
            chariotType: selectedChariot,
            harnessType: selectedHarness,
            terrainType: selectedTerrain,
            horseCount,
            placements,
            calculationResult,
          })
          downloadCsv(csv, `${selectedChariot.name}_${horseCount}匹_${selectedHarness.name}_${selectedTerrain.name}_力学分析报告.csv`)
        }}
        disabled={!calculationResult}
        className={`w-full py-3 px-4 rounded-lg font-['ZCOOL_XiaoWei'] text-base flex items-center justify-center gap-2 transition-all duration-200 ${
          calculationResult
            ? 'bg-[#B87333] hover:bg-[#A06523] text-[#F5F0E8] shadow-lg hover:shadow-xl'
            : 'bg-[#2A2A3E] text-[#F5F0E8]/40 cursor-not-allowed'
        }`}
      >
        <FileSpreadsheet size={18} />
        导出CSV力学分析报告
      </button>
    </div>
  )
}

export default ControlPanel
