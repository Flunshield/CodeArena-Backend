import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as cookie from 'cookie';
import { Response } from 'express';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { sign, SignOptions } from 'jsonwebtoken';

@Injectable()
export class RefreshTokenService {
  prisma = new PrismaClient();

  /**
   * Méthode pour générer et envoyer un token de rafraîchissement à l'utilisateur.
   *
   * @param userId - L'identifiant unique de l'utilisateur.
   * @param res - L'objet de réponse Express.
   * @returns {Promise<HttpException>} Une promesse résolue avec une instance de `HttpException` indiquant le succès de la génération du token.
   *
   * @throws {Error} - Une erreur générique en cas d'échec de la génération du token.
   *
   * @remarks
   * Cette méthode génère un token de rafraîchissement en utilisant l'identifiant unique de l'utilisateur,
   * signe le token avec la clé privée spécifiée, l'ajoute comme cookie HTTP-only dans la réponse,
   * et renvoie une instance de `HttpException` indiquant le succès de la génération du token.
   *
   * @example
   * // Exemple d'utilisation dans un service Nest.js
   * @Injectable()
   * export class RefreshTokenService {
   *   async generateRefreshToken(userId: number, res: Response): Promise<HttpException> {
   *     try {
   *       return await this.generateRefreshToken(userId, res);
   *       // Logique supplémentaire après la génération du token de rafraîchissement
   *     } catch (error) {
   *       // Gérer l'erreur, par exemple, renvoyer une réponse HTTP appropriée
   *     }
   *   }
   * }
   */
  public async generateRefreshToken(
    userId: number,
    res: Response,
  ): Promise<string> {
    try {
      const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
      const payload = { sub: userId };
      const options: SignOptions = {
        algorithm: 'RS256',
        expiresIn: '1d',
        header: { alg: 'RS256', typ: 'refresh' },
      };
      const refreshToken = sign(payload, privateKey, options);
      const cookies = cookie.serialize('frenchcodeareatoken', refreshToken, {
        maxAge: 3600000,
        path: '/', // accessible from the entire domain
        domain: process.env.DOMAINE, // parent domain
        secure: true, // cookie accessible via HTTPS only
        httpOnly: true, // cookie accessible via HTTP only, not JavaScript
        sameSite: 'none',
      });

      res.setHeader('Set-Cookie', cookies);

      return refreshToken;
    } catch {
      throw new Error("Une erreur s'est produite");
    }
  }

  /**
   * Méthode pour générer un nouveau jeton d'accès à partir d'un jeton de rafraîchissement.
   *
   * @param refreshToken - Le jeton de rafraîchissement à utiliser pour générer le jeton d'accès.
   * @returns {string} Le nouveau jeton d'accès généré.
   *
   * @throws {Error} - Une erreur générique en cas d'échec de la génération du jeton d'accès.
   *                   Par exemple, si le jeton de rafraîchissement est invalide.
   *
   * @remarks
   * Cette méthode prend un jeton de rafraîchissement, le vérifie à l'aide de la clé publique spécifiée,
   * extrait l'identifiant d'utilisateur, puis génère un nouveau jeton d'accès signé avec la clé privée.
   * Elle vérifie également le type de jeton de rafraîchissement avant de procéder à la génération du jeton d'accès.
   *
   * @example
   * // Exemple d'utilisation dans un service Nest.js
   * @Injectable()
   * export class RefreshTokenService {
   *   generateAccessTokenFromRefreshToken(refreshToken: string): string {
   *     try {
   *       return this.generateAccessTokenFromRefreshToken(refreshToken);
   *       // Logique supplémentaire après la génération du jeton d'accès
   *     } catch (error) {
   *       // Gérer l'erreur, par exemple, renvoyer une réponse HTTP appropriée
   *     }
   *   }
   * }
   */
  async generateAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<string> {
    try {
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
      const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
      const { sub: userId } = jwt.verify(refreshToken, publicKey);
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(userId as string, 10) },
        select: {
          id: true,
          groups: true,
        },
      });

      const tokenHeader = jwt.decode(refreshToken, { complete: true })?.header;
      if (tokenHeader?.typ === 'refresh') {
        const payload = {
          sub: userId,
          aud: {
            data: user,
          },
        };
        const options: SignOptions = {
          algorithm: 'RS256',
          expiresIn: '6m',
          header: { alg: 'RS256', typ: 'access' },
        };
        return sign(payload, privateKey, options);
      }
    } catch (error) {
      // Gérer l'erreur, par exemple, le refresh token est invalide
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Génère un jeton d'accès pour l'e-mail avec les informations spécifiées.
   *
   * @param data
   * @param expiresIn
   * @returns Une chaîne représentant le jeton d'accès généré.
   * @throws {Error} Une erreur est levée si la lecture de la clé privée échoue ou si la génération du jeton échoue.
   *
   * @remarks
   * Cette fonction utilise l'algorithme de signature RS256 et expire après 5 minutes.
   * La clé privée utilisée pour signer le jeton est lue à partir du fichier 'private_key.pem'.
   * Le jeton généré a un en-tête indiquant l'algorithme ('RS256') et le type ('access').
   *
   * @example
   * ```typescript
   * const id = 123;
   * const userName = 'john_doe';
   * const accessToken = await generateAccessTokenEmail(id, userName);
   * console.log(accessToken);
   * ```
   */
  async generateAccesTokenEmail(
    data: {
      id?: number;
      userName?: string;
      puzzleID?: string;
      mailID?: number;
    },
    expiresIn?: string,
  ): Promise<string> {
    const options: SignOptions = {
      algorithm: 'RS256',
      expiresIn: expiresIn ? expiresIn : '5m',
      header: { alg: 'RS256', typ: 'access' },
    };
    const payload = {
      id: data?.id,
      userName: data?.userName,
      puzzleID: data?.puzzleID,
      mailID: data?.mailID,
      aud: {
        data: {
          groups: {
            roles: 'Invite',
          },
        },
      },
    };
    const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
    return jwt.sign(payload, privateKey, options);
  }

  /**
   * Génère un token d'accès pour le processus de changement de mot de passe.
   *
   * @param {number} id - L'identifiant de l'utilisateur.
   * @param {string} userName - Le nom d'utilisateur de l'utilisateur.
   * @returns {Promise<string>} Une promesse qui résout avec le token d'accès généré.
   */
  async generateAccesTokenPasswordChange(
    id: number,
    userName: string,
  ): Promise<string> {
    const options: SignOptions = {
      algorithm: 'RS256',
      expiresIn: '10m',
      header: { alg: 'RS256', typ: 'access' },
    };
    const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
    return jwt.sign({ id: id, userName: userName }, privateKey, options);
  }
}
