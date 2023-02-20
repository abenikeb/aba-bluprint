import { Controller, Post, Req } from '@nestjs/common';

@Controller('payments')
export class PaymentController {
  @Post('webhook')
  notify(@Req() req: any) {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64')
      .toString()
      .split(':');
    return { username, password };
  }
}
