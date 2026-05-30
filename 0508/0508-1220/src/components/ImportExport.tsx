import { useRef } from 'react'
import { useECGStore } from '@/store/ecgStore'
import { Download, Upload, FileX } from 'lucide-react'
import { downloadCSV } from '@/utils/csvExporter'
import { parseECGCSV } from '@/utils/csvParser'

export default function ImportExport() {
  const { waveformData, isExternalMode, setExternalData, exitExternalMode } = useECGStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (waveformData.length > 0) {
      downloadCSV(waveformData, 'ecg_data.csv')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const data = parseECGCSV(content)
      if (data) {
        setExternalData(data)
      } else {
        alert('无法解析CSV文件，请确保文件格式正确：时间,电压 两列')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExitExternal = () => {
    exitExternalMode()
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        数据管理
      </h3>

      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={waveformData.length === 0}
          className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <div className="text-left">
            <div className="text-sm text-slate-200">导出 CSV</div>
            <div className="text-xs text-slate-500">保存波形数据</div>
          </div>
        </button>

        <button
          onClick={handleImportClick}
          className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all flex items-center gap-3"
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          <div className="text-left">
            <div className="text-sm text-slate-200">导入 CSV</div>
            <div className="text-xs text-slate-500">加载外部ECG数据</div>
          </div>
        </button>

        {isExternalMode && (
          <button
            onClick={handleExitExternal}
            className="w-full p-3 rounded-lg bg-red-900/30 border border-red-700/50 hover:bg-red-800/30 transition-all flex items-center gap-3"
          >
            <FileX className="w-4 h-4 text-red-400" />
            <div className="text-left">
              <div className="text-sm text-red-300">退出外部模式</div>
              <div className="text-xs text-red-500/70">返回模拟波形</div>
            </div>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-xs text-slate-500 p-2 bg-slate-800/30 rounded">
        <div className="font-medium text-slate-400 mb-1">CSV格式要求:</div>
        <div className="font-mono text-[10px] leading-relaxed">
          Time (s),Voltage (mV)
          <br />
          0.000,0.012
          <br />
          0.002,0.015
        </div>
      </div>
    </div>
  )
}
