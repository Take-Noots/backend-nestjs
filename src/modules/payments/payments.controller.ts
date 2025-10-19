import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Body() body: { amount: number; currency?: string; successUrl?: string; cancelUrl?: string }) {
    try {
      const session = await this.paymentsService.createCheckoutSession(body.amount, body.currency ?? 'usd', body.successUrl, body.cancelUrl);
      return { url: session.url };
    } catch (e) {
      throw new HttpException('Failed to create checkout session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
