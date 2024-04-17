import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Stripe } from 'stripe';
import { StripeService } from '../../services/stripe/stripe.service';
import { ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../auth/auth.controller';

const YOUR_DOMAIN = 'http://localhost:5173';
const stripe = new Stripe(
  'sk_test_51P1YCzFoLa8m0nzyi1YXY5DWNpDYc89lZ0oa17ueukKAwuJkhUMP1Ig1XRtuveCVaMJBcxXq1dVuD1p1UtHEqZNd007GVNqPQx',
  {
    apiVersion: '2023-10-16',
  },
);

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @Roles(USER, ENTREPRISE)
  @UseGuards(RolesGuard)
  async createCheckoutSession(@Req() req, @Res() res) {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: req.body.idApi,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/cancel`,
      });

      return res.send({ message: session.url });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }

  @Post('success')
  @Roles(USER, ENTREPRISE)
  @UseGuards(RolesGuard)
  async postSuccess(@Req() req, @Res() response) {
    const data = req.body.data;
    const session = await this.stripeService.retrieveSession(data.sessionId);
    if (session && session.payment_status === 'paid') {
      const checkIfOrderExist =
        await this.stripeService.checkIfOrderExist(session);
      if (checkIfOrderExist) {
        response.send(
          await this.stripeService.createCommande(session, data.user.data),
        );
      }
    }
    if (!session) {
      response.send(
        await this.stripeService.createCommande('', data.user.data),
      );
    }
  }
}
