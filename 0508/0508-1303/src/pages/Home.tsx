import React, { useEffect } from 'react';
import { Waves, MapPin, Target, Crosshair } from 'lucide-react';
import WaveformChart from '../components/WaveformChart';
import StationSelector from '../components/StationSelector';
import FilterControls from '../components/FilterControls';
import EpicenterMap from '../components/EpicenterMapECharts';
import EChartsConnect from '../components/EChartsConnect';
import { useSeismicStore } from '../store/useSeismicStore';
import { formatTime, formatDistance, getMagnitudeDescription } from '../utils/calculation';

const Home: React.FC = () => {
  const {
    loadPresetEvents,
    isLoading,
    events,
    selectedEvent,
    selectedStationId,
    stationAnnotations,
    selectEvent,
    selectStation,
    annotationMode,
    setAnnotationMode,
    triangulationResult
  } = useSeismicStore();

  useEffect(() => {
    loadPresetEvents();
  }, [loadPresetEvents]);

  const annotatedCount = Object.values(stationAnnotations).filter(a => a.pTime !== null && a.sTime !== null).length;
  const totalStations = selectedEvent?.stations.length || 0;
  const magInfo = selectedEvent ? getMagnitudeDescription(selectedEvent.magnitude) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading seismic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1900px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Waves size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Seismic Analyzer
              </h1>
              <p className="text-xs text-slate-500">Multi-Station Triangulation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">
              ECharts · Zoom Sync · Triangulation
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1900px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-4">
          <aside className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Seismic Event</h3>
              <select
                value={selectedEvent?.id || ''}
                onChange={(e) => selectEvent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="" disabled>Select event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} (M{ev.magnitude}, {ev.stations.length} stations)
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <div className="mt-3 bg-slate-800/50 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Magnitude:</span>
                    <span className="font-mono font-bold text-orange-400">M {selectedEvent.magnitude}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Depth:</span>
                    <span className="font-mono text-slate-300">{selectedEvent.depth} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-mono text-slate-300">{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Stations:</span>
                    <span className="font-mono text-cyan-400">{selectedEvent.stations.length}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <StationSelector
                event={selectedEvent}
                selectedStationId={selectedStationId}
                onSelectStation={selectStation}
                annotations={stationAnnotations}
              />
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Target size={16} />
                  Wave Annotation
                </h3>
                <div className="bg-slate-800/30 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                  <p>1. Select a station, then click P/S to annotate</p>
                  <p>2. Repeat for more stations (min 2 needed)</p>
                  <p>3. Drag annotation lines to adjust</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnnotationMode(annotationMode === 'P' ? null : 'P')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      annotationMode === 'P'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-lg">P</span>
                    <span className="block text-xs font-normal mt-0.5">P-Wave</span>
                  </button>
                  <button
                    onClick={() => setAnnotationMode(annotationMode === 'S' ? null : 'S')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      annotationMode === 'S'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-lg">S</span>
                    <span className="block text-xs font-normal mt-0.5">S-Wave</span>
                  </button>
                </div>
                <button
                  onClick={() => useSeismicStore.setState({ stationAnnotations: {}, triangulationResult: null })}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Clear All Annotations
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <FilterControls />
            </div>
          </aside>

          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-300">Waveform</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{selectedEvent?.stations.find(s => s.id === selectedStationId)?.name || 'Select station'}</span>
                    <span className="text-cyan-500/60">|</span>
                    <span className="text-cyan-400">Zoom linked</span>
                  </div>
                </div>
                <EChartsConnect>
                  <div className="space-y-2 relative">
                    <WaveformChart componentType="vertical" />
                    <WaveformChart componentType="north" />
                    <WaveformChart componentType="east" />
                  </div>
                </EChartsConnect>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Crosshair size={16} />
                    Epicenter Location
                  </h2>
                  <span className="text-xs text-slate-500">
                    {annotatedCount}/{totalStations} annotated
                  </span>
                </div>
                <EpicenterMap
                  event={selectedEvent}
                  annotations={stationAnnotations}
                  triangulationResult={triangulationResult}
                />
              </div>
            </div>

            {triangulationResult && (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Triangulation Station Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-2 px-2">Station</th>
                        <th className="text-right py-2 px-2">P Arrival</th>
                        <th className="text-right py-2 px-2">S Arrival</th>
                        <th className="text-right py-2 px-2">P-S Diff</th>
                        <th className="text-right py-2 px-2">Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triangulationResult.stations.map((s) => (
                        <tr key={s.id} className="border-b border-slate-800">
                          <td className="py-2 px-2 font-medium">{s.name}</td>
                          <td className="py-2 px-2 text-right font-mono text-orange-400">
                            {s.pTime !== null ? formatTime(s.pTime) : '--'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-red-400">
                            {s.sTime !== null ? formatTime(s.sTime) : '--'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-cyan-400">
                            {s.psDiff !== null ? `${s.psDiff.toFixed(2)}s` : '--'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-green-400">
                            {formatDistance(s.distance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">How to Use</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-500">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                  <span>Select a seismic event from the dropdown</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                  <span>Choose a station, click P/S, then click on waveform to annotate</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                  <span>Repeat for at least 2 stations for triangulation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-cyan-500/20 text-cyan-400 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">4</span>
                  <span>Use mouse wheel or slider to zoom (linked across all waveforms)</span>
                </div>
              </div>
            </div>
          </div>

          <aside>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 sticky top-24 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} />
                Location Result
              </h3>

              {triangulationResult ? (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="text-xs text-green-400 mb-1">Estimated Epicenter</div>
                    <div className="font-mono text-lg font-bold text-green-300">
                      {triangulationResult.lat.toFixed(3)}N, {triangulationResult.lon.toFixed(3)}E
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Confidence</span>
                      <span className="font-mono text-sm font-bold" style={{
                        color: triangulationResult.confidence > 70 ? '#22c55e' :
                               triangulationResult.confidence > 40 ? '#eab308' : '#ef4444'
                      }}>
                        {triangulationResult.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${triangulationResult.confidence}%`,
                          backgroundColor: triangulationResult.confidence > 70 ? '#22c55e' :
                                          triangulationResult.confidence > 40 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">True Epicenter</div>
                    <div className="font-mono text-sm text-slate-300">
                      {selectedEvent?.epicenter.lat.toFixed(3)}N, {selectedEvent?.epicenter.lon.toFixed(3)}E
                    </div>
                    {(() => {
                      if (!selectedEvent) return null;
                      const dx = triangulationResult.epicenterX - selectedEvent.epicenter.x;
                      const dy = triangulationResult.epicenterY - selectedEvent.epicenter.y;
                      const error = Math.sqrt(dx * dx + dy * dy);
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Location Error</span>
                            <span className={`font-mono font-bold ${error < 20 ? 'text-green-400' : error < 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {error.toFixed(1)} km
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">Stations Used</div>
                    <div className="space-y-1">
                      {triangulationResult.stations.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">{s.name}</span>
                          <span className="font-mono text-cyan-400">{formatDistance(s.distance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">
                    <Crosshair size={32} className="mx-auto text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Annotate P/S waves on at least 2 stations to enable triangulation
                  </p>
                </div>
              )}

              {selectedEvent && (
                <div className="border-t border-slate-700 pt-3">
                  <div className="text-xs text-slate-400 mb-2">Event Magnitude</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{ color: magInfo?.color || '#64748b' }}
                    >
                      M {selectedEvent.magnitude}
                    </span>
                    <span className="text-xs" style={{ color: magInfo?.color || '#64748b' }}>
                      {magInfo?.level}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Home;
