export interface Pattern {
  id: number;
  name: string;
  category: 'natural' | 'geometric' | 'animal' | 'plant';
  svg_path: string;
  thumbnail: string;
  is_builtin: boolean;
  created_at: string;
}

export async function getPatterns(category?: string, search?: string): Promise<Pattern[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  const res = await fetch(`/api/patterns?${params}`);
  const data = await res.json();
  return data.patterns || [];
}

export async function getPattern(id: number): Promise<Pattern | null> {
  const res = await fetch(`/api/patterns/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.pattern;
}

export async function getTempPatterns(): Promise<Pattern[]> {
  const res = await fetch('/api/temp-patterns');
  const data = await res.json();
  return data.patterns || [];
}

export async function deleteTempPattern(id: number): Promise<boolean> {
  const res = await fetch(`/api/temp-patterns/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function uploadImage(file: File): Promise<Pattern | null> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}
