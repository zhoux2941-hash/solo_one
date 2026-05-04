import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Query, Logger } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { AddLogisticsNodeDto } from './dto/add-logistics-node.dto';
import { ActorRole, ActorIdentityDto } from './dto/privacy.dto';

@Controller('api/products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      const result = await this.productService.createProduct(createProductDto);
      return {
        success: true,
        message: 'Product created successfully with ZK proof',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('logistics')
  async addLogisticsNode(@Body() addLogisticsNodeDto: AddLogisticsNodeDto) {
    try {
      const result = await this.productService.addLogisticsNode(addLogisticsNodeDto);
      return {
        success: true,
        message: 'Logistics node added successfully with ZK proof',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to add logistics node: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('traceability/:productId')
  async getTraceability(
    @Param('productId') productId: string,
    @Query('role') role?: string,
    @Query('actorName') actorName?: string,
  ) {
    try {
      let requesterIdentity: ActorIdentityDto | undefined;

      if (role) {
        requesterIdentity = {
          role: this.parseActorRole(role),
          actorName: actorName,
        };
      }

      this.logger.log(
        `Traceability request for product ${productId} with role: ${role || 'consumer'}, actor: ${actorName || 'unknown'}`,
      );

      const result = await this.productService.getTraceability(productId, requesterIdentity);
      return {
        success: true,
        message: 'Traceability data retrieved successfully with privacy filtering',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get traceability: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('traceability/:productId/producer')
  async getTraceabilityAsProducer(
    @Param('productId') productId: string,
    @Query('actorName') actorName?: string,
  ) {
    try {
      const requesterIdentity: ActorIdentityDto = {
        role: ActorRole.PRODUCER,
        actorName,
      };

      const result = await this.productService.getTraceability(productId, requesterIdentity);
      return {
        success: true,
        message: 'Producer traceability data retrieved',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get producer traceability: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('traceability/:productId/logistics')
  async getTraceabilityAsLogistics(
    @Param('productId') productId: string,
    @Query('actorName') actorName: string,
  ) {
    try {
      if (!actorName) {
        throw new HttpException(
          {
            success: false,
            message: 'actorName query parameter is required for logistics role',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const requesterIdentity: ActorIdentityDto = {
        role: ActorRole.LOGISTICS,
        actorName,
      };

      const result = await this.productService.getTraceability(productId, requesterIdentity);
      return {
        success: true,
        message: 'Logistics traceability data retrieved with privacy filtering',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get logistics traceability: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('traceability/:productId/consumer')
  async getTraceabilityAsConsumer(@Param('productId') productId: string) {
    try {
      const requesterIdentity: ActorIdentityDto = {
        role: ActorRole.CONSUMER,
      };

      const result = await this.productService.getTraceability(productId, requesterIdentity);
      return {
        success: true,
        message: 'Consumer traceability data retrieved (sensitive data hidden)',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get consumer traceability: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('zkp-verify/:productId/:blockIndex')
  async verifyZKProof(
    @Param('productId') productId: string,
    @Param('blockIndex') blockIndex: number,
  ) {
    try {
      const result = await this.productService.verifyZKProofForBlock(productId, blockIndex);
      return {
        success: true,
        message: result.valid ? 'ZK Proof verified successfully' : 'ZK Proof verification failed',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to verify ZK proof: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getAllProducts() {
    try {
      const products = await this.productService.getAllProducts();
      return {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error) {
      this.logger.error(`Failed to get all products: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':productId')
  async getProductById(@Param('productId') productId: string) {
    try {
      const product = await this.productService.findProductById(productId);
      return {
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      };
    } catch (error) {
      this.logger.error(`Failed to get product by ID: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private parseActorRole(role: string): ActorRole {
    const roleMap: Record<string, ActorRole> = {
      'producer': ActorRole.PRODUCER,
      'logistics': ActorRole.LOGISTICS,
      'consumer': ActorRole.CONSUMER,
    };
    return roleMap[role] || ActorRole.CONSUMER;
  }
}
