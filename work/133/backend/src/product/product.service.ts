import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ZKPService, ZKProof, ZKVerifyResult } from '../zkp/zkp.service';
import { Product, ProductDocument } from './schemas/product.schema';
import { BlockDocument, PublicData, PrivateData } from '../blockchain/schemas/block.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { AddLogisticsNodeDto } from './dto/add-logistics-node.dto';
import { ActorRole, ActorIdentityDto } from './dto/privacy.dto';

export interface FilteredBlockData {
  index: number;
  timestamp: number;
  hash: string;
  previousHash: string;
  publicData: PublicData;
  privateData?: PrivateData | null;
  zkProof?: ZKProof;
  zkVerification?: ZKVerifyResult;
  isVisible: boolean;
  visibilityReason: string;
}

export interface PrivacyFilterResult {
  product: Product;
  chain: FilteredBlockData[];
  isValid: boolean;
  requesterRole: ActorRole;
  requesterName?: string;
  visibleBlocksCount: number;
  totalBlocksCount: number;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private blockchainService: BlockchainService,
    private zkpService: ZKPService,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<{ product: Product; genesisBlock: any; fullChain: FilteredBlockData[]; chainLength: number; isValid: boolean }> {
    const existingProduct = await this.productModel.findOne({ productId: createProductDto.productId }).exec();
    if (existingProduct) {
      throw new BadRequestException(`Product with ID ${createProductDto.productId} already exists`);
    }

    const product = new this.productModel(createProductDto);
    await product.save();

    const producerPrivateData: PrivateData = {
      productInfo: {
        name: createProductDto.name,
        description: createProductDto.description,
        category: createProductDto.category,
        productionDate: createProductDto.productionDate,
        batchNumber: createProductDto.batchNumber,
        specifications: createProductDto.specifications,
      },
    };

    const genesisBlock = await this.blockchainService.createGenesisBlock(
      createProductDto.productId,
      createProductDto.producerName,
      {
        name: createProductDto.name,
        description: createProductDto.description,
        category: createProductDto.category,
        productionDate: createProductDto.productionDate,
        batchNumber: createProductDto.batchNumber,
        specifications: createProductDto.specifications,
      },
      producerPrivateData,
    );

    const fullChain = await this.blockchainService.getBlockchain(createProductDto.productId);
    const isValid = await this.blockchainService.isChainValid(createProductDto.productId);

    const formattedChain = this.filterBlocksByRole(
      fullChain,
      ActorRole.PRODUCER,
      createProductDto.producerName,
    );

    this.logger.log(`Product ${createProductDto.productId} created with genesis block`);

    return {
      product,
      genesisBlock: {
        index: genesisBlock.index,
        hash: genesisBlock.hash,
        timestamp: genesisBlock.timestamp,
        publicData: genesisBlock.publicData,
        zkProof: genesisBlock.zkProof,
      },
      fullChain: formattedChain,
      chainLength: formattedChain.length,
      isValid,
    };
  }

