import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

/**
 * Middleware pour la vérification et la validation des jetons JWT dans l'en-tête Authorization.
 *
 * @remarks
 * Ce middleware analyse l'en-tête Authorization de la requête HTTP, extrait le jeton JWT,
 * puis le décode et le valide à l'aide de la clé publique spécifiée. Il vérifie également si
 * le type de jeton est 'access' et ajoute le jeton décodé à l'objet de requête sous la propriété
 * 'decodedToken' pour une utilisation ultérieure.
 *
 * @example
 * // Exemple d'utilisation dans un contrôleur Nest.js
 * @Controller('example')
 * export class ExampleController {
 *   @Get('protected')
 *   @UseMiddleware(VerifyJwtMiddleware)
 *   protectedRoute(@Req() request) {
 *     const decodedToken = request['decodedToken'];
 *     // ... Logique de la route protégée avec le jeton décodé *   }
 * }
 */
@Injectable()
export class VerifyJwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const publicKey = fs.readFileSync('public_key.pem', 'utf-8');

      try {
        const decodedToken = jwt.verify(token, publicKey) as DecodedToken;

        // Vérifie si le champ 'typ' de l'en-tête est égal à 'access'
        const tokenHeader = jwt.decode(token, { complete: true })?.header;
        if (tokenHeader?.typ === 'access') {
          req['decodedToken'] = decodedToken;
          next();
        } else {
          res.status(401).send({ error: 'Unauthorized - Invalid token type' });
        }
      } catch (error) {
        res.status(401).send({ error: 'Unauthorized - Invalid token' });
      }
    } else {
      res
        .status(401)
        .send({ message: 'Unauthorized - Missing Authorization header' });
    }
  }
}

export interface DecodedToken {
  userId: string;
}
