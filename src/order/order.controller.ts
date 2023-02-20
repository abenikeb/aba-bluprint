import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateOrderDto } from './dtos/crate-order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  find() {
    return this.orderService.find();
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }
}
