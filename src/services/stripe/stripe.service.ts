import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { PrismaClient } from '@prisma/client';
import { PRODUCT } from '../../constantes/contante';
import { CommandeEntreprise, User } from 'src/interfaces/userInterface';
import { PdfService } from '../pdfservice/pdf.service';
import { MailService } from '../../email/service/MailService';

const prisma: PrismaClient = new PrismaClient();

@Injectable()
export class StripeService {
  private stripe = new Stripe(
    'sk_test_51P1YCzFoLa8m0nzyi1YXY5DWNpDYc89lZ0oa17ueukKAwuJkhUMP1Ig1XRtuveCVaMJBcxXq1dVuD1p1UtHEqZNd007GVNqPQx',
    {
      apiVersion: '2023-10-16',
    },
  );

  constructor(
    private readonly mailService: MailService,
    private readonly pdfService: PdfService,
  ) {}

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

  async createCommande(session, userId: number) {
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
          userID: userId,
          customerId: session.customer,
          dateCommande: new Date(),
          etatCommande: session.payment_status,
          nbCreateTest: nbCreateTest.nbCreate,
        },
      });
      if (createCommand) {
        const user = await prisma.user.findFirst({
          where: {
            id: userId,
          },
        });
        const userUpdate = await this.attributeEntrepriseRole(user);
        if (userUpdate) {
          const getInvoice: Promise<Buffer> = this.getLatestInvoice(
            session.customer,
            '',
            user,
          );
          const data = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            pdfBuffer: getInvoice,
          };
          // Realise les actions necessaire à l'envoie du mail de création de compte.
          const responseSendMail = await this.mailService.prepareMail(
            undefined,
            data,
            4,
          );
          if (responseSendMail) {
            return HttpStatus.CREATED;
          } else {
            return HttpStatus.NOT_MODIFIED;
          }
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

  /**
   * Récupère le statut d'abonnement d'un client en fonction de son ID client Stripe.
   *
   * Cette méthode liste tous les abonnements associés au client spécifié, filtre ceux qui sont
   * actifs, en période d'essai ou en retard de paiement, et retourne leur statut.
   *
   * @param {string} customerId - L'ID du client Stripe.
   *
   * @returns {Promise<{ active: boolean, subscriptions: Array<Object> }>} - Retourne une promesse qui
   *     se résout avec un objet contenant un indicateur de statut d'abonnement actif et une liste
   *     des abonnements actifs.
   *
   * @throws {Error} - Lance une erreur si une opération échoue.
   */
  async getSubscriptionStatus(
    customerId: string,
  ): Promise<{ active: boolean; subscriptions: Array<object> }> {
    try {
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
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Annule l'abonnement d'un utilisateur à la fin de la période de facturation en cours.
   *
   * Cette méthode met à jour l'abonnement Stripe pour qu'il se termine à la fin de la période en cours,
   * met à jour l'état de la commande dans la base de données pour indiquer qu'elle est annulée,
   * et réinitialise l'identifiant du groupe de l'utilisateur.
   *
   * @param {Object} lastCommande - La dernière commande de l'utilisateur.
   * @param {string} lastCommande.idPayment - L'ID de paiement de la commande à annuler.
   * @param {number} lastCommande.userID - L'ID de l'utilisateur dont l'abonnement est annulé.
   *
   * @returns {Promise<Object|undefined>} - Retourne l'objet de réponse de l'abonnement annulé de Stripe
   *                                        si toutes les opérations réussissent, sinon `undefined`.
   *
   * @throws {Error} - Lance une erreur si une opération échoue.
   */
  async unsuscribeUser(lastCommande) {
    const unsuscribe = await this.stripe.subscriptions.update(
      lastCommande.idPayment,
      {
        cancel_at_period_end: true,
      },
    );

    if (unsuscribe) {
      const cancelCommand = await prisma.commandeEntreprise.update({
        where: {
          idPayment: lastCommande.idPayment,
        },
        data: {
          etatCommande: 'Unsubscribed',
        },
      });

      const resetGroupUser = await prisma.user.update({
        where: {
          id: lastCommande.userID,
        },
        data: {
          groupsId: 1,
        },
      });

      if (cancelCommand && resetGroupUser) {
        return unsuscribe;
      }
    }
  }

  /**
   * Récupère la dernière commande d'un utilisateur en fonction de son ID.
   *
   * Cette méthode recherche la première commande d'un utilisateur triée par date de commande
   * dans l'ordre décroissant, ce qui correspond à la commande la plus récente.
   *
   * @param {string} id - L'ID de l'utilisateur sous forme de chaîne de caractères.
   *
   * @returns {Promise<Object|null>} - Retourne une promesse qui se résout avec la dernière commande
   *                                   de l'utilisateur si elle existe, sinon `null`.
   *
   * @throws {Error} - Lance une erreur si une opération échoue.
   */
  async getLastCommande(id: string): Promise<CommandeEntreprise> {
    return prisma.commandeEntreprise.findFirst({
      where: {
        userID: parseInt(id),
      },
      orderBy: {
        dateCommande: 'desc',
      },
    });
  }

  async getLatestInvoice(
    customerId: string,
    id?: string,
    user?: User,
  ): Promise<Buffer> {
    const latestInvoice = await this.stripe.invoices.list({
      customer: customerId,
      limit: 1,
      status: 'paid',
      expand: ['data.default_payment_method'],
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          id: parseInt(id),
        },
      });
    }
    return await this.pdfService.generateInvoicePDF(
      latestInvoice.data[0],
      user,
    );
  }
}
