import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainService } from './blockchain.service';
import { Block, BlockSchema } from './schemas/block.schema';
import { ZKPModule } from '../zkp/zkp.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }]),
    ZKPModule,
  ],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
