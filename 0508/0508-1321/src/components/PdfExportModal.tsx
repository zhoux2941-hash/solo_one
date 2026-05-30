import React from 'react'
import { useChariotStore } from '@/store/useChariotStore'
import { X, Download, FileSpreadsheet } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generateCsvReport, downloadCsv } from '@/utils/csvExport'

const PdfExportModal: React.FC = () => {
  const {
    showPdfModal,
    chariotTypes,
    harnessTypes,
    terrainTypes,
    selectedChariotType,
    horseCount,
    selectedHarnessType,
    selectedTerrainType,
    calculationResult,
    placements,
    setShowPdfModal,
  } = useChariotStore()

  if (!showPdfModal) return null

  const selectedChariot = chariotTypes.find(c => c.id === selectedChariotType)
  const selectedHarness = harnessTypes.find(h => h.id === selectedHarnessType)
  const selectedTerrain = terrainTypes.find(t => t.id === selectedTerrainType)

  const exportPdf = async () => {
    const element = document.getElementById('pdf-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, { backgroundColor: '#1E1E32', scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('战车挽具结构示意图.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E32] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-xl">导出结构示意图</h2>
          <button
            onClick={() => setShowPdfModal(false)}
            className="text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div id="pdf-content" className="bg-[#1E1E32] p-6 rounded-lg border border-[#B87333]/30">
          <h1 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-2xl text-center mb-6">
            古代战车挽具结构示意图
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-3">基本配置</h3>
              <div className="space-y-2 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">战车类型：</span>
                  <span>{selectedChariot?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">马匹数量：</span>
                  <span>{horseCount}匹</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">系驾方式：</span>
                  <span>{selectedHarness?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">地形：</span>
                  <span>{selectedTerrain?.name || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-3">战车参数</h3>
              <div className="space-y-2 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">轮径：</span>
                  <span>{selectedChariot?.wheelDiameter || '-'}米</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">轴距：</span>
                  <span>{selectedChariot?.axleDistance || '-'}米</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F5F0E8]/70">车重：</span>
                  <span>{selectedChariot?.weight || '-'}公斤</span>
                </div>
              </div>
            </div>
          </div>

          {calculationResult && (
            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base mb-3">力学模拟结果</h3>
              <div className="grid grid-cols-3 gap-3 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8] mb-3">
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">总拉力</div>
                  <div className="text-xl font-bold text-[#B87333]">
                    {calculationResult.totalPullForce.toFixed(1)} kgf
                  </div>
                </div>
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">有效拉力</div>
                  <div className="text-xl font-bold text-[#B87333]">
                    {calculationResult.effectivePullForce.toFixed(1)} kgf
                  </div>
                </div>
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">净拉力</div>
                  <div className="text-xl font-bold text-[#4A7C59]">
                    {calculationResult.netPullForce.toFixed(1)} kgf
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 font-['Noto_Serif_SC'] text-sm text-[#F5F0E8]">
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">地形阻力</div>
                  <div className="text-xl font-bold text-[#C73E1A]">
                    {calculationResult.rollingResistance.toFixed(1)} kgf
                  </div>
                </div>
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">转弯灵活性</div>
                  <div className="text-xl font-bold text-[#C73E1A]">
                    {calculationResult.turnFlexScore.toFixed(1)}/10
                  </div>
                </div>
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">系驾效率</div>
                  <div className="text-xl font-bold text-[#B87333]">
                    {(calculationResult.harnessEfficiency * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-[#1A1A2E] rounded p-3">
                  <div className="text-[#F5F0E8]/70 mb-1">呼吸效率</div>
                  <div className="text-xl font-bold text-[#4A7C59]">
                    {(calculationResult.breathEfficiency * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#B87333]/20">
            <div className="flex justify-between items-center font-['Noto_Serif_SC'] text-xs text-[#F5F0E8]/50">
              <span>数据参考：《考工记》</span>
              <span>生成日期：{new Date().toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowPdfModal(false)}
            className="px-4 py-2 bg-[#2A2A3E] text-[#F5F0E8] rounded-lg font-['Noto_Serif_SC'] text-sm hover:bg-[#2A2A3E]/80 transition-colors"
          >
            关闭
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
            className={`px-4 py-2 rounded-lg font-['Noto_Serif_SC'] text-sm transition-colors flex items-center gap-2 ${
              calculationResult
                ? 'bg-[#B87333] text-[#F5F0E8] hover:bg-[#A06523]'
                : 'bg-[#2A2A3E] text-[#F5F0E8]/40 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet size={16} />
            导出CSV
          </button>
          <button
            onClick={exportPdf}
            className="px-4 py-2 bg-[#C73E1A] text-[#F5F0E8] rounded-lg font-['Noto_Serif_SC'] text-sm hover:bg-[#A02F15] transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            导出PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default PdfExportModal
