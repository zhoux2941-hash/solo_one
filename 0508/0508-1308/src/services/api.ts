import type { Role, Character, FacePattern, ColorSymbolism, ApiResponse } from '../../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  const data = await response.json() as ApiResponse<T>;
  
  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }
  
  return data.data;
}

export async function fetchRoles(): Promise<Role[]> {
  return fetchApi<Role[]>('/roles');
}

export async function fetchCharacters(roleId: number): Promise<Character[]> {
  return fetchApi<Character[]>(`/characters?roleId=${roleId}`);
}

export async function fetchFacePattern(characterId: number): Promise<FacePattern> {
  return fetchApi<FacePattern>(`/face-patterns?characterId=${characterId}`);
}

export async function fetchColorSymbolism(): Promise<ColorSymbolism[]> {
  return fetchApi<ColorSymbolism[]>('/color-symbolism');
}
