import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import FormData from 'form-data';
import type { VirusTotalScanResult } from '@shared/types';

interface VirusTotalFileScanResponse {
  data: {
    id: string;
    type: string;
    links: {
      self: string;
    };
  };
}

interface VirusTotalAnalysisResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      date: number;
      status: string;
      stats: {
        harmless: number;
        'type-unsupported': number;
        suspicious: number;
        'confirmed-timeout': number;
        timeout: number;
        failure: number;
        malicious: number;
        undetected: number;
      };
      results: Record<string, {
        method: string;
        engine_name: string;
        engine_version: string;
        engine_update: string;
        category: string;
        result: string;
      }>;
    };
  };
  meta: {
    file_info: {
      sha256: string;
      md5: string;
      sha1: string;
    };
  };
}

interface VirusTotalClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface ScanOptions {
  waitForCompletion?: boolean;
  maxWaitTimeMs?: number;
  pollIntervalMs?: number;
}

class VirusTotalClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: VirusTotalClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://www.virustotal.com/api/v3';
    this.timeout = options.timeout || 30000;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      'x-apikey': this.apiKey,
      'Accept': 'application/json',
    };
  }

  async uploadFile(filePath: string, options?: ScanOptions): Promise<VirusTotalScanResult> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;

    let uploadUrl = `${this.baseUrl}/files`;

    if (fileSize > 32 * 1024 * 1024) {
      uploadUrl = await this.getLargeFileUploadUrl();
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
    });

    const response = await axios.post<VirusTotalFileScanResponse>(uploadUrl, formData, {
      headers: {
        ...this.getHeaders(),
        ...formData.getHeaders(),
      },
      timeout: this.timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const scanId = response.data.data.id;

    if (options?.waitForCompletion) {
      return this.waitForScanCompletion(scanId, options);
    }

    return {
      scanId,
      permalink: response.data.data.links.self,
      positives: 0,
      total: 0,
      detectionRate: 0,
      scans: {},
      scanDate: new Date(),
    };
  }

  private async getLargeFileUploadUrl(): Promise<string> {
    const response = await axios.get(`${this.baseUrl}/files/upload_url`, {
      headers: this.getHeaders(),
      timeout: this.timeout,
    });

    return response.data.data;
  }

  async getScanResult(scanId: string): Promise<VirusTotalScanResult> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    const response = await axios.get<VirusTotalAnalysisResponse>(
      `${this.baseUrl}/analyses/${scanId}`,
      {
        headers: this.getHeaders(),
        timeout: this.timeout,
      }
    );

    return this.parseScanResult(response.data);
  }

  private parseScanResult(response: VirusTotalAnalysisResponse): VirusTotalScanResult {
    const { attributes } = response.data;
    const { stats, results, date } = attributes;

    const positives = stats.malicious + stats.suspicious;
    const total = Object.keys(results).length;
    const detectionRate = total > 0 ? positives / total : 0;

    const scans: Record<string, { detected: boolean; result: string }> = {};

    for (const [engineName, result] of Object.entries(results)) {
      scans[engineName] = {
        detected: result.category === 'malicious' || result.category === 'suspicious',
        result: result.result,
      };
    }

    return {
      scanId: response.data.id,
      permalink: `https://www.virustotal.com/gui/file/${response.meta?.file_info?.sha256 || ''}/detection`,
      positives,
      total,
      detectionRate,
      scans,
      scanDate: new Date(date * 1000),
    };
  }

  async waitForScanCompletion(
    scanId: string,
    options: ScanOptions = {}
  ): Promise<VirusTotalScanResult> {
    const maxWaitTimeMs = options.maxWaitTimeMs || 300000;
    const pollIntervalMs = options.pollIntervalMs || 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTimeMs) {
      const result = await this.getScanResult(scanId);

      if (result.total > 0) {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Scan did not complete within ${maxWaitTimeMs}ms timeout`);
  }

  async scanFile(filePath: string, options?: ScanOptions): Promise<VirusTotalScanResult> {
    const uploadResult = await this.uploadFile(filePath, options);

    if (options?.waitForCompletion) {
      return uploadResult;
    }

    return uploadResult;
  }

  async getFileReport(hash: string): Promise<VirusTotalScanResult> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    const response = await axios.get<VirusTotalAnalysisResponse>(
      `${this.baseUrl}/files/${hash}`,
      {
        headers: this.getHeaders(),
        timeout: this.timeout,
      }
    );

    return this.parseScanResult(response.data);
  }

  async rescanFile(hash: string, options?: ScanOptions): Promise<VirusTotalScanResult> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    const response = await axios.post<VirusTotalFileScanResponse>(
      `${this.baseUrl}/files/${hash}/analyse`,
      {},
      {
        headers: this.getHeaders(),
        timeout: this.timeout,
      }
    );

    const scanId = response.data.data.id;

    if (options?.waitForCompletion) {
      return this.waitForScanCompletion(scanId, options);
    }

    return {
      scanId,
      permalink: response.data.data.links.self,
      positives: 0,
      total: 0,
      detectionRate: 0,
      scans: {},
      scanDate: new Date(),
    };
  }

  calculateDetectionRate(scanResult: VirusTotalScanResult): number {
    if (scanResult.total === 0) return 0;
    return scanResult.positives / scanResult.total;
  }

  getRiskLevel(detectionRate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (detectionRate === 0) return 'low';
    if (detectionRate < 0.1) return 'medium';
    if (detectionRate < 0.3) return 'high';
    return 'critical';
  }

  async getApiUsage(): Promise<{
    daily: { used: number; remaining: number };
    hourly: { used: number; remaining: number };
    monthly: { used: number; remaining: number };
  }> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/users/${this.apiKey}/api_usage`, {
        headers: this.getHeaders(),
        timeout: this.timeout,
      });

      return {
        daily: {
          used: response.data.data.daily.used || 0,
          remaining: response.data.data.daily.remaining || 0,
        },
        hourly: {
          used: response.data.data.hourly.used || 0,
          remaining: response.data.data.hourly.remaining || 0,
        },
        monthly: {
          used: response.data.data.monthly.used || 0,
          remaining: response.data.data.monthly.remaining || 0,
        },
      };
    } catch {
      return {
        daily: { used: 0, remaining: 0 },
        hourly: { used: 0, remaining: 0 },
        monthly: { used: 0, remaining: 0 },
      };
    }
  }

  async scanUrl(url: string, options?: ScanOptions): Promise<VirusTotalScanResult> {
    if (!this.apiKey) {
      throw new Error('VirusTotal API key is not set');
    }

    const formData = new FormData();
    formData.append('url', url);

    const response = await axios.post<VirusTotalFileScanResponse>(
      `${this.baseUrl}/urls`,
      formData,
      {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders(),
        },
        timeout: this.timeout,
      }
    );

    const scanId = response.data.data.id;

    if (options?.waitForCompletion) {
      return this.waitForScanCompletion(scanId, options);
    }

    return {
      scanId,
      permalink: response.data.data.links.self,
      positives: 0,
      total: 0,
      detectionRate: 0,
      scans: {},
      scanDate: new Date(),
    };
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      await axios.get(`${this.baseUrl}/users/${this.apiKey}/api_usage`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default VirusTotalClient;
