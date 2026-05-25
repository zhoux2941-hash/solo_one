export interface SignWord {
  id: string
  word: string
  description: string
  video_url: string
}

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface CompareResult {
  score: number
  word: string
  frame_count: number
  similarity_per_frame: number[]
  landmark_deviations: LandmarkDeviation[]
  path_metrics?: PathMetrics
  frame_count_template?: number
  frame_count_input?: number
  warping_path?: [number, number][]
}

export interface PathMetrics {
  continuity: number
  time_stretch_ratio: number
  time_stretch_factor: number
  path_efficiency: number
  band_width_used: number
  original_template_frames: number
  original_input_frames: number
  normalized_frames: number
}

export interface LandmarkDeviation {
  landmark_index: number
  average_deviation: number
  max_deviation: number
  deviation_per_frame: number[]
}

export interface User {
  id: number
  username: string
  created_at: string
}

export interface PracticeRecord {
  id: number
  user_id: number
  word: string
  score: number
  created_at: string
}

export interface PracticeHistory {
  word: string
  records: PracticeRecord[]
  average_score: number
  best_score: number
  total_attempts: number
}

export interface Challenge {
  id: number
  challenge_code: string
  challenger_id: number
  challengee_id: number | null
  word: string
  target_score: number
  challenger_score: number | null
  challengee_score: number | null
  winner_id: number | null
  status: 'pending' | 'accepted' | 'completed' | 'expired'
  expires_at: string
  created_at: string
  challenger?: User
  challengee?: User
  winner?: User
}

export interface LeaderboardEntry {
  user_id: number
  username: string
  word: string
  best_score: number
  total_attempts: number
  average_score: number
  updated_at: string
}

export interface UserStats {
  user_id: number
  username: string
  total_attempts: number
  best_overall_score: number
  average_score: number
  words_attempted: number
  rank: number | null
  challenges_created: number
  challenges_won: number
}

export interface ChallengeCreateRequest {
  word: string
  target_score?: number
  challengee_id?: number
  expires_in_hours: number
}
