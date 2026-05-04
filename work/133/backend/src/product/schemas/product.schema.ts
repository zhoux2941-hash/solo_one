import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop({ required: true })
  producerName: string;

  @Prop()
  producerAddress: string;

  @Prop()
  productionDate: Date;

  @Prop()
  batchNumber: string;

  @Prop({ type: Object })
  specifications: Record<string, any>;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre<ProductDocument>('save', function (next) {
  this.updatedAt = new Date();
  next();
});
