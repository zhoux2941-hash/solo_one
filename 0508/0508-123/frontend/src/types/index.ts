export interface Telescope {
  id: number
  name: string
  primaryMirror: string
  cameraModel: string
  fieldOfView: number
  limitingMagnitude: number
  status: string
  minElevation: number
  description?: string
}

export interface SlotInfo {
  startTime: string
  endTime: string
  available: boolean
  bookedBy?: string
  bookingId?: string
}

export interface Booking {
  id: number
  telescope: Telescope
  userId: string
  userName: string
  startTime: string
  endTime: string
  ra: number
  dec: number
  exposureTime: number
  targetName: string
  elevation?: number
  status: string
  createdAt: string
}

export interface BookingRequest {
  telescopeId: number
  userId: string
  userName: string
  startTime: string
  endTime: string
  ra: number
  dec: number
  exposureTime: number
  targetName: string
}

export interface BookingResponse {
  success: boolean
  message: string
  bookingId: number
  elevation: number
}

export interface ObservationImage {
  id: number
  booking: Booking
  rawImagePath: string
  flatImagePath: string
  calibratedImagePath: string
  avgSkyBrightness: number
  generatedAt: string
}

export interface ImageStatus {
  ready: boolean
  message?: string
  generatedAt?: string
  skyBrightness?: number
  calibratedPath?: string
}

export interface GuideStarCatalog {
  name: string
  ra: number
  dec: number
  magnitude: number
  constellation: string
}

export interface GuideStarRequest {
  telescopeId: number
  guideStarName: string
  guideStarRa: number
  guideStarDec: number
  targetRa: number
  targetDec: number
  observationTime: string
  exposureTime?: number
}

export interface GuideStarAnalysis {
  guideStarName: string
  guideStarRa: number
  guideStarDec: number
  targetRa: number
  targetDec: number
  separation: number
  guideStarElevation: number
  targetElevation: number
  avgRmsError: number
  maxError: number
  quality: string
  guidingMode: string
}

export interface GuideStarDataPoint {
  frame: number
  raError: number
  decError: number
  totalError: number
  timestamp: number
}

export interface CorrectionSuggestion {
  type: string
  priority: string
  title: string
  description: string
}

export interface GuideStarResponse {
  success: boolean
  message: string
  analysis: GuideStarAnalysis
  errorCurve: GuideStarDataPoint[]
  suggestions: CorrectionSuggestion[]
}
