import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

/**
 * Middleware pour vérifier les jetons JSON Web (JWT) dans l'en-tête Authorization.
 * Il extrait le jeton, le vérifie à l'aide d'une clé publique et attache le jeton décodé à l'objet de requête.
 * Si le jeton est invalide ou manquant, il répond avec un statut 401 Unauthorized.
 *
 * @remarks
 * Ce middleware suppose que le JWT est présent dans l'en-tête Authorization avec le schéma "Bearer".
 *
 * @public
 */
@Injectable()
export class VerifyJwtMiddleware implements NestMiddleware {
  /**
   * Gère la logique du middleware pour vérifier le JWT et attacher le jeton décodé à la requête.
   *
   * @param req - L'objet de requête Express.
   * @param res - L'objet de réponse Express.
   * @param next - La fonction de rappel pour passer le contrôle au middleware suivant.
   */
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8');
      try {
        req['decodedToken'] = jwt.verify(token, publicKey) as DecodedToken;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
}

interface DecodedToken {
  userId: string;
}
