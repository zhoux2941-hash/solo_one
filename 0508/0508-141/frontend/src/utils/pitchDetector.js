
// Web Audio API 音高检测器
// 改进版：增加噪音过滤、信号质量验证、谐波分析和平滑处理

class PitchDetector {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.source = null
    this.isRecording = false
    this.stream = null
    
    // 历史检测结果，用于平滑处理
    this.frequencyHistory = []
    this.maxHistoryLength = 10
    
    // 古琴频率范围
    this.minFrequency = 60
    this.maxFrequency = 1000
    
    // 信号质量阈值
    this.rmsThreshold = 0.02
    this.confidenceThreshold = 0.6
    this.harmonicThreshold = 0.3
    
    // 降噪相关
    this.noiseFloor = 0
    this.calibrated = false
  }

  // 初始化音频上下文
  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    return this.audioContext
  }

  // 开始录音
  async startRecording() {
    try {
      await this.init()
      
      // 获取麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      // 创建音频节点
      this.source = this.audioContext.createMediaStreamSource(this.stream)
      
      // 创建高通滤波器（过滤低频噪音）
      const highpassFilter = this.audioContext.createBiquadFilter()
      highpassFilter.type = 'highpass'
      highpassFilter.frequency.value = 40
      
      // 创建低通滤波器（过滤高频噪音）
      const lowpassFilter = this.audioContext.createBiquadFilter()
      lowpassFilter.type = 'lowpass'
      lowpassFilter.frequency.value = 1500
      
      this.analyser = this.audioContext.createAnalyser()
      
      // 设置分析器参数
      this.analyser.fftSize = 4096
      this.analyser.smoothingTimeConstant = 0.2
      
      // 连接节点：source -> highpass -> lowpass -> analyser
      this.source.connect(highpassFilter)
      highpassFilter.connect(lowpassFilter)
      lowpassFilter.connect(this.analyser)
      
      this.isRecording = true
      this.frequencyHistory = []
      this.calibrated = false
      
      // 自动校准环境噪音
      setTimeout(() => this.calibrateNoise(), 500)
      
      return true
    } catch (error) {
      console.error('无法获取麦克风权限:', error)
      throw error
    }
  }

  // 停止录音
  stopRecording() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    this.isRecording = false
    this.frequencyHistory = []
    this.calibrated = false
  }

  // 校准环境噪音
  calibrateNoise() {
    if (!this.analyser || !this.isRecording) return
    
    const bufferLength = this.analyser.fftSize
    const buffer = new Float32Array(bufferLength)
    this.analyser.getFloatTimeDomainData(buffer)
    
    this.noiseFloor = this.calculateRMS(buffer)
    this.calibrated = true
    console.log('噪音校准完成，噪音底限:', this.noiseFloor)
  }

  // 检测音高（使用改进的自相关算法）
  detectPitch() {
    if (!this.analyser || !this.isRecording) {
      return null
    }

    const bufferLength = this.analyser.fftSize
    const timeDomainBuffer = new Float32Array(bufferLength)
    const frequencyDomainBuffer = new Float32Array(bufferLength / 2)
    
    this.analyser.getFloatTimeDomainData(timeDomainBuffer)
    this.analyser.getFloatFrequencyData(frequencyDomainBuffer)

    // 1. 基础信号质量检测
    const rms = this.calculateRMS(timeDomainBuffer)
    const effectiveRMS = this.calibrated ? Math.max(0, rms - this.noiseFloor * 1.5) : rms
    
    if (effectiveRMS < this.rmsThreshold) {
      return {
        frequency: null,
        rms: parseFloat(rms.toFixed(4)),
        confidence: 0,
        signalQuality: 'noise',
        message: '信号太弱，请靠近麦克风或加大音量'
      }
    }

    // 2. 过零率分析（区分语音和乐音）
    const zeroCrossingRate = this.calculateZeroCrossingRate(timeDomainBuffer)
    
    // 乐音的过零率相对稳定，语音的过零率变化较大
    // 古琴的过零率通常在0.01-0.15之间
    if (zeroCrossingRate > 0.25 || zeroCrossingRate < 0.005) {
      return {
        frequency: null,
        rms: parseFloat(rms.toFixed(4)),
        confidence: 0.2,
        signalQuality: 'unstable',
        zeroCrossingRate: parseFloat(zeroCrossingRate.toFixed(4)),
        message: '信号不稳定，可能是噪音或语音'
      }
    }

    // 3. 使用自相关算法检测基频
    const pitchResult = this.improvedAutocorrelation(timeDomainBuffer, this.audioContext.sampleRate)
    
    if (!pitchResult || !pitchResult.frequency) {
      return {
        frequency: null,
        rms: parseFloat(rms.toFixed(4)),
        confidence: 0.3,
        signalQuality: 'no_pitch',
        message: '未检测到有效音高'
      }
    }

    // 4. 谐波分析（验证是否为乐音）
    const harmonicScore = this.analyzeHarmonics(
      frequencyDomainBuffer, 
      pitchResult.frequency, 
      this.audioContext.sampleRate
    )

    // 5. 计算综合置信度
    const confidence = this.calculateConfidence(
      effectiveRMS, 
      harmonicScore, 
      pitchResult.clarity,
      zeroCrossingRate
    )

    // 6. 频率平滑处理
    let smoothedFrequency = pitchResult.frequency
    if (this.frequencyHistory.length > 0) {
      const historyAvg = this.frequencyHistory.reduce((a, b) => a + b, 0) / this.frequencyHistory.length
      const deviation = Math.abs(pitchResult.frequency - historyAvg) / historyAvg
      
      if (deviation > 0.2 && confidence < 0.7) {
        // 偏差太大且置信度不高，使用历史平均值
        smoothedFrequency = historyAvg
      } else {
        // 加权平均
        smoothedFrequency = pitchResult.frequency * 0.6 + historyAvg * 0.4
      }
    }

    // 7. 更新历史记录
    this.frequencyHistory.push(pitchResult.frequency)
    if (this.frequencyHistory.length > this.maxHistoryLength) {
      this.frequencyHistory.shift()
    }

    // 8. 古琴特征验证
    const guqinScore = this.verifyGuqinCharacteristics(
      smoothedFrequency, 
      harmonicScore, 
      zeroCrossingRate
    )

    let signalQuality = 'good'
    let message = '信号质量良好'
    
    if (confidence < this.confidenceThreshold) {
      signalQuality = 'poor'
      message = '信号质量较差，可能是环境噪音'
    } else if (guqinScore < 0.5) {
      signalQuality = 'not_guqin'
      message = '检测到的信号可能不是古琴音，请注意环境噪音'
    } else if (confidence >= 0.8 && guqinScore >= 0.7) {
      signalQuality = 'excellent'
      message = '信号质量优秀'
    }

    return {
      frequency: confidence >= this.confidenceThreshold ? parseFloat(smoothedFrequency.toFixed(2)) : null,
      rawFrequency: parseFloat(pitchResult.frequency.toFixed(2)),
      rms: parseFloat(rms.toFixed(4)),
      effectiveRMS: parseFloat(effectiveRMS.toFixed(4)),
      confidence: parseFloat(confidence.toFixed(2)),
      harmonicScore: parseFloat(harmonicScore.toFixed(2)),
      clarity: parseFloat(pitchResult.clarity.toFixed(2)),
      zeroCrossingRate: parseFloat(zeroCrossingRate.toFixed(4)),
      guqinScore: parseFloat(guqinScore.toFixed(2)),
      signalQuality: signalQuality,
      message: message
    }
  }

  // 改进的自相关算法
  improvedAutocorrelation(buffer, sampleRate) {
    const size = buffer.length
    const correlations = new Array(size).fill(0)
    
    // 优化：只计算到size/2，使用更高效的实现
    for (let lag = 0; lag < size / 2; lag++) {
      let sum = 0
      for (let i = 0; i < size - lag; i++) {
        sum += buffer[i] * buffer[i + lag]
      }
      correlations[lag] = sum
    }

    // 归一化自相关
    const maxCorrelation = correlations[0]
    if (maxCorrelation === 0) return null
    
    for (let i = 0; i < size / 2; i++) {
      correlations[i] /= maxCorrelation
    }

    // 寻找第一个有效峰值（排除直流分量）
    let d = 1
    while (d < size / 4 && correlations[d] > correlations[d + 1]) {
      d++
    }

    // 在有效区域寻找所有峰值
    const peaks = []
    for (let i = d + 1; i < size / 2 - 1; i++) {
      if (correlations[i] > correlations[i - 1] && 
          correlations[i] > correlations[i + 1] &&
          correlations[i] > 0.3) {
        peaks.push({
          position: i,
          value: correlations[i]
        })
      }
    }

    if (peaks.length === 0) return null

    // 按峰值大小排序
    peaks.sort((a, b) => b.value - a.value)

    // 验证峰值的一致性（是否为基频及其倍数）
    const validPeaks = this.validatePeaks(peaks)
    
    if (validPeaks.length === 0) return null

    // 选择最可靠的峰值
    const bestPeak = validPeaks[0]
    
    // 使用抛物线插值提高精度
    const T0 = this.parabolicInterpolation(correlations, bestPeak.position)
    
    // 计算频率
    const frequency = sampleRate / T0
    
    // 频率范围过滤
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return null
    }

    // 计算清晰度（峰值与第二峰值的比值）
    const clarity = validPeaks.length > 1 
      ? bestPeak.value / Math.max(validPeaks[1].value, 0.01)
      : bestPeak.value

    return {
      frequency: frequency,
      clarity: Math.min(clarity, 1)
    }
  }

  // 验证峰值的一致性
  validatePeaks(peaks) {
    if (peaks.length === 0) return []
    
    const validPeaks = []
    
    for (const peak of peaks) {
      // 检查是否有2倍、3倍频的峰值
      let harmonicCount = 0
      
      for (const otherPeak of peaks) {
        if (otherPeak.position === peak.position) continue
        
        const ratio = otherPeak.position / peak.position
        const integerRatio = Math.round(ratio)
        
        // 检查是否接近整数倍（允许5%误差）
        if (Math.abs(ratio - integerRatio) / integerRatio < 0.05 && integerRatio >= 2 && integerRatio <= 5) {
          harmonicCount++
        }
      }
      
      // 如果有谐波，优先选择
      if (harmonicCount > 0) {
        validPeaks.push({
          ...peak,
          harmonicCount: harmonicCount,
          priority: harmonicCount * 0.5 + peak.value * 0.5
        })
      } else if (peak.value > 0.5) {
        // 即使没有谐波，峰值足够高也算有效
        validPeaks.push({
          ...peak,
          harmonicCount: 0,
          priority: peak.value * 0.6
        })
      }
    }
    
    // 按优先级排序
    validPeaks.sort((a, b) => b.priority - a.priority)
    
    return validPeaks
  }

  // 谐波分析
  analyzeHarmonics(frequencyDomainBuffer, fundamentalFreq, sampleRate) {
    const fftSize = frequencyDomainBuffer.length * 2
    const binWidth = sampleRate / fftSize
    
    // 查找基频对应的bin
    const fundamentalBin = Math.round(fundamentalFreq / binWidth)
    
    // 检查前5个谐波
    let harmonicStrength = 0
    let totalStrength = 0
    
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      const targetBin = Math.round(fundamentalBin * harmonic)
      
      if (targetBin < frequencyDomainBuffer.length) {
        // 在目标bin周围查找实际峰值
        let maxVal = -Infinity
        for (let i = Math.max(0, targetBin - 2); i <= Math.min(frequencyDomainBuffer.length - 1, targetBin + 2); i++) {
          // 将dB转换为线性值
          const linearValue = Math.pow(10, frequencyDomainBuffer[i] / 20)
          maxVal = Math.max(maxVal, linearValue)
        }
        
        if (harmonic === 1) {
          totalStrength += maxVal
        } else {
          // 古琴的谐波丰富，特别是2-4次谐波
          const expectedRatio = 1 / harmonic  // 理想的谐波衰减
          const actualRatio = maxVal / Math.max(totalStrength, 0.0001)
          
          // 如果实际谐波接近理想值，加分
          const ratioMatch = 1 - Math.abs(actualRatio - expectedRatio) / expectedRatio
          harmonicStrength += Math.max(0, ratioMatch) * (1 / harmonic)
        }
      }
    }
    
    // 归一化分数（0-1）
    const harmonicScore = harmonicStrength / 2.5  // 归一化到0-1范围
    
    return Math.min(Math.max(harmonicScore, 0), 1)
  }

  // 计算综合置信度
  calculateConfidence(effectiveRMS, harmonicScore, clarity, zeroCrossingRate) {
    let score = 0
    
    // RMS权重 (0-25分)
    const rmsScore = Math.min(effectiveRMS / 0.1, 1) * 25
    score += rmsScore
    
    // 谐波权重 (0-35分)
    score += harmonicScore * 35
    
    // 清晰度权重 (0-25分)
    score += clarity * 25
    
    // 过零率权重 (0-15分)
    // 理想范围：0.01 - 0.15
    if (zeroCrossingRate >= 0.01 && zeroCrossingRate <= 0.15) {
      score += 15
    } else if (zeroCrossingRate >= 0.005 && zeroCrossingRate <= 0.25) {
      score += 8
    } else {
      score += 0
    }
    
    return score / 100
  }

  // 古琴特征验证
  verifyGuqinCharacteristics(frequency, harmonicScore, zeroCrossingRate) {
    let score = 0
    
    // 1. 频率范围检查（古琴主要在80-600Hz）
    if (frequency >= 80 && frequency <= 600) {
      score += 30
    } else if (frequency >= 60 && frequency <= 800) {
      score += 20
    } else {
      score += 5
    }
    
    // 2. 谐波丰富度（古琴有丰富的谐波）
    score += harmonicScore * 35
    
    // 3. 过零率特征
    if (zeroCrossingRate >= 0.01 && zeroCrossingRate <= 0.15) {
      score += 35
    } else if (zeroCrossingRate >= 0.008 && zeroCrossingRate <= 0.2) {
      score += 25
    } else {
      score += 10
    }
    
    return score / 100
  }

  // 计算过零率
  calculateZeroCrossingRate(buffer) {
    let zeroCrossings = 0
    
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0 && buffer[i - 1] < 0) || 
          (buffer[i] < 0 && buffer[i - 1] >= 0)) {
        zeroCrossings++
      }
    }
    
    return zeroCrossings / buffer.length
  }

  // 抛物线插值
  parabolicInterpolation(correlations, position) {
    const x0 = position > 0 ? correlations[position - 1] : correlations[position]
    const x1 = correlations[position]
    const x2 = position < correlations.length - 1 ? correlations[position + 1] : correlations[position]
    
    const denominator = 2 * (2 * x1 - x2 - x0)
    
    if (denominator === 0) {
      return position
    }
    
    const delta = (x2 - x0) / denominator
    return position + delta
  }

  // 计算RMS（音量）
  calculateRMS(buffer) {
    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i]
    }
    return Math.sqrt(sum / buffer.length)
  }

  // 从音频文件检测音高（改进版）
  async detectPitchFromFile(file) {
    await this.init()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const audioBuffer = await this.audioContext.decodeAudioData(e.target.result)
          const channelData = audioBuffer.getChannelData(0)
          
          // 对整个音频进行多次采样检测
          const sampleSize = 4096
          const results = []
          
          for (let offset = 0; offset < channelData.length - sampleSize; offset += sampleSize / 2) {
            const sample = channelData.slice(offset, offset + sampleSize)
            const rms = this.calculateRMS(sample)
            
            if (rms < this.rmsThreshold) continue
            
            const pitch = this.improvedAutocorrelation(sample, audioBuffer.sampleRate)
            if (pitch && pitch.frequency) {
              results.push(pitch)
            }
          }
          
          if (results.length === 0) {
            resolve(null)
          } else {
            // 按清晰度排序，取前50%的结果计算中位数
            results.sort((a, b) => b.clarity - a.clarity)
            const topResults = results.slice(0, Math.ceil(results.length / 2))
            
            const frequencies = topResults.map(r => r.frequency)
            frequencies.sort((a, b) => a - b)
            const medianFrequency = frequencies[Math.floor(frequencies.length / 2)]
            
            // 计算平均清晰度
            const avgClarity = topResults.reduce((sum, r) => sum + r.clarity, 0) / topResults.length
            
            resolve({
              frequency: parseFloat(medianFrequency.toFixed(2)),
              sampleCount: results.length,
              avgClarity: parseFloat(avgClarity.toFixed(2)),
              allPitches: frequencies
            })
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // 重置历史记录
  resetHistory() {
    this.frequencyHistory = []
  }

  // 获取音频上下文状态
  getStatus() {
    return {
      isRecording: this.isRecording,
      audioContextState: this.audioContext ? this.audioContext.state : 'uninitialized',
      historyLength: this.frequencyHistory.length,
      calibrated: this.calibrated
    }
  }
}

// 创建单例
export const pitchDetector = new PitchDetector()

// 辅助函数：将频率转换为音名
export function frequencyToNoteName(frequency, a4Frequency = 440) {
  if (!frequency || frequency <= 0) {
    return null
  }
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // 计算半音数（相对于A4）
  const semitonesFromA4 = 12 * Math.log2(frequency / a4Frequency)
  
  // 计算最近的半音
  const roundedSemitones = Math.round(semitonesFromA4)
  
  // 计算音分偏差
  const centDeviation = 100 * (semitonesFromA4 - roundedSemitones)
  
  // 计算音名和八度
  const noteIndex = (roundedSemitones + 57) % 12  // A4在索引9
  const octave = Math.floor((roundedSemitones + 57) / 12)
  
  return {
    noteName: noteNames[noteIndex],
    octave: octave,
    centDeviation: parseFloat(centDeviation.toFixed(2)),
    semitonesFromA4: parseFloat(semitonesFromA4.toFixed(2))
  }
}

// 古琴常用弦的参考频率（一弦到七弦，正调）
export const GUQIN_STRING_FREQUENCIES = {
  1: { name: '一弦', note: 'C', frequency: 130.81 },    // C3
  2: { name: '二弦', note: 'D', frequency: 146.83 },    // D3
  3: { name: '三弦', note: 'F', frequency: 174.61 },    // F3
  4: { name: '四弦', note: 'G', frequency: 196.00 },    // G3
  5: { name: '五弦', note: 'A', frequency: 220.00 },    // A3
  6: { name: '六弦', note: 'C', frequency: 261.63 },    // C4
  7: { name: '七弦', note: 'D', frequency: 293.66 }     // D4
}

// 获取信号质量描述
export function getSignalQualityDescription(quality) {
  const descriptions = {
    'excellent': { text: '优秀', color: '#48bb78', icon: '🎯' },
    'good': { text: '良好', color: '#4299e1', icon: '✓' },
    'poor': { text: '较差', color: '#ed8936', icon: '⚠' },
    'unstable': { text: '不稳定', color: '#ed8936', icon: '⚠' },
    'noise': { text: '噪音', color: '#a0aec0', icon: '🔇' },
    'not_guqin': { text: '非古琴', color: '#f56565', icon: '❌' },
    'no_pitch': { text: '无音高', color: '#a0aec0', icon: '—' }
  }
  return descriptions[quality] || descriptions['no_pitch']
}
