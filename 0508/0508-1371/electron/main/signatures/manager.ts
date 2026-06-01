import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { app } from 'electron';
import { db } from '../database/db';
import type { AttackSignature, Severity, SignaturePattern } from '@shared/types';

interface YamlSignature {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  pattern: SignaturePattern;
}

interface YamlSignatureFile {
  signatures: YamlSignature[];
}

interface SignatureQueryOptions {
  severity?: Severity[];
  source?: ('local' | 'remote')[];
  search?: string;
  limit?: number;
  offset?: number;
}

interface UpdateResult {
  success: boolean;
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

class SignatureManager {
  private defaultSignaturesPath: string;
  private initialized: boolean = false;

  constructor() {
    this.defaultSignaturesPath = app
      ? path.join(app.getAppPath(), 'electron', 'main', 'signatures', 'default-signatures.yaml')
      : path.join(process.cwd(), 'electron', 'main', 'signatures', 'default-signatures.yaml');
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const existingSignatures = db.getAllSignatures();
    if (existingSignatures.length === 0) {
      await this.loadDefaultSignatures();
    }

    this.initialized = true;
  }

  private async loadDefaultSignatures(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.defaultSignaturesPath, 'utf-8');
      const data = yaml.load(fileContent) as YamlSignatureFile;

      if (data?.signatures && Array.isArray(data.signatures)) {
        for (const sig of data.signatures) {
          const signatureYaml = yaml.dump({ pattern: sig.pattern });
          
          const existing = db.getSignatureBySignatureId(sig.id);
          if (!existing) {
            db.addSignature({
              signatureId: sig.id,
              name: sig.name,
              description: sig.description,
              severity: sig.severity,
              pattern: sig.pattern,
              patternYaml: signatureYaml,
              createdAt: new Date(),
              updatedAt: new Date(),
              source: 'local',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load default signatures:', error);
    }
  }

  async updateFromRemote(url: string): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: false,
      added: 0,
      updated: 0,
      removed: 0,
      errors: [],
    };

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/yaml, application/x-yaml, text/yaml, text/plain',
        },
      });

      const data = yaml.load(response.data) as YamlSignatureFile;
      
      if (!data?.signatures || !Array.isArray(data.signatures)) {
        result.errors.push('Invalid signature file format');
        return result;
      }

      const remoteSignatureIds = new Set<string>();
      const existingSignatures = db.getAllSignatures();
      const existingIds = new Set(existingSignatures.map(s => s.signatureId));

      for (const sig of data.signatures) {
        remoteSignatureIds.add(sig.id);
        const signatureYaml = yaml.dump({ pattern: sig.pattern });
        
        const existing = db.getSignatureBySignatureId(sig.id);
        
        if (existing) {
          db.updateSignature(parseInt(existing.id), {
            name: sig.name,
            description: sig.description,
            severity: sig.severity,
            patternYaml: signatureYaml,
            source: 'remote',
          });
          result.updated++;
        } else {
          db.addSignature({
            signatureId: sig.id,
            name: sig.name,
            description: sig.description,
            severity: sig.severity,
            pattern: sig.pattern,
            patternYaml: signatureYaml,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'remote',
          });
          result.added++;
        }
      }

