import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { PrismaClient } from '@prisma/client';
import { PRODUCT } from '../../constantes/contante';
import { User } from 'src/interfaces/userInterface';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class StripeService {
  private stripe = new Stripe(
    'sk_test_51P1YCzFoLa8m0nzyi1YXY5DWNpDYc89lZ0oa17ueukKAwuJkhUMP1Ig1XRtuveCVaMJBcxXq1dVuD1p1UtHEqZNd007GVNqPQx',
    {
      apiVersion: '2023-10-16',
    },
  );

  constructor() {}

  /**
   * Récupère une session de paiement Stripe spécifiée par son identifiant de session.
   * Cette fonction tente de récupérer les détails d'une session de paiement en utilisant l'API Stripe Checkout.
   * Elle tente d'élargir les informations récupérées en incluant les 'line_items' (éléments de la ligne de commande).
   *
   * @param sessionId - L'identifiant de la session Stripe à récupérer.
   * @returns Une promesse résolue avec les détails de la session Stripe si elle est trouvée, ou `undefined` si aucun résultat n'est trouvé.
   * @throws {Error} Lève une exception si une erreur survient pendant la récupération de la session.
   */
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

  /**
   * Vérifie si une commande associée à une session spécifique existe dans la base de données.
   * Cette fonction interroge la base de données pour trouver la première commande correspondant à l'ID de session fourni.
   * Si une commande est trouvée, la fonction retourne `false`, indiquant que la commande existe déjà.
   * Si aucune commande n'est trouvée, elle retourne `true`, indiquant qu'aucune commande n'existe pour cette session.
   *
   * @param session - L'objet session contenant l'ID de session à vérifier.
   * @returns Une promesse qui se résout en `true` si aucune commande n'existe pour l'ID de session donné, ou `false` si une commande existe.
   * @throws {HttpException} Lève une exception de type `HttpException` avec le statut `INTERNAL_SERVER_ERROR` en cas d'erreur lors de l'interrogation de la base de données.
   */
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

  /**
   * Crée une commande d'entreprise dans la base de données en fonction des données fournies par une session Stripe et un utilisateur.
   * Si une session Stripe est fournie, la commande est créée avec des détails spécifiques à cette session.
   * Dans le cas contraire, une commande avec des valeurs par défaut est créée, représentant une version gratuite.
   * Après la création de la commande, une tentative est faite pour attribuer un rôle d'entreprise à l'utilisateur.
   *
   * @param session - L'objet session Stripe optionnel contenant les détails de la transaction.
   * @param user - L'utilisateur optionnel pour lequel la commande est créée.
   * @returns Une promesse qui se résout en HttpStatus.CREATED si l'utilisateur a été mis à jour avec succès,
   *          HttpStatus.NOT_MODIFIED si l'utilisateur n'a pas été modifié, ou lève une HttpException en cas d'erreur.
   * @throws {HttpException} Une erreur est levée si une erreur interne survient lors du processus de création de la commande.
   */

  async createCommande(session, user: User) {
    try {
      const nbCreateTest = PRODUCT.find((elem) => {
        return elem.id === (session ? session.line_items.data[0].price.id : '');
      });

      const createCommand = await prisma.commandeEntreprise.create({
        data: {
          idSession: session.id,
          objetSession: [session],
          idPayment: session.payment_intent ?? session.subscription,
          item: session.line_items.data[0].price.id ?? '',
          userID: user.id,
          customerId: session.customer,
          dateCommande: new Date(),
          etatCommande: session.payment_status,
          nbCreateTest: nbCreateTest.nbCreate,
        },
      });
      if (createCommand) {
        const userUpdate = await this.attributeEntrepriseRole(user);
        if (userUpdate) {
          return HttpStatus.CREATED;
        }
      }
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Attribue un rôle d'entreprise à un utilisateur en mettant à jour son groupe d'appartenance dans la base de données.
   * Cette fonction met à jour l'identifiant de groupe de l'utilisateur pour le passer à un identifiant spécifique
   * représentant le groupe des entreprises (par exemple, groupe ID 3 pour les utilisateurs d'entreprise).
   *
   * @param user - L'objet `User` représentant l'utilisateur à qui le rôle d'entreprise sera attribué.
   * @returns Une promesse résolue avec l'objet utilisateur mis à jour.
   */
  async attributeEntrepriseRole(user: User) {
    return prisma.user.update({
      where: {
        userName: user.userName,
        id: user.id,
      },
      data: {
        groupsId: 3,
      },
    });
  }

  async getSubscriptionStatus(customerId: string) {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      return { active: false, subscriptions: [] };
    }

    const activeSubscriptions = subscriptions.data.filter(
      (subscription) =>
        subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        subscription.status === 'past_due',
    );

    return {
      active: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions,
    };
  }

  async unsuscribeUser(lastCommande) {
    return await this.stripe.subscriptions.update(lastCommande.idPayment, {
      cancel_at_period_end: true,
    });
  }
  async getAllCommmandeUser(id: string) {
    const allCommande = prisma.commandeEntreprise.findMany({
      where: {
        userID: parseInt(id),
      },
    });

    if (allCommande) {
      return allCommande;
    } else {
      return [];
    }
  }

  async getLastCommande(id: string) {
    const lastCommande = prisma.commandeEntreprise.findFirst({
      where: {
        userID: parseInt(id),
      },
      orderBy: {
        dateCommande: 'desc',
      },
    });

    if (lastCommande) {
      return lastCommande;
    } else {
      return [];
    }
  }
}
