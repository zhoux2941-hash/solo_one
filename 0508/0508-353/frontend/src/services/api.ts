import type {
  SignWord,
  User,
  CompareResult,
  PracticeHistory,
  PracticeRecord,
  Challenge,
  LeaderboardEntry,
  UserStats,
  ChallengeCreateRequest
} from '../types'

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || '请求失败')
  }

  return response.json()
}

export async function getSignWords() {
  return request<SignWord[]>('/words')
}

export async function createUser(username: string) {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}

export async function getUser(userId: number) {
  return request<User>(`/users/${userId}`)
}

export async function compareSign(
  wordId: string,
  userId: number,
  videoFile: File
) {
  const formData = new FormData()
  formData.append('video', videoFile)

  const response = await fetch(
    `${API_BASE}/compare/${wordId}?user_id=${userId}`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || '比对失败')
  }

  return response.json() as Promise<CompareResult>
}

export async function compareSignForChallenge(
  wordId: string,
  challengeCode: string,
  userId: number,
  videoFile: File
) {
  const formData = new FormData()
  formData.append('video', videoFile)

  const response = await fetch(
    `${API_BASE}/compare/${wordId}/challenge/${challengeCode}?user_id=${userId}`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).detail || '比对失败')
  }

  return response.json() as Promise<CompareResult>
}

export async function getPracticeHistory(userId: number, wordId?: string) {
  const url = wordId
    ? `/history/${userId}?word_id=${wordId}`
    : `/history/${userId}`
  return request<PracticeHistory[]>(url)
}

export async function getPracticeRecords(
  userId: number,
  wordId?: string,
  limit: number = 50
) {
  const params = new URLSearchParams()
  if (wordId) params.append('word_id', wordId)
  params.append('limit', String(limit))

  return request<PracticeRecord[]>(
    `/history/${userId}/records?${params.toString()}`
  )
}

export async function deletePracticeRecord(recordId: number) {
  return request(`/records/${recordId}`, {
    method: 'DELETE',
  })
}

export async function createChallenge(
  userId: number,
  data: ChallengeCreateRequest
) {
  return request<Challenge>(`/challenges?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function acceptChallenge(challengeCode: string, userId: number) {
  return request<Challenge>(`/challenges/accept?challenge_code=${encodeURIComponent(challengeCode)}&user_id=${userId}`, {
    method: 'POST',
  })
}

export async function getChallenge(challengeCode: string) {
  return request<Challenge>(`/challenges/${encodeURIComponent(challengeCode)}`)
}

export async function getUserChallenges(
  userId: number,
  status?: string
) {
  const url = status
    ? `/users/${userId}/challenges?status=${status}`
    : `/users/${userId}/challenges`
  return request<Challenge[]>(url)
}

export async function resignChallenge(challengeCode: string, userId: number) {
  return request(`/challenges/${encodeURIComponent(challengeCode)}/resign?user_id=${userId}`, {
    method: 'POST',
  })
}

export async function getLeaderboard(wordId?: string, limit: number = 20) {
  const params = new URLSearchParams()
  if (wordId) params.append('word_id', wordId)
  params.append('limit', String(limit))
  return request<LeaderboardEntry[]>(`/leaderboard?${params.toString()}`)
}

export async function getGlobalLeaderboard(limit: number = 20) {
  return request<LeaderboardEntry[]>(`/leaderboard/global?limit=${limit}`)
}

export async function getUserStats(userId: number) {
  return request<UserStats>(`/users/${userId}/stats`)
}
