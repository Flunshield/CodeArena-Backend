import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { DecodedTokenController } from '../interfaces/userInterface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Détermine si l'utilisateur actuel peut accéder à une route spécifique basée sur ses rôles.
   * Cette méthode extrait les rôles requis de la route à partir des métadonnées de la méthode du contrôleur,
   * puis compare ces rôles avec ceux décodés du token JWT de l'utilisateur pour déterminer si l'accès doit être accordé.
   *
   * @param context - Le contexte d'exécution qui fournit des détails spécifiques à la requête en cours.
   * @returns `true` si l'utilisateur a les rôles nécessaires pour accéder à la route, sinon `false`.
   *
   * @remarks
   * - Si aucune annotation de rôle n'est associée à la route (c.-à-d. si `roles` est `undefined` ou vide),
   *   la méthode retourne `true`, autorisant l'accès par défaut.
   * - Le token JWT est supposé être dans l'en-tête 'authorization' de la requête sous la forme 'Bearer [token]'.
   * - Cette méthode suppose que le token JWT inclut une propriété `aud` avec une structure contenant `data.groups.roles`
   *   pour les rôles de l'utilisateur.
   */
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true; // Si aucune annotation de rôle, autorise l'accès
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization.split(' ')[1];
    // Décoder le token JWT pour obtenir les informations de l'utilisateur
    const decodedToken: DecodedTokenController = jwt.decode(
      token,
    ) as unknown as DecodedTokenController;

    return roles.includes(decodedToken.aud.data.groups.roles);
  }
}
