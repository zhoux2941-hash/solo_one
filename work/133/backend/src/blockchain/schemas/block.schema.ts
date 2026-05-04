import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Block & Document;

export interface ZKProof {
  commitment: string;
  salt: string;
  proofHash: string;
  statement: string;
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
  cost?: number;
  internalOrderId?: string;
  routeDetails?: string;
  price?: number;
  commission?: number;
  supplierInfo?: string;
  [key: string]: any;
}

@Schema({
  timestamps: true,
  indexes: [
    { fields: { 'publicData.productId': 1, index: 1 }, unique: true }
  ]
})
export class Block {
  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  previousHash: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ type: Object, required: true })
  publicData: PublicData;

  @Prop({ type: String })
  encryptedPrivateData?: string;

  @Prop({ type: Object, required: true })
  zkProof: ZKProof;

  @Prop({ required: true })
  nonce: number;

  @Prop({ type: Object })
  legacyData?: {
    productId: string;
    actorType: string;
    actorName: string;
    action: string;
    location?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

export const BlockSchema = SchemaFactory.createForClass(Block);
