import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { DecodedTokenController } from '../interfaces/userInterface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    return roles.includes(decodedToken.aud.group.roles);
  }
}
