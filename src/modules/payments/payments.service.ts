import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor() {
    const secret = process.env.STRIPE_SECRET;
    if (!secret) throw new InternalServerErrorException('STRIPE_SECRET not configured');
    this.stripe = new Stripe(secret, { apiVersion: '2022-11-15' });
  }

  async createCheckoutSession(amount: number, currency = 'usd', successUrl?: string, cancelUrl?: string) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: 'Advertisement boost' },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl ?? 'https://example.com/success',
        cancel_url: cancelUrl ?? 'https://example.com/cancel',
      });
      return session;
    } catch (e) {
      throw new InternalServerErrorException('Stripe error');
    }
  }
}
