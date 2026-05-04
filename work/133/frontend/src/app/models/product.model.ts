export interface Product {
  productId: string;
  name: string;
  description?: string;
  category?: string;
  producerName: string;
  producerAddress?: string;
  productionDate?: Date;
  batchNumber?: string;
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicData {
  productId: string;
  actorType: string;
  actorName: string;
  action: string;
  location?: string;
  timestamp?: number;
}

export interface PrivateData {
  cost?: number | string;
  internalOrderId?: string;
  routeDetails?: string;
  price?: number | string;
  commission?: number | string;
  supplierInfo?: string;
  productInfo?: {
    name: string;
    description?: string;
    category?: string;
    productionDate?: Date;
    batchNumber?: string;
    specifications?: Record<string, any>;
  };
  [key: string]: any;
}

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

export enum ActorRole {
  PRODUCER = 'producer',
  LOGISTICS = 'logistics',
  CONSUMER = 'consumer',
}

export interface ActorIdentityDto {
  role?: ActorRole;
  actorName?: string;
  actorKey?: string;
}

export interface BlockData {
  productId: string;
  actorType: string;
  actorName: string;
  action: string;
  location?: string;
  timestamp?: number;
  productInfo?: {
    name: string;
    description?: string;
    category?: string;
    productionDate?: Date;
    batchNumber?: string;
    specifications?: Record<string, any>;
  };
  [key: string]: any;
}

export interface Block {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  data: BlockData;
  nonce: number;
}

export interface TraceabilityResult {
  product: Product;
  chain: Block[];
  isValid: boolean;
}

export interface CreateProductRequest {
  productId: string;
  name: string;
  description?: string;
  category?: string;
  producerName: string;
  producerAddress?: string;
  productionDate?: Date;
  batchNumber?: string;
  specifications?: Record<string, any>;
}

export interface PrivateDataDto {
  cost?: number;
  internalOrderId?: string;
  routeDetails?: string;
  price?: number;
  commission?: number;
  supplierInfo?: string;
  [key: string]: any;
}

export interface AddLogisticsNodeRequest {
  productId: string;
  actorName: string;
  action: string;
  location?: string;
  additionalData?: Record<string, any>;
  privateData?: PrivateDataDto;
  requesterIdentity?: ActorIdentityDto;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateProductResponse {
  product: Product;
  genesisBlock: {
    index: number;
    hash: string;
    timestamp: number;
    publicData: PublicData;
    zkProof: ZKProof;
  };
  fullChain: FilteredBlockData[];
  chainLength: number;
  isValid: boolean;
}

export interface AddLogisticsNodeResponse {
  newBlock: {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    publicData: PublicData;
    zkProof: ZKProof;
  };
  fullChain: FilteredBlockData[];
  chainLength: number;
  visibleBlocksCount: number;
  isValid: boolean;
  requesterRole: ActorRole;
  requesterName?: string;
}
