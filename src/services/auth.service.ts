import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserConnect } from '../interfaces/userInterface';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createToken } from '../utils/tokenUtils';

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
   * Connecte un utilisateur en vérifiant les informations d'identification fournies.
   *
   * @param credentials - Les informations d'identification de l'utilisateur.
   * @param res - L'objet de réponse Express.
   * @param req - L'objet de requête Express.
   * @returns Une réponse contenant un jeton d'accès ou un message d'erreur.
   *
   * @throws HttpException - En cas d'erreur lors de la génération ou de la vérification du jeton.
   */
  async connect(credentials: UserConnect, res: Response, req: Request) {
    try {
      // Vérifier si le cookie existe
      const existingToken = req?.cookies?.frenchCodeAreaToken;

      if (existingToken) {
        try {
          const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
          // Vérifier la validité du token existant
          const decodedToken = jwt.verify(existingToken, publicKey) as {
            username: string;
          };
          return {
            message: 'Utilisateur déjà connecté',
            username: decodedToken.username,
          };
        } catch (verifyError) {
          console.error('Error verifying existing token:', verifyError);
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
            return createToken(res, credentials.userName);
          } catch (readFileError) {
            console.error('Error reading private key file:', readFileError);
            new HttpException(
              'Erreur interne du serveur',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          return new HttpException(
            'Le nom de compte et/ou le mot de passe est/sont érroné',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        return new HttpException(
          'Le nom de compte et/ou le mot de passe est/sont érroné',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
