import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus } from 'src/payment/enums/payment-status.enum';
import { Payment, PaymentDocument } from 'src/payment/schemas/payment.schema';
import { CreateOrderDto } from './dtos/crate-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import * as https from 'https';
import {
  createNonceStr,
  createTimeStamp,
  generateSign,
  getParaMapToSign,
  getSignSourceString,
} from './helpers/tools.helper';

@Injectable()
export class OrderService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async find() {
    const orders = await this.orderModel.find(null, null, {
      populate: 'payment',
    });

    return { data: { orders } };
  }

  async create(createOrderDto: CreateOrderDto) {
    let order = await this.orderModel.create(createOrderDto);
    const payment = await this.paymentModel.create({
      order: order._id,
      amount: 0,
      status: PaymentStatus.PENDING,
    });

    order = await this.orderModel.findByIdAndUpdate(
      order._id,
      {
        payment: payment._id,
      },
      {
        new: true,
        populate: 'payment',
      },
    );

    /**
     * GET FABRIC TOKEN
     */

    const {
      data: { token },
    } = await this.httpService.axiosRef.post(
      'https://196.188.120.3:38443/apiaccess/payment/gateway/payment/v1/token',
      {
        appSecret: this.configService.get('APP_SECRET'),
      },
      {
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
          'X-APP-Key': this.configService.get('APP_KEY'),
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );

    /**
     * REQUEST CREATE ORDER
     */

    const request = this.createRequestObject(
      order._id.toString(),
      order.amount,
    );

    const { data } = await this.httpService.axiosRef.post(
      'https://196.188.120.3:38443/apiaccess/payment/gateway/payment/v1/merchant/preOrder',
      request,
      {
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
          'X-APP-Key': this.configService.get('APP_KEY'),
          Authorization: token,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );

    const rawRequest = this.createRawRequest(data.biz_content.prepay_id);

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      rawRequest,
    });

    order.payment.rawRequest = rawRequest;

    return {
      data: {
        order,
        rawRequest,
      },
    };
  }

  createRequestObject(orderId: string, amount: number) {
    const req = {
      timestamp: createTimeStamp(),
      nonce_str: createNonceStr(),
      method: 'payment.preorder',
      version: '1.0',
      sign_type: 'SHA256WithRSA',
      sign: '',
      biz_content: {
        notify_url: this.configService.get('NOTIFY_URL'),
        trade_type: 'InApp',
        appid: this.configService.get('APP_ID'),
        merch_code: this.configService.get('MERCH_CODE'),
        merch_order_id: orderId,
        title: 'BuyGoods',
        total_amount: amount.toString(),
        trans_currency: 'ETB',
        timeout_express: '120m',
        business_type: 'BuyGoods',
        payee_identifier: this.configService.get('MERCH_CODE'),
        payee_identifier_type: '04',
        payee_type: '5000',
      },
    };
    getSignSourceString(getParaMapToSign(req));

    req['sign'] = generateSign(
      this.configService.get('PRIVATE_KEY'),
      getSignSourceString(getParaMapToSign(req)),
    );

    return req;
  }

  createRawRequest = (prepayId: string) => {
    const map = {
      appid: this.configService.get('APP_ID'),
      merch_code: this.configService.get('MERCH_CODE'),
      nonce_str: createNonceStr(),
      prepay_id: prepayId,
      timestamp: createTimeStamp(),
    };
    const sign = generateSign(
      this.configService.get('PRIVATE_KEY'),
      getSignSourceString(getParaMapToSign(map)),
    );
    // order by ascii in array
    const rawRequest = [
      'appid=' + map.appid,
      'merch_code=' + map.merch_code,
      'nonce_str=' + map.nonce_str,
      'prepay_id=' + map.prepay_id,
      'timestamp=' + map.timestamp,
      'sign=' + sign,
      'sign_type=SHA256WithRSA',
    ].join('&');

    return rawRequest;
  };
}
