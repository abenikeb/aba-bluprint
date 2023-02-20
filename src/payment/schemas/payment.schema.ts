import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Order } from 'src/order/schemas/order.schema';
import { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema()
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order' })
  order: Order;

  @Prop()
  transactionRef: string;

  @Prop()
  amount: number;

  @Prop({ type: String, enum: PaymentStatus })
  status: PaymentStatus;

  @Prop()
  rawRequest: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
