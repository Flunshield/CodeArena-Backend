import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User, UserConnect } from '../../interfaces/userInterface';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../auth.service';
import { CreateUserDto } from '../../dto/CreateUserDto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as cookie from 'cookie';

const prisma = new PrismaClient();

/**
 * Service responsable de la gestion des utilisateurs.
 *
 * Ce service fournit des fonctionnalités telles que la création d'un nouvel utilisateur
 * avec des vérifications d'existence et le hachage sécurisé du mot de passe.
 *
 * @remarks
 * Ce service utilise le client Prisma pour interagir avec la base de données.
 *
 * @example
 * ```typescript
 * const userService = new UserService();
 * const newUser: User = { ... }; // Définir les détails de l'utilisateur
 * const userCreated = await userService.create(newUser);
 * console.log('L\'utilisateur a été créé avec succès ?', userCreated);
 * ```
 */
@Injectable()
export class UserService {
  /**
   * Crée un nouvel utilisateur avec des vérifications d'existence et hachage sécurisé du mot de passe.
   *
   * @param data - Les détails de l'utilisateur à créer.
   * @returns Une promesse résolue avec un boolean indiquant si l'utilisateur a été créé avec succès.
   * @throws {Error} Une erreur si la création de l'utilisateur échoue.
   */
  public async create(data: CreateUserDto): Promise<boolean> {
    try {
      const userListe = await prisma.user.findMany();

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

      if (!userExist) {
        await prisma.user.create({
          data: {
            userName: data.userName,
            password: await AuthService.hashPassword(data.password),
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            groupsId: 1, //Par défaut groupe 1 qui équivaut au groupe utilisateur lambda
          },
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
            const privateKey = fs.readFileSync('private_key.pem', 'utf-8');

            // Génération du token JWT
            const token = jwt.sign(
              { username: credentials.userName },
              privateKey,
              { algorithm: 'RS256', expiresIn: '1h' },
            );

            if (res && res.setHeader) {
              const cookies = cookie.serialize('set-cookie', token, {
                httpOnly: true,
                maxAge: 3600000,
              });

              res.setHeader('frenchCodeAreaToken', cookies);
            }

            return { access_token: token };
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