      for (const sig of existingSignatures) {
        if (sig.source === 'remote' && !remoteSignatureIds.has(sig.signatureId)) {
          db.deleteSignature(parseInt(sig.id));
          result.removed++;
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Update failed: ${(error as Error).message}`);
    }

    return result;
  }

  getAllSignatures(): AttackSignature[] {
    return db.getAllSignatures();
  }

  getSignatureById(id: number): AttackSignature | null {
    return db.getSignatureById(id);
  }

  getSignatureBySignatureId(signatureId: string): AttackSignature | null {
    return db.getSignatureBySignatureId(signatureId);
  }

  querySignatures(options: SignatureQueryOptions = {}): AttackSignature[] {
    let signatures = db.getAllSignatures();

    if (options.severity && options.severity.length > 0) {
      signatures = signatures.filter(s => options.severity!.includes(s.severity));
    }

    if (options.source && options.source.length > 0) {
      signatures = signatures.filter(s => options.source!.includes(s.source));
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      signatures = signatures.filter(
        s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower) ||
          s.signatureId.toLowerCase().includes(searchLower)
      );
    }

    if (options.offset) {
      signatures = signatures.slice(options.offset);
    }

    if (options.limit) {
      signatures = signatures.slice(0, options.limit);
    }

    return signatures;
  }

  addSignature(signature: Omit<AttackSignature, 'id'>): number {
    return db.addSignature(signature);
  }

  createSignature(
    signatureId: string,
    name: string,
    description: string,
    severity: Severity,
    pattern: SignaturePattern
  ): number {
    const patternYaml = yaml.dump({ pattern });
    
    return db.addSignature({
      signatureId,
      name,
      description,
      severity,
      pattern,
      patternYaml,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'local',
    });
  }

  updateSignature(
    id: number,
    updates: Partial<Omit<AttackSignature, 'id' | 'signatureId' | 'createdAt'>>
  ): void {
    const updateData: Partial<Omit<AttackSignature, 'id' | 'signatureId'>> = {
      ...updates,
    };

    if (updates.pattern) {
      updateData.patternYaml = yaml.dump({ pattern: updates.pattern });
    }

    db.updateSignature(id, updateData);
  }

  deleteSignature(id: number): void {
    db.deleteSignature(id);
  }

  async exportSignatures(filePath: string, options?: {
    includeRemote?: boolean;
    severity?: Severity[];
  }): Promise<void> {
    let signatures = db.getAllSignatures();

    if (options?.includeRemote === false) {
      signatures = signatures.filter(s => s.source === 'local');
    }

    if (options?.severity) {
      signatures = signatures.filter(s => options.severity!.includes(s.severity));
    }

    const yamlSignatures: YamlSignature[] = signatures.map(s => ({
      id: s.signatureId,
      name: s.name,
      description: s.description,
      severity: s.severity,
      pattern: s.pattern,
    }));

    const yamlContent = yaml.dump({ signatures: yamlSignatures }, {
      indent: 2,
      lineWidth: -1,
    });

    await fs.writeFile(filePath, yamlContent, 'utf-8');
  }

  async importSignatures(filePath: string, source: 'local' | 'remote' = 'local'): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: false,
      added: 0,
      updated: 0,
      removed: 0,
      errors: [],
    };

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = yaml.load(fileContent) as YamlSignatureFile;

      if (!data?.signatures || !Array.isArray(data.signatures)) {
        result.errors.push('Invalid signature file format');
        return result;
      }

      for (const sig of data.signatures) {
        const signatureYaml = yaml.dump({ pattern: sig.pattern });
        
        const existing = db.getSignatureBySignatureId(sig.id);
        
        if (existing) {
          db.updateSignature(parseInt(existing.id), {
            name: sig.name,
            description: sig.description,
            severity: sig.severity,
            patternYaml: signatureYaml,
            source,
          });
          result.updated++;
        } else {
          db.addSignature({
            signatureId: sig.id,
            name: sig.name,
            description: sig.description,
            severity: sig.severity,
            pattern: sig.pattern,
            patternYaml: signatureYaml,
            createdAt: new Date(),
            updatedAt: new Date(),
            source,
          });
          result.added++;
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Import failed: ${(error as Error).message}`);
    }

    return result;
  }

  getSignaturesBySeverity(severity: Severity): AttackSignature[] {
    return db.getAllSignatures().filter(s => s.severity === severity);
  }

  getSignaturesBySource(source: 'local' | 'remote'): AttackSignature[] {
    return db.getAllSignatures().filter(s => s.source === source);
  }

  getSignaturePattern(signatureId: string): SignaturePattern | null {
    const signature = db.getSignatureBySignatureId(signatureId);
    if (!signature) return null;
    return signature.pattern;
  }

  parsePatternYaml(patternYaml: string): SignaturePattern | null {
    try {
      const data = yaml.load(patternYaml) as { pattern: SignaturePattern };
      return data.pattern;
    } catch {
      return null;
    }
  }

  getStats(): {
    total: number;
    bySeverity: Record<Severity, number>;
    bySource: { local: number; remote: number };
  } {
    const signatures = db.getAllSignatures();
    
    const stats: {
      total: number;
      bySeverity: Record<Severity, number>;
      bySource: { local: number; remote: number };
    } = {
      total: signatures.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      bySource: {
        local: 0,
        remote: 0,
      },
    };

    for (const sig of signatures) {
      stats.bySeverity[sig.severity]++;
      stats.bySource[sig.source]++;
    }

    return stats;
  }

  async resetToDefaults(): Promise<void> {
    const signatures = db.getAllSignatures();
    
    for (const sig of signatures) {
      db.deleteSignature(parseInt(sig.id));
    }

    await this.loadDefaultSignatures();
  }

  validateSignature(signature: Omit<AttackSignature, 'id'>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!signature.signatureId || signature.signatureId.trim() === '') {
      errors.push('Signature ID is required');
    }

    if (!signature.name || signature.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!signature.severity || !['low', 'medium', 'high', 'critical'].includes(signature.severity)) {
      errors.push('Invalid severity level');
    }

    if (!signature.pattern) {
      errors.push('Pattern is required');
    } else {
      if (!signature.pattern.type) {
        errors.push('Pattern type is required');
      }
      
      if (!['sequence', 'statistical', 'mouse', 'regex'].includes(signature.pattern.type)) {
        errors.push('Invalid pattern type');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const signatureManager = new SignatureManager();
export default SignatureManager;
export type { SignatureQueryOptions, UpdateResult, YamlSignature };
