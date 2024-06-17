import { HttpStatus, Injectable, Res } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  DecodedTokenMail,
  shortUser,
  User,
} from '../../interfaces/userInterface';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { RefreshTokenService } from './RefreshTokenService';
import { Response } from 'express';
import { MailService } from '../../email/service/MailService';
import { StripeService } from '../stripe/stripe.service';

const prisma = new PrismaClient();

/**
 * Service responsable de la gestion de l'authentification et du hachage des mots de passe.
 *
 * @remarks
 * Ce service utilise la bibliothèque bcrypt pour fournir des fonctionnalités de hachage sécurisé des mots de passe.
 *
 * @example
 * ```typescript
 * // Exemple d'utilisation dans un autre module NestJS
 * const authService = new AuthService();
 * const hashedPassword = await authService.hashPassword('mySecurePassword');
 * console.log('Mot de passe haché:', hashedPassword);
 * ```
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailService: MailService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Hache le mot de passe fourni en utilisant la bibliothèque bcrypt.
   *
   * @param password - Le mot de passe à hacher.
   * @returns Une promesse résolue avec le mot de passe haché.
   * @throws {Error} Une erreur si le hachage échoue.
   *
   * @example
   * ```typescript
   * // Exemple d'appel de la fonction de hachage de mot de passe
   * const hashedPassword = await AuthService.hashPassword('mySecurePassword');
   * console.log('Mot de passe haché:', hashedPassword);
   * ```
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // Le coût du hachage

    // Génère un sel (salt)
    const salt = await bcrypt.genSalt(saltRounds);

    // Hache le mot de passe avec le sel
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare un mot de passe en texte brut avec un mot de passe haché.
   *
   * @param plainTextPassword - Le mot de passe en texte brut à comparer.
   * @param hashedPassword - Le mot de passe haché à comparer.
   * @returns Une promesse résolue avec un boolean indiquant si les mots de passe correspondent.
   * @throws {Error} Une erreur si la comparaison échoue.
   *
   * @example
   * ```typescript
   * // Exemple d'appel de la fonction de comparaison de mots de passe
   * const passwordsMatch = await authService.comparePasswords('userPassword', 'hashedPasswordFromDatabase');
   * console.log('Les mots de passe correspondent ?', passwordsMatch);
   * ```
   */
  static async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }

  /**
   * Méthode pour gérer la connexion de l'utilisateur.
   *
   * @param credentials - Les informations de connexion de l'utilisateur.
   * @param res - L'objet de réponse Express.
   * @param frenchCodeAreaCookie - Le cookie contenant le token de French Code Area.
   * @returns {Promise<HttpException | string>} Une promesse qui résout soit avec le token de rafraîchissement généré,
   * soit avec une instance de `HttpException` en cas d'erreur.
   *
   * @throws {HttpException} - Une exception HTTP en cas d'erreur.
   *
   * @remarks
   * Cette méthode gère la connexion de l'utilisateur en vérifiant d'abord la validité du token
   * existant s'il est présent dans le cookie. Ensuite, elle vérifie les informations de connexion
   * fournies par l'utilisateur, compare les mots de passe, génère un nouveau token de rafraîchissement
   * en cas de succès, et renvoie une exception HTTP en cas d'erreur.
   *
   * @example
   * // Exemple d'utilisation dans un contrôleur Nest.js
   * @Controller('auth')
   * export class AuthController {
   *   @Post('connect')
   *   async connect(
   *     @Body() credentials: UserConnect,
   *     @Res() res,
   *     @Cookie('frenchCodeAreaCookie') frenchCodeAreaCookie,
   *   ) {
   *     try {
   *       return await this.authService.connect(credentials, res, frenchCodeAreaCookie);
   *     } catch (error) {
   *       // Gérer l'erreur, par exemple, renvoyer une réponse HTTP appropriée
   *     }
   *   }
   * }
   */
  async connect(
    credentials: shortUser,
    @Res() res: Response,
    frenchCodeAreaCookie: string,
  ) {
    try {
      // Vérifier si le cookie existe
      const existingToken = frenchCodeAreaCookie;
      if (existingToken) {
        try {
          const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
          // Vérifier la validité du token existant
          const decodedToken = jwt.verify(existingToken, publicKey) as {
            id: number;
          };
          if (decodedToken) {
            return HttpStatus.UNAUTHORIZED;
          } else {
            return HttpStatus.BAD_REQUEST;
          }
        } catch (verifyError) {
          return HttpStatus.BAD_REQUEST;
        }
      }

      const user: shortUser = await prisma.user.findFirst({
        where: {
          userName: credentials.userName,
        },
      });

      if (user.groupsId === 3) {
        await this.verifEntrepriseGroups(user);
      }

      if (user) {
        const passwordsMatch: boolean = await AuthService.comparePasswords(
          credentials.password,
          user.password,
        );

        if (passwordsMatch) {
          try {
            const tokenGenerated =
              await this.refreshTokenService.generateRefreshToken(user.id, res);
            if (tokenGenerated) {
              return await this.refreshTokenService.generateAccessTokenFromRefreshToken(
                tokenGenerated,
              );
            }
          } catch (readFileError) {
            console.error('Error reading private key file:', readFileError);
            return HttpStatus.BAD_REQUEST;
          }
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      } else {
        return HttpStatus.BAD_REQUEST;
      }
    } catch (error) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Méthode pour valider l'adresse e-mail d'un utilisateur.
   *
   * @param token
   * @returns {Promise<void>} Une promesse résolue une fois la mise à jour de l'utilisateur effectuée avec succès.
   *
   * @throws {HttpException} - Une exception HTTP en cas d'erreur interne du serveur.
   *
   * @remarks
   * Cette méthode met à jour les informations de l'utilisateur, marquant son adresse e-mail comme vérifiée
   * et changeant son statut en 'actif'. Elle prend en compte le nom d'utilisateur et l'identifiant unique
   * de l'utilisateur pour effectuer la mise à jour.
   *
   * @example
   * // Exemple d'utilisation dans un service Nest.js
   * @Injectable()
   * export class UserService {
   *   async validateEmail(userName: string, id: number): Promise<void> {
   *     try {
   *       await this.validMail(userName, id);
   *       // Logique supplémentaire après la validation de l'e-mail
   *     } catch (error) {
   *       // Gérer l'erreur, par exemple, renvoyer une réponse HTTP appropriée
   *     }
   *   }
   * }
   */
  async validMail(token: string): Promise<HttpStatus> {
    try {
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8'),
        verifedToken: DecodedTokenMail = jwt.verify(
          token,
          publicKey,
        ) as unknown as DecodedTokenMail;
      if (verifedToken?.exp - verifedToken?.iat > 0) {
        const updateUser = await prisma.user.update({
          where: {
            id: verifedToken.id,
            userName: verifedToken.userName,
          },
          data: {
            emailVerified: true,
            status: 'actif',
          },
        });
        if (updateUser) {
          return HttpStatus.OK;
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      }
      return HttpStatus.GATEWAY_TIMEOUT;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    }
  }

  /**
   * Gère le processus de récupération de mot de passe pour un utilisateur.
   *
   * @param {string} email - L'adresse e-mail associée au compte utilisateur.
   * @returns {Promise<HttpStatus>} Une promesse qui résout avec le statut HTTP indiquant le résultat de l'opération.
   */
  async passwordForgot(email: string): Promise<HttpStatus> {
    // Récupérer la liste des utilisateurs depuis la base de données
    const userListe = await prisma.user.findMany();

    // Initialiser les données utilisateur par défaut
    let data = {
      userName: '',
      email: '',
      id: null,
    };

    // Créer un tableau de promesses pour vérifier l'existence de l'utilisateur
    const userExistPromises: Promise<boolean>[] = userListe.map(
      async (user) => {
        if (user.email === email) {
          // Mettre à jour les données si l'utilisateur est trouvé
          data = {
            id: user.id,
            userName: user.userName,
            email: user.email,
          };
        }
        return user.email === email;
      },
    );

    // Attendre que toutes les vérifications soient terminées
    const userExistArray: boolean[] = await Promise.all(userExistPromises);

    // Vérifier si l'utilisateur existe
    if (!userExistArray) {
      return HttpStatus.BAD_REQUEST;
    } else if (userExistArray) {
      // Réaliser les actions necessaire à l'envoie du mail d'oublie de mot de passe.
      const responseSendMail = await this.mailService.prepareMail(
        data.id,
        data,
        2,
      );

      // Vérifier le résultat de l'envoi du mail
      if (responseSendMail) {
        return HttpStatus.OK;
      } else {
        return HttpStatus.NOT_FOUND;
      }
    }
  }

  /**
   * Modifie le mot de passe d'un utilisateur.
   *
   * @param {shortUser} data - Les données de l'utilisateur comprenant le nom d'utilisateur et le nouveau mot de passe.
   * @returns {Promise<HttpStatus>} Une promesse qui résout avec le statut HTTP indiquant le résultat de l'opération.
   */
  async changePassword(data: shortUser): Promise<HttpStatus> {
    try {
      // Récupérer la liste des utilisateurs depuis la base de données
      const userListe = await prisma.user.findMany();

      // Créer un tableau de promesses pour vérifier l'existence de l'utilisateur
      const userExistPromises: Promise<boolean>[] = userListe.map(
        async (user) => {
          return user.userName === data.userName;
        },
      );

      // Attendez que toutes les vérifications soient terminées
      const userExistArray: boolean[] = await Promise.all(userExistPromises);

      // Vérifiez s'il y a un utilisateur existant
      const userExist: boolean = userExistArray.some(
        (exists: boolean) => exists,
      );

      if (userExist) {
        // Hacher le nouveau mot de passe
        const password: string = await AuthService.hashPassword(data.password);

        // Mettre à jour le mot de passe de l'utilisateur dans la base de données
        await prisma.user.update({
          where: {
            userName: data.userName,
          },
          data: {
            password: password,
          },
        });
        return HttpStatus.OK;
      }
      if (!userExist) {
        return HttpStatus.NOT_FOUND;
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    }
  }

  /**
   * Vérifie la validité des groupes d'entreprise pour un utilisateur et réinitialise son groupe si les conditions sont remplies.
   * Cette fonction examine les commandes de l'utilisateur pour déterminer si son abonnement d'entreprise est toujours valide.
   * - Si l'utilisateur a une seule commande et que cette commande a expiré il y a plus d'un an, son groupe est réinitialisé.
   * - Si l'utilisateur a plusieurs commandes, la fonction vérifie la durée de validité de la plus ancienne et de la plus récente commande.
   *   Si la plus récente commande a expiré il y a plus d'un an et que la durée depuis la première commande dépasse le nombre
   *   d'années couvertes par les abonnements achetés, le groupe de l'utilisateur est également réinitialisé.
   *
   * @param user - L'objet `User` contenant les informations de l'utilisateur à vérifier.
   * @returns Une promesse qui se résout sans valeur de retour, après potentiellement avoir réinitialisé le groupe de l'utilisateur.
   */
  async verifEntrepriseGroups(user: User) {
    if (user && user.id) {
      const lastCommande = await this.stripeService.getLastCommande(
        user.id.toString(),
      );
      const abonnementValid = await this.stripeService.getSubscriptionStatus(
        lastCommande.customerId,
      );
      if (abonnementValid && !abonnementValid.active) {
        await resetUserGroup(user);
      }
    }
  }
}

/**
 * Réinitialise l'identifiant de groupe d'un utilisateur spécifié à un groupe par défaut.
 * Cette fonction met à jour le champ `groupsId` dans la base de données pour un utilisateur donné,
 * en attribuant à cet utilisateur un identifiant de groupe par défaut (dans ce cas, 1).
 *
 * @param user - L'objet `User` contenant l'identifiant et le nom d'utilisateur de l'utilisateur dont le groupe doit être réinitialisé.
 * @returns Une promesse qui se résout une fois que l'opération de mise à jour est terminée.
 */
async function resetUserGroup(user: User) {
  await prisma.user.update({
    where: {
      id: user.id,
      userName: user.userName,
    },
    data: {
      groupsId: 1,
    },
  });
}
