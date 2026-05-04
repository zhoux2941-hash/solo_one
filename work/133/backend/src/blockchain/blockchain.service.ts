import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as CryptoJS from 'crypto-js';
import { Block, BlockDocument, PublicData, PrivateData, ZKProof } from './schemas/block.schema';
import { ZKPService } from '../zkp/zkp.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly difficulty = 4;
  private readonly maxRetries = 5;
  private readonly retryDelayMs = 100;
  private readonly globalEncryptionKey = 'supply-chain-traceability-global-key-2026';

  constructor(
    @InjectModel(Block.name) private blockModel: Model<BlockDocument>,
    private zkpService: ZKPService,
  ) {}

  calculateHash(
    index: number,
    previousHash: string,
    timestamp: number,
    publicData: PublicData,
    zkProof: ZKProof,
    nonce: number,
  ): string {
    return CryptoJS.SHA256(
      index + previousHash + timestamp + JSON.stringify(publicData) + JSON.stringify(zkProof) + nonce,
    ).toString();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getLatestBlock(productId: string): Promise<BlockDocument | null> {
    const block = await this.blockModel
      .findOne({ 'publicData.productId': productId })
      .sort({ index: -1 })
      .exec();
    
    if (!block) {
      return await this.blockModel
        .findOne({ 'legacyData.productId': productId })
        .sort({ index: -1 })
        .exec();
    }
    return block;
  }

  async getGenesisBlock(productId: string): Promise<BlockDocument | null> {
    const block = await this.blockModel
      .findOne({ 'publicData.productId': productId, index: 0 })
      .exec();
    
    if (!block) {
      return await this.blockModel
        .findOne({ 'legacyData.productId': productId, index: 0 })
        .exec();
    }
    return block;
  }

  async getBlockchain(productId: string): Promise<BlockDocument[]> {
    const blocks = await this.blockModel
      .find({ 'publicData.productId': productId })
      .sort({ index: 1 })
      .exec();
    
    if (blocks.length === 0) {
      return await this.blockModel
        .find({ 'legacyData.productId': productId })
        .sort({ index: 1 })
        .exec();
    }
    return blocks;
  }

  async createGenesisBlock(
    productId: string,
    producerName: string,
    productData: any,
    privateData?: PrivateData,
  ): Promise<BlockDocument> {
    const existingGenesis = await this.getGenesisBlock(productId);
    if (existingGenesis) {
      throw new Error(`Product ${productId} already has a genesis block`);
    }

    const timestamp = Date.now();
    
    const publicData: PublicData = {
      productId,
      actorType: 'producer',
      actorName: producerName,
      action: 'product_creation',
      timestamp,
    };

    const privateDataToEncrypt: PrivateData = {
      ...privateData,
      productInfo: productData,
    };

    const { proof, publicStatement } = this.zkpService.generateLogisticsProof(
      producerName,
      'product_creation',
      privateDataToEncrypt,
    );

    const encryptedPrivateData = this.zkpService.encryptPrivateData(
      privateDataToEncrypt,
      this.globalEncryptionKey,
    );

    const nonce = this.proofOfWork(0, '0', timestamp, publicData, proof);
    const hash = this.calculateHash(0, '0', timestamp, publicData, proof, nonce);

    const genesisBlock = new this.blockModel({
      index: 0,
      timestamp,
      previousHash: '0',
      hash,
      publicData,
      encryptedPrivateData,
      zkProof: proof,
      nonce,
      legacyData: {
        productId,
        actorType: 'producer',
        actorName: producerName,
        action: 'product_creation',
        productInfo: productData,
        timestamp,
      },
    });

    this.logger.log(`Genesis block created for product ${productId} with ZK proof`);

    return genesisBlock.save();
  }

  async addBlock(
    productId: string,
    actorType: string,
    actorName: string,
    action: string,
    additionalData: any = {},
    privateData?: PrivateData,
  ): Promise<BlockDocument> {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      const latestBlock = await this.getLatestBlock(productId);
      if (!latestBlock) {
        throw new Error(`No blockchain found for product ${productId}`);
      }

      const newIndex = latestBlock.index + 1;
      const timestamp = Date.now();

      const publicData: PublicData = {
        productId,
        actorType,
        actorName,
        action,
        location: additionalData.location,
        timestamp,
      };

      const privateDataToEncrypt: PrivateData = {
        ...privateData,
        ...additionalData,
      };

      const { proof, publicStatement } = this.zkpService.generateLogisticsProof(
        actorName,
        action,
        privateDataToEncrypt,
      );

      const encryptedPrivateData = this.zkpService.encryptPrivateData(
        privateDataToEncrypt,
        this.globalEncryptionKey,
      );

      const nonce = this.proofOfWork(
        newIndex,
        latestBlock.hash,
        timestamp,
        publicData,
        proof,
      );
      const hash = this.calculateHash(
        newIndex,
        latestBlock.hash,
        timestamp,
        publicData,
        proof,
        nonce,
      );

      const newBlock = new this.blockModel({
        index: newIndex,
        timestamp,
        previousHash: latestBlock.hash,
        hash,
        publicData,
        encryptedPrivateData,
        zkProof: proof,
        nonce,
        legacyData: {
          productId,
          actorType,
          actorName,
          action,
          location: additionalData.location,
          timestamp,
          ...additionalData,
        },
      });

      try {
        const savedBlock = await newBlock.save();
        this.logger.log(`Block #${savedBlock.index} added successfully for product ${productId} with ZK proof`);
        return savedBlock;
      } catch (error: any) {
        if (error.code === 11000) {
          retries++;
          this.logger.warn(`Duplicate key error for product ${productId}, retrying... (${retries}/${this.maxRetries})`);
          await this.delay(this.retryDelayMs * retries);
          continue;
        }
        this.logger.error(`Failed to add block for product ${productId}: ${error.message}`);
        throw error;
      }
    }

    throw new Error(`Failed to add block after ${this.maxRetries} retries due to concurrent writes`);
  }

  proofOfWork(
    index: number,
    previousHash: string,
    timestamp: number,
    publicData: PublicData,
    zkProof: ZKProof,
  ): number {
    let nonce = 0;
    while (!this.validProof(index, previousHash, timestamp, publicData, zkProof, nonce)) {
      nonce++;
    }
    return nonce;
  }

  validProof(
    index: number,
    previousHash: string,
    timestamp: number,
    publicData: PublicData,
    zkProof: ZKProof,
    nonce: number,
  ): boolean {
    const guess = this.calculateHash(
      index,
      previousHash,
      timestamp,
      publicData,
      zkProof,
      nonce,
    );
    return guess.substring(0, this.difficulty) === '0'.repeat(this.difficulty);
  }

  async isChainValid(productId: string): Promise<boolean> {
    const chain = await this.getBlockchain(productId);
    if (chain.length === 0) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (currentBlock.publicData && currentBlock.zkProof) {
        if (
          currentBlock.hash !==
          this.calculateHash(
            currentBlock.index,
            currentBlock.previousHash,
            currentBlock.timestamp,
            currentBlock.publicData,
            currentBlock.zkProof,
            currentBlock.nonce,
          )
        ) {
          return false;
        }

        const zkValid = this.zkpService.verifyProofWithoutSecret(currentBlock.zkProof).valid;
        if (!zkValid) {
          this.logger.warn(`ZK Proof invalid for block #${currentBlock.index}`);
          return false;
        }
      } else if (currentBlock.legacyData) {
        if (
          currentBlock.hash !==
          this.calculateHashLegacy(
            currentBlock.index,
            currentBlock.previousHash,
            currentBlock.timestamp,
            currentBlock.legacyData,
            currentBlock.nonce,
          )
        ) {
          return false;
        }
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  private calculateHashLegacy(
    index: number,
    previousHash: string,
    timestamp: number,
    data: any,
    nonce: number,
  ): string {
    return CryptoJS.SHA256(
      index + previousHash + timestamp + JSON.stringify(data) + nonce,
    ).toString();
  }

  getDecryptedPrivateData(block: BlockDocument): PrivateData | null {
    if (!block.encryptedPrivateData) {
      return null;
    }
    return this.zkpService.decryptPrivateData(
      block.encryptedPrivateData,
      this.globalEncryptionKey,
    );
  }

  verifyBlockZKProof(block: BlockDocument): boolean {
    if (!block.zkProof) {
      return true;
    }
    return this.zkpService.verifyProofWithoutSecret(block.zkProof).valid;
  }
}
