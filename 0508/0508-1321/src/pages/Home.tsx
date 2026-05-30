import React, { useEffect } from 'react'
import { useChariotStore } from '@/store/useChariotStore'
import ChariotScene from '@/components/ChariotScene'
import ControlPanel from '@/components/ControlPanel'
import HarnessDragDrop from '@/components/HarnessDragDrop'
import PdfExportModal from '@/components/PdfExportModal'

const Home: React.FC = () => {
  const { fetchChariotTypes, fetchHarnessTypes, fetchHarnessParts, fetchTerrainTypes } = useChariotStore()

  useEffect(() => {
    fetchChariotTypes()
    fetchHarnessTypes()
    fetchHarnessParts()
    fetchTerrainTypes()
  }, [fetchChariotTypes, fetchHarnessTypes, fetchHarnessParts, fetchTerrainTypes])

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="bg-[#1E1E32] border-b border-[#B87333]/30 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-2xl">古代战车挽具结构模拟</h1>
            <p className="font-['Noto_Serif_SC'] text-[#F5F0E8]/60 text-sm mt-1">商周时期战车系驾力学仿真系统</p>
          </div>
          <div className="text-right">
            <p className="font-['Noto_Serif_SC'] text-[#F5F0E8]/50 text-xs">参考资料</p>
            <p className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-base">《考工记》</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-[#1E1E32] rounded-xl overflow-hidden h-[500px]">
              <ChariotScene />
            </div>
            <HarnessDragDrop />
          </div>

          <div className="w-full lg:w-[400px] h-[500px]">
            <ControlPanel />
          </div>
        </div>

        <div className="bg-[#1E1E32] rounded-xl p-6">
          <h2 className="font-['ZCOOL_XiaoWei'] text-[#B87333] text-xl mb-4">考古参数说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-['Noto_Serif_SC'] text-sm">
            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="text-[#B87333] font-semibold mb-2">战车类型</h3>
              <p className="text-[#F5F0E8]/80 leading-relaxed">
                <span className="text-[#B87333]">轻战车</span>：轮径1.4米，机动性强，适合追击、骚扰作战。
                <br />
                <span className="text-[#B87333]">重战车</span>：轮径1.6米，防护性好，适合正面冲锋、突破敌阵。
              </p>
            </div>
            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="text-[#B87333] font-semibold mb-2">系驾方式</h3>
              <p className="text-[#F5F0E8]/80 leading-relaxed">
                <span className="text-[#B87333]">颈带式</span>：早期系驾法，皮带压迫马颈气管，影响呼吸，拉力较小。
                <br />
                <span className="text-[#B87333]">胸带式</span>：晚期系驾法，受力于肩胛骨前缘，马匹呼吸通畅，拉力更大。
              </p>
            </div>
            <div className="bg-[#2A2A3E] rounded-lg p-4">
              <h3 className="text-[#B87333] font-semibold mb-2">挽具部件</h3>
              <p className="text-[#F5F0E8]/80 leading-relaxed">
                <span className="text-[#B87333]">轭</span>：置于马颈的叉形构件，连接靷绳。
                <br />
                <span className="text-[#B87333]">靷</span>：连接轭与车轴的皮带，主力牵引。
                <br />
                <span className="text-[#B87333]">勒</span>：马络头，配衔镳，控制方向。
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#1E1E32] border-t border-[#B87333]/30 px-6 py-4 mt-6">
        <div className="max-w-[1800px] mx-auto text-center">
          <p className="font-['Noto_Serif_SC'] text-[#F5F0E8]/50 text-xs">
            古代战车挽具结构模拟系统 · 基于《考工记》考古资料
          </p>
        </div>
      </footer>

      <PdfExportModal />
    </div>
  )
}

export default Home
