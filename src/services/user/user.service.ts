import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../authentificationService/auth.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MailService } from '../../email/service/MailService';
import { User } from '../../interfaces/userInterface';

const prisma = new PrismaClient();

//TODO: Lorsque la page "mon compte" sera créé coté front, il faudra gérer la vérification du mail. OU obliger a valdier le mail avant la première connexion.

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
  constructor(private readonly MailService: MailService) {}
  /**
   * Crée un nouvel utilisateur avec des vérifications d'existence et hachage sécurisé du mot de passe.
   *
   * @param data - Les détails de l'utilisateur à créer.
   * @returns Une promesse résolue avec un boolean indiquant si l'utilisateur a été créé avec succès.
   * @throws {Error} Une erreur si la création de l'utilisateur échoue.
   */
  public async create(data: User): Promise<boolean> {
    try {
      const userListe = await prisma.user.findMany();

      const userExistPromises: Promise<boolean>[] = userListe.map(
        async (user) => {
          return user.userName === data.userName || user.email === data.email;
        },
      );

      // Attendez que toutes les vérifications soient terminées
      const userExistArray: boolean[] = await Promise.all(userExistPromises);

      // Vérifiez s'il y a un utilisateur existant
      const userExist: boolean = userExistArray.some(
        (exists: boolean) => exists,
      );

      if (!userExist) {
        const password: string = await AuthService.hashPassword(data.password);
        const createUser: User = await prisma.user.create({
          data: {
            userName: data.userName,
            password: password,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            groupsId: 1, //Par défaut groupe 1 qui équivaut au groupe utilisateur lambda
          },
        });

        // Realise les actions necessaire à l'envoie du mail de création de compte.
        const responseSendMail = await this.MailService.prepareMail(
          createUser.id,
          data,
          1,
        );

        return createUser && responseSendMail;
      } else {
        //Si l'utilisateur existe déja
        return false;
      }
    } catch (error) {
      throw new HttpException(
        'Erreur interne du serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
