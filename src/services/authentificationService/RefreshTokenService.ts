import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as cookie from 'cookie';
import { Response } from 'express';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { sign, SignOptions } from 'jsonwebtoken';

@Injectable()
export class RefreshTokenService {
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
  async generateRefreshToken(
    userId: number,
    res: Response,
  ): Promise<HttpException> {
    try {
      const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
      const payload = { sub: userId };
      const options: SignOptions = {
        algorithm: 'RS256',
        expiresIn: '7d',
        header: { alg: 'RS256', typ: 'refresh' },
      };
      const refreshToken = sign(payload, privateKey, options);
      const cookies = cookie.serialize('frenchcodeareatoken', refreshToken, {
        httpOnly: true,
        maxAge: 3600000,
      });
      res.setHeader('Set-Cookie', cookies);
      return new HttpException('Utilisateur connecté', HttpStatus.OK);
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
  generateAccessTokenFromRefreshToken(refreshToken: string): string {
    try {
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
      const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
      const { sub: userId } = jwt.verify(refreshToken, publicKey);
      const tokenHeader = jwt.decode(refreshToken, { complete: true })?.header;
      if (tokenHeader?.typ === 'refresh') {
        const payload = { sub: userId };
        const options: SignOptions = {
          algorithm: 'RS256',
          expiresIn: '6m',
          header: { alg: 'RS256', typ: 'access' },
        };
        return sign(payload, privateKey, options);
      } else {
        return 'Nok';
      }
    } catch (error) {
      // Gérer l'erreur, par exemple, le refresh token est invalide
      throw new Error('Invalid refresh token');
    }
  }
}
