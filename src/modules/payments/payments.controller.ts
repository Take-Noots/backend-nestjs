import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(
    @Body()
    body: {
      amount: number;
      currency?: string;
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    try {
      const session = await this.paymentsService.createCheckoutSession(
        body.amount,
        body.currency ?? 'usd',
        body.successUrl,
        body.cancelUrl,
      );
      return { url: session.url };
    } catch (e) {
      throw new HttpException(
        'Failed to create checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Simple pages Stripe can redirect to after checkout completes or is cancelled.
  // These return minimal HTML so the browser doesn't hit a 404 and the user sees feedback.
  @Get('success')
  success(@Res() res: Response) {
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Payment Successful</title>
        <style>body{font-family: Arial, sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f5f5} .card{background:white;padding:24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center}</style>
      </head>
      <body>
        <div class="card">
          <h1>Payment successful</h1>
          <p>Thank you! Your payment has been processed.</p>
          <p><a href="/">Return to site</a></p>
        </div>
      </body>
    </html>`;
    res.type('html').send(html);
  }

  @Get('cancel')
  cancel(@Res() res: Response) {
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Payment Cancelled</title>
        <style>body{font-family: Arial, sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f5f5} .card{background:white;padding:24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center}</style>
      </head>
      <body>
        <div class="card">
          <h1>Payment cancelled</h1>
          <p>Your payment was not completed.</p>
          <p><a href="/">Return to site</a></p>
        </div>
      </body>
    </html>`;
    res.type('html').send(html);
  }
}
