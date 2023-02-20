import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor(private readonly httpService: HttpService) {}
  async find() {
    const { data } = await this.httpService.axiosRef.get(
      'https://fakestoreapi.com/products',
      {
        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
      },
    );

    return {
      data: {
        products: data,
      },
    };
  }

  async findOne(id: number) {
    const { data } = await this.httpService.axiosRef.get(
      `https://fakestoreapi.com/products/${id}`,
      {
        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
      },
    );

    return {
      data: {
        product: data,
      },
    };
  }
}
