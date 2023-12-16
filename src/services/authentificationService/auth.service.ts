import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserConnect } from '../../interfaces/userInterface';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { RefreshTokenService } from './RefreshTokenService';
import { Response } from 'express';

const prisma = new PrismaClient();

//TODO: Mettre à jour la méthode validMail quand le front sera créé.

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
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

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
    credentials: UserConnect,
    @Res() res: Response,
    frenchCodeAreaCookie: string,
  ): Promise<HttpException | HttpStatus> {
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
            return new HttpException(
              'Utilisateur déja connecté',
              HttpStatus.FORBIDDEN,
            );
          } else {
            return new HttpException('Token erroné', HttpStatus.FORBIDDEN);
          }
        } catch (verifyError) {
          throw new HttpException('Vérification érroné', HttpStatus.FORBIDDEN);
        }
      }

      const user: User = await prisma.user.findFirst({
        where: {
          userName: credentials.userName,
        },
      });

      if (user) {
        const passwordsMatch: boolean = await AuthService.comparePasswords(
          credentials.password,
          user.password,
        );

        if (passwordsMatch) {
          try {
            await this.refreshTokenService.generateRefreshToken(user.id, res);
            return HttpStatus.OK;
          } catch (readFileError) {
            console.error('Error reading private key file:', readFileError);
            return new HttpException(
              'Erreur sur la elcture de al private key',
              HttpStatus.EXPECTATION_FAILED,
            );
          }
        } else {
          return new HttpException(
            'Le nom de compte et/ou le mot de passe est/sont erroné',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        return new HttpException(
          'Le nom de compte et/ou le mot de passe est/sont erroné',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log(error);
      return error.status;
    }
  }

  /**
   * Méthode pour valider l'adresse e-mail d'un utilisateur.
   *
   * @param userName - Le nom d'utilisateur de l'utilisateur.
   * @param id - L'identifiant unique de l'utilisateur.
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
  async validMail(userName: string, id: number): Promise<void> {
    try {
      prisma.user.update({
        where: { id: id, userName: userName },
        data: {
          emailVerified: true,
          status: 'actif',
        },
      });
    } catch (error) {
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
