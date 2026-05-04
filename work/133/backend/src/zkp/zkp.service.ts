import { Injectable, Logger } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

export interface ZKProof {
  commitment: string;
  salt: string;
  proofHash: string;
  statement: string;
}

export interface ZKVerifyResult {
  valid: boolean;
  statement: string;
  verifiedAt: number;
}

@Injectable()
export class ZKPService {
  private readonly logger = new Logger(ZKPService.name);

  generateSalt(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  generateCommitment(secretData: Record<string, any>, salt: string): string {
    const dataString = JSON.stringify(secretData);
    return CryptoJS.SHA256(dataString + salt).toString();
  }

  generateProof(
    statement: string,
    secretData: Record<string, any>,
  ): ZKProof {
    const salt = this.generateSalt();
    const commitment = this.generateCommitment(secretData, salt);
    const proofHash = CryptoJS.SHA256(statement + commitment + salt).toString();

    this.logger.log(`Generated ZK Proof for statement: ${statement}`);

    return {
      commitment,
      salt,
      proofHash,
      statement,
    };
  }

  verifyProof(
    proof: ZKProof,
    secretData: Record<string, any>,
  ): ZKVerifyResult {
    const commitment = this.generateCommitment(secretData, proof.salt);
    const proofHash = CryptoJS.SHA256(
      proof.statement + commitment + proof.salt,
    ).toString();

    const valid = commitment === proof.commitment && proofHash === proof.proofHash;

    this.logger.log(
      `ZK Proof verification result: ${valid ? 'VALID' : 'INVALID'} for statement: ${proof.statement}`,
    );

    return {
      valid,
      statement: proof.statement,
      verifiedAt: Date.now(),
    };
  }

  verifyProofWithoutSecret(
    proof: ZKProof,
  ): ZKVerifyResult {
    this.logger.log(
      `Verifying ZK Proof without secret data (zero-knowledge) for statement: ${proof.statement}`,
    );

    const proofHashValid = CryptoJS.SHA256(
      proof.statement + proof.commitment + proof.salt,
    ).toString() === proof.proofHash;

    this.logger.log(
      `ZK Proof structure verification: ${proofHashValid ? 'VALID' : 'INVALID'}`,
    );

    return {
      valid: proofHashValid,
      statement: proof.statement,
      verifiedAt: Date.now(),
    };
  }

  generateLogisticsProof(
    actorName: string,
    action: string,
    sensitiveData: {
      cost?: number;
      internalOrderId?: string;
      routeDetails?: string;
      [key: string]: any;
    },
  ): { proof: ZKProof; publicStatement: string } {
    const publicStatement = `物流商 "${actorName}" 执行了 "${action}" 操作`;

    const secretData = {
      actorName,
      action,
      ...sensitiveData,
      timestamp: Date.now(),
    };

    const proof = this.generateProof(publicStatement, secretData);

    this.logger.log(
      `Generated logistics ZK proof: actor=${actorName}, action=${action}`,
    );

    return {
      proof,
      publicStatement,
    };
  }

  encryptPrivateData(
    data: Record<string, any>,
    encryptionKey: string,
  ): string {
    const dataString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(dataString, encryptionKey).toString();
  }

  decryptPrivateData(
    encryptedData: string,
    encryptionKey: string,
  ): Record<string, any> | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt private data');
      return null;
    }
  }

  generateActorKey(actorType: string, actorName: string): string {
    const keyMaterial = `${actorType}:${actorName}:${Date.now().toString().slice(0, -6)}`;
    return CryptoJS.SHA256(keyMaterial).toString();
  }

  maskSensitiveData(
    data: Record<string, any>,
    fieldsToMask: string[] = ['cost', 'internalOrderId', 'routeDetails', 'price', 'commission'],
  ): Record<string, any> {
    const masked: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (fieldsToMask.includes(key)) {
        masked[key] = '*** [隐私保护]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value as Record<string, any>, fieldsToMask);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}
