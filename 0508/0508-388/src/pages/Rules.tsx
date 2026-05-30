import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { City, TimekeepingRule } from '../../shared/types'
import { fetchCities, fetchRules, getExportUrl } from '@/utils/api'
import { ArrowLeft, Download } from 'lucide-react'

export default function RulesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [selectedCityId, setSelectedCityId] = useState<number>(1)
  const [rules, setRules] = useState<TimekeepingRule[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchCities().then((data) => {
      setCities(data)
      if (data.length > 0) {
        setSelectedCityId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    fetchRules(selectedCityId).then(setRules)
  }, [selectedCityId])

  const selectedCity = cities.find((c) => c.id === selectedCityId)

  return (
    <div className="w-screen min-h-screen" style={{ backgroundColor: '#1A1A2E' }}>
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: '#3C2F2F', backgroundColor: 'rgba(26,26,46,0.95)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs transition-all duration-200"
            style={{ borderColor: '#8B7355', color: '#C5A55A' }}
          >
            <ArrowLeft size={14} />
            返回
          </button>
          <div
            className="text-lg font-bold"
            style={{
              color: '#C5A55A',
              fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
            }}
          >
            📋 报时规则表
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(Number(e.target.value))}
            className="px-3 py-1.5 rounded border text-xs outline-none"
            style={{
              borderColor: '#8B7355',
              color: '#C5A55A',
              backgroundColor: 'rgba(26,26,46,0.9)',
              fontFamily: '"Noto Serif SC", serif',
            }}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id} style={{ backgroundColor: '#1A1A2E', color: '#C5A55A' }}>
                {city.name} · {city.dynasty}
              </option>
            ))}
          </select>
          <a
            href={getExportUrl(selectedCityId)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs no-underline transition-all duration-200"
            style={{
              borderColor: '#DAA520',
              color: '#DAA520',
              backgroundColor: 'rgba(218,165,32,0.1)',
            }}
          >
            <Download size={14} />
            导出CSV
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {selectedCity && (
          <div className="mb-6 text-center">
            <div
              className="text-2xl font-bold"
              style={{
                color: '#C5A55A',
                fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
              }}
            >
              {selectedCity.name}鼓楼报时规则
            </div>
            <div className="text-sm mt-1" style={{ color: '#6B7B8D' }}>
              {selectedCity.dynasty} · {selectedCity.description}
            </div>
          </div>
        )}

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: '#3C2F2F' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(60,47,47,0.6)' }}>
                <th
                  className="px-4 py-3 text-left text-xs font-bold"
                  style={{ color: '#C5A55A', fontFamily: '"Noto Serif SC", serif' }}
                >
                  时辰
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold"
                  style={{ color: '#C5A55A', fontFamily: '"Noto Serif SC", serif' }}
                >
                  现代时间
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold"
                  style={{ color: '#DAA520', fontFamily: '"Noto Serif SC", serif' }}
                >
                  钟次数
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold"
                  style={{ color: '#8B0000', fontFamily: '"Noto Serif SC", serif' }}
                >
                  鼓次数
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold"
                  style={{ color: '#C5A55A', fontFamily: '"Noto Serif SC", serif' }}
                >
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, index) => (
                <tr
                  key={rule.id}
                  className="border-t transition-colors duration-150"
                  style={{
                    borderColor: '#3C2F2F',
                    backgroundColor: index % 2 === 0 ? 'rgba(26,26,46,0.5)' : 'rgba(44,24,16,0.3)',
                  }}
                >
                  <td
                    className="px-4 py-3 text-sm font-bold"
                    style={{ color: '#DAA520', fontFamily: '"Noto Serif SC", serif' }}
                  >
                    {rule.shichen}
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: '#8B9DAF' }}
                  >
                    {rule.modern_time}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {rule.bell_count > 0 ? (
                      <span style={{ color: '#DAA520' }}>🔔 {rule.bell_count}</span>
                    ) : (
                      <span style={{ color: '#4A5568' }}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {rule.drum_count > 0 ? (
                      <span style={{ color: '#FF4500' }}>🪘 {rule.drum_count}</span>
                    ) : (
                      <span style={{ color: '#4A5568' }}>-</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: '#8B9DAF' }}
                  >
                    {rule.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-xs" style={{ color: '#6B7B8D' }}>
          <div className="flex items-center gap-1">
            <span style={{ color: '#DAA520' }}>🔔</span> 晨钟 — 破晓报晓
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: '#FF4500' }}>🪘</span> 暮鼓 — 日落报更
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: '#4A5568' }}>-</span> 无钟鼓 — 夜间静更
          </div>
        </div>
      </div>
    </div>
  )
}
