import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { PrismaClient } from '@prisma/client';
import { User } from '../../interfaces/userInterface';
import { UserService } from '../user/user.service';
import { PRODUCT } from '../../constantes/contante';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class StripeService {
  private stripe = new Stripe(
    'sk_test_51P1YCzFoLa8m0nzyi1YXY5DWNpDYc89lZ0oa17ueukKAwuJkhUMP1Ig1XRtuveCVaMJBcxXq1dVuD1p1UtHEqZNd007GVNqPQx',
    {
      apiVersion: '2023-10-16',
    },
  );

  constructor(private readonly userService: UserService) {}

  async retrieveSession(
    sessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    try {
      let session;

      if (sessionId) {
        session = this.stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items'],
        });
      }

      if (session) {
        return session;
      } else {
        return;
      }
    } catch (e) {
      console.log(e);
    }
  }

  async checkIfOrderExist(session) {
    try {
      const commandExist = await prisma.commandeEntreprise.findFirst({
        where: {
          idSession: session.id,
        },
      });

      return !commandExist;
    } catch (e) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCommande(session?, user?: User) {
    try {
      const nbCreateTest = PRODUCT.find((elem) => {
        return elem.id === (session ? session.line_items.data[0].price.id : '');
      });
      let createCommand;
      if (session) {
        createCommand = await prisma.commandeEntreprise.create({
          data: {
            idSession: session.id,
            objetSession: [session],
            idPayment: session.payment_intent,
            item: session.line_items.data[0].price.id ?? '',
            userID: user.id,
            dateCommande: new Date(),
            etatCommande: session.payment_status,
            nbCreateTest: nbCreateTest.nbCreate,
          },
        });
      } else {
        createCommand = await prisma.commandeEntreprise.create({
          data: {
            idSession: new Date().getTime().toString(),
            objetSession: [],
            idPayment: new Date().getTime().toString(),
            item: new Date().getTime().toString(),
            userID: user.id,
            dateCommande: new Date(),
            etatCommande: 'Version gratuit',
            nbCreateTest: nbCreateTest.nbCreate,
          },
        });
      }
      if (createCommand) {
        const userUpdate = await this.userService.attributeEntrepriseRole(user);
        if (userUpdate) {
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.NOT_MODIFIED;
        }
      }
    } catch (e) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