  async findProductById(productId: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ productId }).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product;
  }

  async addLogisticsNode(addLogisticsNodeDto: AddLogisticsNodeDto): Promise<any> {
    const product = await this.findProductById(addLogisticsNodeDto.productId);
    
    const newBlock = await this.blockchainService.addBlock(
      addLogisticsNodeDto.productId,
      'logistics',
      addLogisticsNodeDto.actorName,
      addLogisticsNodeDto.action,
      {
        location: addLogisticsNodeDto.location,
        ...addLogisticsNodeDto.additionalData,
      },
      addLogisticsNodeDto.privateData,
    );

    const fullChain = await this.blockchainService.getBlockchain(addLogisticsNodeDto.productId);
    const isValid = await this.blockchainService.isChainValid(addLogisticsNodeDto.productId);

    const requesterRole = addLogisticsNodeDto.requesterIdentity?.role || ActorRole.LOGISTICS;
    const requesterName = addLogisticsNodeDto.requesterIdentity?.actorName || addLogisticsNodeDto.actorName;

    const formattedChain = this.filterBlocksByRole(
      fullChain,
      requesterRole,
      requesterName,
    );

    this.logger.log(`Logistics node added for product ${addLogisticsNodeDto.productId} by ${addLogisticsNodeDto.actorName}`);

    return {
      newBlock: {
        index: newBlock.index,
        hash: newBlock.hash,
        previousHash: newBlock.previousHash,
        timestamp: newBlock.timestamp,
        publicData: newBlock.publicData,
        zkProof: newBlock.zkProof,
      },
      fullChain: formattedChain,
      chainLength: formattedChain.length,
      visibleBlocksCount: formattedChain.filter(b => b.isVisible).length,
      isValid,
      requesterRole,
      requesterName,
    };
  }

  async getTraceability(
    productId: string,
    requesterIdentity?: ActorIdentityDto,
  ): Promise<PrivacyFilterResult> {
    const product = await this.findProductById(productId);
    const chain = await this.blockchainService.getBlockchain(productId);
    
    if (chain.length === 0) {
      throw new NotFoundException(`No blockchain found for product ${productId}`);
    }

    const isValid = await this.blockchainService.isChainValid(productId);

    const requesterRole = requesterIdentity?.role || ActorRole.CONSUMER;
    const requesterName = requesterIdentity?.actorName;

    this.logger.log(
      `Traceability requested for product ${productId} by role: ${requesterRole}, name: ${requesterName || 'unknown'}`,
    );

    const filteredChain = this.filterBlocksByRole(chain, requesterRole, requesterName);

    return {
      product,
      chain: filteredChain,
      isValid,
      requesterRole,
      requesterName,
      visibleBlocksCount: filteredChain.filter(b => b.isVisible).length,
      totalBlocksCount: filteredChain.length,
    };
  }

  async getAllProducts(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  private filterBlocksByRole(
    blocks: BlockDocument[],
    requesterRole: ActorRole,
    requesterName?: string,
  ): FilteredBlockData[] {
    return blocks.map((block) => {
      const blockActorName = block.publicData?.actorName || block.legacyData?.actorName;
      const blockActorType = block.publicData?.actorType || block.legacyData?.actorType;

      let isVisible = false;
      let visibilityReason = '';
      let privateData: PrivateData | null = null;
      let zkVerification: ZKVerifyResult | undefined;

      if (block.zkProof) {
        zkVerification = this.zkpService.verifyProofWithoutSecret(block.zkProof);
      }

      switch (requesterRole) {
        case ActorRole.PRODUCER:
          isVisible = true;
          visibilityReason = '生产商可见所有数据';
          privateData = this.blockchainService.getDecryptedPrivateData(block);
          break;

        case ActorRole.LOGISTICS:
          if (requesterName && blockActorName === requesterName) {
            isVisible = true;
            visibilityReason = '物流商可见自己的运输段';
            privateData = this.blockchainService.getDecryptedPrivateData(block);
          } else if (blockActorType === 'producer') {
            isVisible = true;
            visibilityReason = '生产商信息对物流商可见';
            privateData = this.maskSensitiveData(
              this.blockchainService.getDecryptedPrivateData(block),
            );
          } else {
            isVisible = false;
            visibilityReason = '其他物流商的数据被隐私保护隐藏';
          }
          break;

        case ActorRole.CONSUMER:
        default:
          isVisible = true;
          visibilityReason = '消费者可见公开数据和ZKP证明';
          privateData = null;
          break;
      }

      const result: FilteredBlockData = {
        index: block.index,
        timestamp: block.timestamp,
        hash: block.hash,
        previousHash: block.previousHash,
        publicData: block.publicData || {
          productId: block.legacyData?.productId || '',
          actorType: block.legacyData?.actorType || '',
          actorName: block.legacyData?.actorName || '',
          action: block.legacyData?.action || '',
          location: block.legacyData?.location,
          timestamp: block.legacyData?.timestamp,
        },
        isVisible,
        visibilityReason,
      };

      if (isVisible && privateData) {
        result.privateData = privateData;
      }

      if (block.zkProof) {
        result.zkProof = {
          commitment: block.zkProof.commitment,
          salt: '*** [隐私保护]',
          proofHash: block.zkProof.proofHash,
          statement: block.zkProof.statement,
        };
        result.zkVerification = zkVerification;
      }

      return result;
    });
  }

  private maskSensitiveData(
    data: PrivateData | null,
  ): PrivateData | null {
    if (!data) {
      return null;
    }

    const sensitiveFields = ['cost', 'internalOrderId', 'routeDetails', 'price', 'commission', 'supplierInfo'];
    const masked: PrivateData = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key)) {
        masked[key] = '*** [隐私保护]' as any;
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value as PrivateData);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  async verifyZKProofForBlock(
    productId: string,
    blockIndex: number,
  ): Promise<{ valid: boolean; statement: string; verifiedAt: number }> {
    const chain = await this.blockchainService.getBlockchain(productId);
    const block = chain.find(b => b.index === blockIndex);

    if (!block) {
      throw new NotFoundException(`Block #${blockIndex} not found for product ${productId}`);
    }

    if (!block.zkProof) {
      throw new BadRequestException(`Block #${blockIndex} has no ZK proof`);
    }

    const result = this.zkpService.verifyProofWithoutSecret(block.zkProof);

    this.logger.log(
      `ZK Proof verification for block #${blockIndex} of product ${productId}: ${result.valid ? 'VALID' : 'INVALID'}`,
    );

    return result;
  }
}
