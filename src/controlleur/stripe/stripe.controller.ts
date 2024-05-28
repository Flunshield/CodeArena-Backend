import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Stripe } from 'stripe';
import { StripeService } from '../../services/stripe/stripe.service';
import { ENTREPRISE, USER } from '../../constantes/contante';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../auth/auth.controller';

const YOUR_DOMAIN = process.env.URL_FRONT;
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
        mode: req.body.typePayment,
        success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/cancel`,
      });

      return res.send({ message: session.url });
    } catch (error) {
      res.sendStatus(500).json({ error: 'An error occurred' });
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
        // Passer le customerId à la méthode de création de commande
        const status = await this.stripeService.createCommande(
          session,
          data.user.data,
        );
        response.sendStatus(status);
      }
    }
    if (!session) {
      response.send(
        await this.stripeService.createCommande('', data.user.data),
      );
    }
  }

  @Get('lastCommande')
  @Roles(USER, ENTREPRISE)
  @UseGuards(RolesGuard)
  async getLatestInvoice(@Query('id') id: string, @Req() req, @Res() res) {
    const lastCommande = await this.stripeService.getLastCommande(id);
    const latestInvoice = await this.stripeService.getLatestInvoice(
      lastCommande.customerId,
    );
    if (!latestInvoice) {
      return res.status(404).send('No invoice found');
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'Content-Disposition; filename=invoice.pdf',
      'Content-Length': latestInvoice.length,
    });
    res.end(latestInvoice);
  }
}
