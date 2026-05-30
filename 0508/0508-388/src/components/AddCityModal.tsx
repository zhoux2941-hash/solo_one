import { useState } from 'react'
import { X, MapPin, Plus, Trash2 } from 'lucide-react'
import { SHICHEN_NAMES } from '../../shared/types'
import { createCity, deleteCity, fetchCities, fetchRules } from '@/utils/api'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import type { City } from '../../shared/types'

const MODERN_TIMES = [
  '23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00',
  '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00',
  '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00',
]

interface AddCityModalProps {
  isOpen: boolean
  onClose: () => void
  cities: City[]
}

export default function AddCityModal({ isOpen, onClose, cities }: AddCityModalProps) {
  const setCities = useDrumTowerStore((s) => s.setCities)
  const selectCity = useDrumTowerStore((s) => s.selectCity)
  const setRules = useDrumTowerStore((s) => s.setRules)

  const [step, setStep] = useState<'basic' | 'rules'>('basic')
  const [name, setName] = useState('')
  const [dynasty, setDynasty] = useState('自定义')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [description, setDescription] = useState('')
  const [rulesData, setRulesData] = useState(
    SHICHEN_NAMES.map((shichen, i) => ({
      shichen,
      modern_time: MODERN_TIMES[i],
      bell_count: 0,
      drum_count: 0,
      description: '',
    }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('请输入城市名称')
      return
    }
    setStep('rules')
  }

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      await createCity({
        name,
        dynasty,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        description,
        rules: rulesData,
      })
      const newCities = await fetchCities()
      setCities(newCities)
      const newCity = newCities.find((c) => c.name === name)
      if (newCity) {
        selectCity(newCity)
        const rules = await fetchRules(newCity.id)
        setRules(rules)
      }
      onClose()
      resetForm()
    } catch (err) {
      setError('创建城市失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cityId: number) => {
    if (!confirm('确定要删除这个城市吗？')) return
    try {
      await deleteCity(cityId)
      const newCities = await fetchCities()
      setCities(newCities)
      if (newCities.length > 0) {
        selectCity(newCities[0])
        const rules = await fetchRules(newCities[0].id)
        setRules(rules)
      }
    } catch (err) {
      setError('删除失败')
    }
  }

  const resetForm = () => {
    setName('')
    setDynasty('自定义')
    setLatitude('')
    setLongitude('')
    setDescription('')
    setRulesData(SHICHEN_NAMES.map((shichen, i) => ({
      shichen,
      modern_time: MODERN_TIMES[i],
      bell_count: 0,
      drum_count: 0,
      description: '',
    })))
    setStep('basic')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const updateRule = (index: number, field: string, value: number | string) => {
    const newRules = [...rulesData]
    newRules[index] = { ...newRules[index], [field]: value }
    setRulesData(newRules)
  }

  const presetRules = (preset: 'xian' | 'beijing' | 'none') => {
    if (preset === 'xian') {
      setRulesData(SHICHEN_NAMES.map((shichen, i) => ({
        shichen,
        modern_time: MODERN_TIMES[i],
        bell_count: i === 2 ? 3 : i === 3 ? 108 : 0,
        drum_count: i === 10 ? 3 : i === 9 ? 108 : 0,
        description: i === 2 ? '晨钟初响' : i === 3 ? '晨钟108响' : i === 9 ? '暮鼓108响' : i === 10 ? '暮鼓初响' : '',
      })))
    } else if (preset === 'beijing') {
      setRulesData(SHICHEN_NAMES.map((shichen, i) => ({
        shichen,
        modern_time: MODERN_TIMES[i],
        bell_count: i === 3 ? 108 : 0,
        drum_count: i === 9 ? 108 : 0,
        description: i === 3 ? '晨钟108响' : i === 9 ? '暮鼓108响' : '',
      })))
    } else {
      setRulesData(SHICHEN_NAMES.map((shichen, i) => ({
        shichen,
        modern_time: MODERN_TIMES[i],
        bell_count: 0,
        drum_count: 0,
        description: '',
      })))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border shadow-xl"
        style={{ backgroundColor: '#1A1A2E', borderColor: '#8B7355' }}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: '#1A1A2E', borderColor: '#3C2F2F' }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: '#C5A55A', fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            {step === 'basic' ? '🏯 添加城市' : '⏰ 配置报时规则'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            style={{ color: '#8B9DAF' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div
              className="mb-4 p-3 rounded text-sm"
              style={{ backgroundColor: 'rgba(194,54,22,0.2)', color: '#C23616' }}
            >
              {error}
            </div>
          )}

          {step === 'basic' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#C5A55A' }}>城市名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：南京、开封..."
                  className="w-full px-3 py-2 rounded border outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(26,26,46,0.9)',
                    borderColor: '#8B7355',
                    color: '#C5A55A',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: '#C5A55A' }}>朝代/时期</label>
                <input
                  type="text"
                  value={dynasty}
                  onChange={(e) => setDynasty(e.target.value)}
                  className="w-full px-3 py-2 rounded border outline-none"
                  style={{
                    backgroundColor: 'rgba(26,26,46,0.9)',
                    borderColor: '#8B7355',
                    color: '#C5A55A',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#C5A55A' }}>
                    <MapPin size={12} className="inline mr-1" />纬度
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="如：32.0603"
                    className="w-full px-3 py-2 rounded border outline-none"
                    style={{
                      backgroundColor: 'rgba(26,26,46,0.9)',
                      borderColor: '#8B7355',
                      color: '#C5A55A',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#C5A55A' }}>经度</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="如：118.7969"
                    className="w-full px-3 py-2 rounded border outline-none"
                    style={{
                      backgroundColor: 'rgba(26,26,46,0.9)',
                      borderColor: '#8B7355',
                      color: '#C5A55A',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: '#C5A55A' }}>描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="描述这个城市的鼓楼特色..."
                  className="w-full px-3 py-2 rounded border outline-none resize-none"
                  style={{
                    backgroundColor: 'rgba(26,26,46,0.9)',
                    borderColor: '#8B7355',
                    color: '#C5A55A',
                  }}
                />
              </div>

              {cities.filter(c => c.id > 3).length > 0 && (
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#C5A55A' }}>已添加的自定义城市</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {cities.filter(c => c.id > 3).map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center justify-between px-3 py-2 rounded border"
                        style={{ backgroundColor: 'rgba(60,47,47,0.5)', borderColor: '#3C2F2F' }}
                      >
                        <div>
                          <span style={{ color: '#DAA520' }}>{city.name}</span>
                          <span className="text-xs ml-2" style={{ color: '#6B7B8D' }}>{city.dynasty}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(city.id)}
                          className="p-1 rounded hover:bg-red-900 transition-colors"
                          style={{ color: '#C23616' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded border text-sm"
                  style={{ borderColor: '#8B7355', color: '#8B9DAF' }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded border text-sm flex items-center gap-1"
                  style={{
                    borderColor: '#DAA520',
                    color: '#DAA520',
                    backgroundColor: 'rgba(218,165,32,0.1)',
                  }}
                >
                  下一步：配置规则
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => presetRules('none')}
                  className="px-3 py-1.5 rounded border text-xs"
                  style={{ borderColor: '#8B7355', color: '#8B9DAF' }}
                >
                  清空
                </button>
                <button
                  onClick={() => presetRules('xian')}
                  className="px-3 py-1.5 rounded border text-xs"
                  style={{ borderColor: '#8B7355', color: '#8B9DAF' }}
                >
                  西安式（晨钟暮鼓）
                </button>
                <button
                  onClick={() => presetRules('beijing')}
                  className="px-3 py-1.5 rounded border text-xs"
                  style={{ borderColor: '#8B7355', color: '#8B9DAF' }}
                >
                  北京式（各108响）
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#3C2F2F' }}>
                      <th className="py-2 text-left" style={{ color: '#C5A55A' }}>时辰</th>
                      <th className="py-2 text-center" style={{ color: '#DAA520' }}>钟</th>
                      <th className="py-2 text-center" style={{ color: '#8B0000' }}>鼓</th>
                      <th className="py-2 text-left" style={{ color: '#C5A55A' }}>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesData.map((rule, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: '#3C2F2F' }}>
                        <td className="py-2">
                          <span style={{ color: '#DAA520' }}>{rule.shichen}</span>
                          <div className="text-xs" style={{ color: '#6B7B8D' }}>{rule.modern_time}</div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={rule.bell_count}
                            onChange={(e) => updateRule(i, 'bell_count', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded border text-center outline-none"
                            style={{
                              backgroundColor: 'rgba(26,26,46,0.9)',
                              borderColor: '#8B7355',
                              color: '#DAA520',
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={rule.drum_count}
                            onChange={(e) => updateRule(i, 'drum_count', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded border text-center outline-none"
                            style={{
                              backgroundColor: 'rgba(26,26,46,0.9)',
                              borderColor: '#8B7355',
                              color: '#8B0000',
                            }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={rule.description}
                            onChange={(e) => updateRule(i, 'description', e.target.value)}
                            className="w-full px-2 py-1 rounded border outline-none text-xs"
                            style={{
                              backgroundColor: 'rgba(26,26,46,0.9)',
                              borderColor: '#8B7355',
                              color: '#8B9DAF',
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep('basic')}
                  className="px-4 py-2 rounded border text-sm"
                  style={{ borderColor: '#8B7355', color: '#8B9DAF' }}
                >
                  返回
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-4 py-2 rounded border text-sm flex items-center gap-1"
                  style={{
                    borderColor: '#DAA520',
                    color: '#DAA520',
                    backgroundColor: 'rgba(218,165,32,0.1)',
                  }}
                >
                  <Plus size={16} />
                  {loading ? '创建中...' : '创建城市'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
