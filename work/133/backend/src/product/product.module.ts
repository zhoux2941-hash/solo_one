import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ZKPModule } from '../zkp/zkp.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    BlockchainModule,
    ZKPModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
