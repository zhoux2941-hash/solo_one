export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface MockApiConfig {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  delay: number;
  statusCode: number;
  responseData: any;
  isEnabled: boolean;
  createdAt: number;
}

export interface CreateMockApiDto {
  name: string;
  method: HttpMethod;
  path: string;
  delay: number;
  statusCode: number;
  responseData: any;
}

export interface UpdateMockApiDto {
  name?: string;
  method?: HttpMethod;
  path?: string;
  delay?: number;
  statusCode?: number;
  responseData?: any;
  isEnabled?: boolean;
}

export interface RequestLog {
  id: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  ip: string;
  userAgent: string;
}

export interface CreateMockApiDto {
  name: string;
  method: HttpMethod;
  path: string;
  delay: number;
  statusCode: number;
  responseData: any;
}
