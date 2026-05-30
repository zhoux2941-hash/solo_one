import { useEffect, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import DrumTowerScene from '@/components/DrumTowerScene'
import MechanicalCanvas from '@/components/MechanicalCanvas'
import ShichenControl from '@/components/ShichenControl'
import LogPanel from '@/components/LogPanel'
import CitySelector from '@/components/CitySelector'
import { useDrumTowerStore } from '@/hooks/useDrumTowerStore'
import { fetchCities, fetchRules } from '@/utils/api'
import { Map, ScrollText } from 'lucide-react'

export default function Home() {
  const setCities = useDrumTowerStore((s) => s.setCities)
  const selectCity = useDrumTowerStore((s) => s.selectCity)
  const setRules = useDrumTowerStore((s) => s.setRules)
  const cities = useDrumTowerStore((s) => s.cities)
  const selectedCity = useDrumTowerStore((s) => s.selectedCity)
  const animation = useDrumTowerStore((s) => s.animation)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCities().then((data) => {
      setCities(data)
      if (data.length > 0) {
        selectCity(data[0])
        fetchRules(data[0].id).then(setRules)
      }
    })
  }, [setCities, selectCity, setRules])

  const handleCityChange = (cityId: number) => {
    const city = (cities || []).find((c) => c.id === cityId)
    if (city) {
      selectCity(city)
      fetchRules(city.id).then(setRules)
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col" style={{ backgroundColor: '#1A1A2E' }}>
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: '#3C2F2F', backgroundColor: 'rgba(26,26,46,0.95)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="text-xl font-bold"
            style={{
              color: '#C5A55A',
              fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
            }}
          >
            鼓楼钟声
          </div>
          <span className="text-xs" style={{ color: '#6B7B8D' }}>
            晨钟暮鼓 · 时光回响
          </span>
        </div>
        <div className="flex items-center gap-3">
          <CitySelector onChange={handleCityChange} />
          <button
            onClick={() => navigate('/rules')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all duration-200"
            style={{
              borderColor: '#8B7355',
              color: '#C5A55A',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139,115,85,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ScrollText size={14} />
            规则表
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-h-0">
          <Canvas shadows gl={{ antialias: true, alpha: false }} onCreated={({ gl }) => { gl.setClearColor('#1A1A2E') }}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
              <OrbitControls
                target={[0, 2, 0]}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={25}
                autoRotate
                autoRotateSpeed={0.3}
              />
              <ambientLight intensity={0.15} color="#4466AA" />
              <directionalLight
                position={[10, 12, 5]}
                intensity={1.2}
                color="#FFD700"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[0, 3, 0]} intensity={0.8} color="#FF8C00" distance={10} />
              <pointLight position={[-3, 3.5, -2]} intensity={0.4} color="#FF6600" distance={5} />
              <pointLight position={[3, 3.5, -2]} intensity={0.4} color="#FF6600" distance={5} />
              <fog attach="fog" args={['#1A1A2E', 15, 40]} />
              <DrumTowerScene />
            </Suspense>
          </Canvas>

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 140, backgroundColor: 'rgba(26,26,46,0.85)' }}
          >
            <div className="px-4 py-2 flex items-center gap-2" style={{ height: 20 }}>
              <span
                className="text-xs font-bold"
                style={{ color: '#8B7355', fontFamily: '"Noto Serif SC", serif' }}
              >
                ⚙️ 机械传动剖面
              </span>
              {animation.isActive && (
                <span
                  className="text-xs animate-pulse"
                  style={{ color: animation.type === 'bell' ? '#DAA520' : '#FF4500' }}
                >
                  {animation.type === 'bell' ? '钟锤击打中...' : '鼓锤击打中...'}
                  {` (${animation.currentStrike}/${animation.totalStrikes})`}
                </span>
              )}
            </div>
            <div style={{ height: 120 }}>
              <MechanicalCanvas />
            </div>
          </div>
        </div>

        <div
          className="flex flex-col border-l"
          style={{
            width: 300,
            borderColor: '#3C2F2F',
            backgroundColor: 'rgba(26,26,46,0.95)',
          }}
        >
          <div className="p-4 flex-shrink-0">
            {selectedCity && (
              <div className="mb-3 text-center">
                <div
                  className="text-base font-bold"
                  style={{
                    color: '#C5A55A',
                    fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
                  }}
                >
                  <Map size={14} className="inline mr-1" />
                  {selectedCity.name} · {selectedCity.dynasty}
                </div>
                <div className="text-xs mt-1" style={{ color: '#6B7B8D' }}>
                  {selectedCity.description}
                </div>
              </div>
            )}
            <ShichenControl />
          </div>

          <div
            className="flex-1 p-4 border-t overflow-hidden"
            style={{ borderColor: '#3C2F2F' }}
          >
            <LogPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
