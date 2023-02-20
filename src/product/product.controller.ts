import { Controller, Get, Param } from '@nestjs/common';
import { FindProductParamDto } from './dtos/find-product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  find() {
    return this.productService.find();
  }

  @Get(':id')
  findOne(@Param() findProductParamDto: FindProductParamDto) {
    return this.productService.findOne(findProductParamDto.id);
  }
}
