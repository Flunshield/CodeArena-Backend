import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../authentificationService/auth.service';
import {
  CvUser,
  ResponseCreateUser,
  User,
} from '../../interfaces/userInterface';
import { Dto } from '../../dto/Dto';
import { MailService } from '../../email/service/MailService';
import { PdfService } from '../pdfservice/pdf.service';

const prisma: PrismaClient = new PrismaClient();

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
  constructor(
    private readonly mailService: MailService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Crée un nouvel utilisateur avec des vérifications d'existence et hachage sécurisé du mot de passe.
   *
   * @param data - Les détails de l'utilisateur à créer.
   * @returns Une promesse résolue avec un boolean indiquant si l'utilisateur a été créé avec succès.
   * @throws {Error} Une erreur si la création de l'utilisateur échoue.
   */
  public async create(data: Dto): Promise<ResponseCreateUser> {
    const regexPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    try {
      if (!regexPassword.test(data.password)) {
        // Si le mot de passe n'est pas conforme.
        return { bool: false, type: 'password' };
      }

      const userExist = await prisma.user.findFirst({
        where: {
          OR: [{ userName: data.userName }, { email: data.email }],
        },
      });

      const rankListe = await prisma.rankings.findMany();

      // On va chercher le rang bronze dans la table ranking
      const rankBronze = rankListe.find((element) => {
        return element.title === 'Bronze Rank';
      });

      if (!userExist) {
        const password: string = await AuthService.hashPassword(data.password);

        try {
          const createUser: User = await prisma.user.create({
            data: {
              userName: data.userName,
              password: password,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              groupsId: 1, // Par défaut groupe 1 qui équivaut au groupe utilisation lambda
            },
          });
          // createUser a réussi, procéder à la création de createRank
          const newUserRanking = await prisma.userRanking.create({
            data: {
              userID: createUser.id /* ID de l'utilisateur associé */,
              rankingsID: rankBronze.id /* ID du classement associé */,
              points: 0 /* La valeur des points que vous souhaitez attribuer */,
            },
          });

          // Realise les actions necessaire à l'envoie du mail de création de compte.
          const responseSendMail = await this.mailService.prepareMail(
            createUser.id,
            data,
            1,
          );
          return {
            bool: createUser && newUserRanking && responseSendMail,
            type: 'ok',
          };
        } catch (error) {
          console.error("Erreur lors de la création de l'utilisateur :", error);
          // Gérer l'erreur de création de l'utilisateur
        }
      } else {
        //Si l'utilisateur existe déja
        return { bool: false, type: 'username' };
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Met à jour les informations d'un utilisateur dans la base de données.
   *
   * @param user - Les nouvelles informations de l'utilisateur à mettre à jour.
   *
   * @returns Le code de statut HTTP indiquant le résultat de l'opération de mise à jour.
   * - HttpStatus.OK (200) si la mise à jour a réussi.
   * - HttpStatus.NOT_FOUND (404) si l'utilisateur n'a pas été trouvé dans la base de données.
   *
   * @throws Error si une erreur se produit lors de la mise à jour de l'utilisateur.
   *
   * @beta
   */
  async update(user: User) {
    /**
     * Met à jour les informations de l'utilisateur dans la base de données.
     * Les champs mis à jour incluent l'avatar, la présentation, la localisation, l'entreprise, l'école, GitHub, l'URL, le nom, le prénom et les titres.
     */
    const userUpdate = await prisma.user.update({
      where: {
        userName: user.userName,
        id: user.id,
      },
      data: {
        avatar: user.avatar,
        presentation: user.presentation,
        localisation: user.localisation,
        company: user.company,
        school: user.school,
        github: user.github,
        url: user.url,
        lastName: user.lastName,
        firstName: user.firstName,
        titlesId: parseInt(String(user.titlesId)),
        siren: user.siren,
        languagePreference: user.languagePreference,
      },
    });

    /**
     * Vérifie si la mise à jour de l'utilisateur a réussi.
     * Retourne le code de statut HTTP approprié en conséquence.
     */
    return userUpdate ? HttpStatus.OK : HttpStatus.NOT_FOUND;
  }

  /**
   * Récupère tous les titres disponibles depuis la base de données.
   *
   * @returns Une liste de tous les titres disponibles.
   *
   * @throws Error si une erreur se produit lors de la récupération des titres.
   *
   * @beta
   */
  async getTitles() {
    try {
      /**
       * Récupère tous les titres disponibles depuis la base de données.
       */
      return await prisma.title.findMany();
    } catch (error) {
      /**
       * Gère les erreurs survenues lors de la récupération des titres.
       */
      console.error('Erreur lors de la récupération des titres :', error);
    }
  }

  /**
   * Récupère tous les rangs disponibles depuis la base de données.
   *
   * @returns Une liste de tous les rangs disponibles.
   *
   * @throws Error si une erreur se produit lors de la récupération des rangs.
   *
   * @beta
   */
  async getRanks() {
    try {
      /**
       * Récupère tous les titres disponibles depuis la base de données.
       */
      return await prisma.rankings.findMany();
    } catch (error) {
      /**
       * Gère les erreurs survenues lors de la récupération des titres.
       */
      console.error('Erreur lors de la récupération des titres :', error);
    }
  }

  async getUsers(
    pageNumber: number,
    itemPerPage: number,
    isEntreprise: string,
    languagePreference: string,
  ) {
    const offset = (pageNumber - 1) * itemPerPage;
    const testEntreprise = isEntreprise === 'true' ? true : false;
    try {
      const users = await prisma.user.findMany({
        take: itemPerPage,
        skip: offset,
        where: {
          // Si testEntreprise est vrai, on cherche les utilisateurs avec les préférences de langue spécifiées si elles existent
          languagePreference: testEntreprise
            ? languagePreference === 'all'
              ? undefined
              : languagePreference
            : undefined,
        },
        select: {
          id: true,
          firstName: testEntreprise,
          lastName: testEntreprise,
          userName: true,
          email: testEntreprise,
          languagePreference: testEntreprise,
          cvUser: testEntreprise
            ? {
                select: {
                  id: true,
                },
                where: {
                  activate: true, // Condition pour sélectionner uniquement activate === true
                },
              }
            : undefined, // Si testEntreprise est faux, exclure cvUser
          nbGames: true,
          userRanking: {
            include: {
              rankings: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      // Trier les utilisateurs en fonction de la somme des points dans userRanking
      // Cela nécessite une récupération et un tri côté serveur/app, car Prisma ne gère pas encore le tri par relations multiples
      const userSorted = users.sort((a, b) => {
        const sumA = a.userRanking.reduce((acc, cur) => acc + cur.points, 0);
        const sumB = b.userRanking.reduce((acc, cur) => acc + cur.points, 0);
        return sumB - sumA; // Pour un tri décroissant
      });

      const countUser = await prisma.user.count({
        where: {
          languagePreference:
            languagePreference === 'all' ? undefined : languagePreference,
        },
      });

      return { item: userSorted, total: countUser };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs :', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
        include: {
          Histories: true,
          groups: true,
          commandeEntreprise: {
            take: 1, // Limite à un seul enregistrement
            orderBy: {
              dateCommande: 'desc', // Trie par dateCommande décroissante pour obtenir la dernière commande
            },
          },
          titles: {
            select: {
              id: true,
              label: true,
              value: true,
            },
          },
          userRanking: true,
          userTournament: true,
          userEvent: true,
          // Pour inclure les champs du modèle `user`
          _count: {
            select: {
              userRanking: true,
              userTournament: true,
              userEvent: true,
            },
          },
        },
      });
      if (user) {
        delete user.password;
      }
      return user;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur :", error);
      throw error;
    }
  }

  async getUsersByUserName(
    userNameSubstring: string,
    itemPerPage: number,
    isEntreprise: string,
  ) {
    try {
      const testEntreprise = isEntreprise === 'true' ? true : false;
      const users = await prisma.user.findMany({
        take: itemPerPage,
        where: {
          userName: {
            contains: userNameSubstring,
          },
        },
        select: {
          id: true,
          firstName: testEntreprise,
          lastName: testEntreprise,
          userName: true,
          email: testEntreprise,
          nbGames: true,
          userRanking: {
            include: {
              rankings: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      const countUser = await prisma.user.count({
        where: {
          userName: {
            contains: userNameSubstring,
          },
        },
      });
      return { item: users, total: countUser };
    } catch (error) {
      console.error(
        'Error fetching users with userName containing:',
        userNameSubstring,
        error,
      );
      throw error;
    }
  }

  async getUserByUserName(username: string) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          userName: username,
        },
        include: {
          Histories: true,
          groups: true,
          titles: {
            select: {
              id: true,
              label: true,
              value: true,
            },
          },
          userRanking: true,
          userTournament: true,
          userEvent: true,
          _count: {
            select: {
              userRanking: true,
              userTournament: true,
              userEvent: true,
            },
          },
        },
      });

      if (user) {
        delete user.password;
        return user;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur :", error);
      throw error;
    }
  }

  /**
   * Récupère les informations sur un utilisateur classé spécifique en fonction de son nom d'utilisateur.
   *
   * @param userName - Le nom d'utilisateur de l'utilisateur recherché.
   * @returns Les informations sur l'utilisateur classé et les utilisateurs classés en dessous de lui.
   *
   * @throws Error si une erreur se produit lors de la récupération des utilisateurs classés.
   *
   * @beta
   */
  async getUserRanked(userName?: string) {
    try {
      let users;

      if (userName) {
        /**
         * Récupère les informations sur un utilisateur spécifique en fonction de son nom d'utilisateur.
         */
        const user = await prisma.user.findFirst({
          where: {
            userName: userName,
          },
          include: {
            userRanking: {
              include: {
                rankings: true,
              },
            },
            titles: {
              select: {
                label: true,
              },
            },
          },
        });
        if (user) {
          const pointsValue = user.userRanking[0].points;

          /**
           * Récupère les utilisateurs classés en dessous de l'utilisateur spécifié.
           */
          const usersBelow = await prisma.userRanking.findMany({
            where: {
              points: {
                lte: pointsValue,
              },
              userID: {
                not: user.id,
              },
            },
            orderBy: {
              points: 'desc',
            },
            take: 9,
            include: {
              user: {
                select: {
                  id: true,
                  userName: true,
                  avatar: true,
                },
              },
              rankings: {
                select: {
                  title: true,
                },
              },
            },
          });
          users = {
            user,
            usersBelow: usersBelow,
          };
        }
      }

      /**
       * Si aucune information sur l'utilisateur n'est trouvée, récupère les dix premiers utilisateurs classés.
       */
      if (!users) {
        users = this.findTenUserRanking();
      }

      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs :', error);
    }
  }

  /**
   * Recherche les dix meilleurs classements d'utilisateurs.
   *
   * @returns Promise<Array<{
   *   user: {
   *     id: number;
   *     userName: string;
   *     avatar: string;
   *   };
   *   rankings: {
   *     title: string;
   *   }[];
   *   points: number;
   * }>> Une promesse qui résout avec un tableau des dix meilleurs classements d'utilisateurs.
   */
  async findTenUserRanking() {
    return prisma.userRanking.findMany({
      take: 10,
      orderBy: {
        points: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatar: true,
          },
        },
        rankings: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  /**
   * Récupère la dernière commande d'un utilisateur en fonction de son ID.
   *
   * Cette méthode recherche la première commande d'un utilisateur triée par date de commande
   * dans l'ordre décroissant, ce qui correspond à la commande la plus récente. Si aucune commande
   * n'est trouvée, une liste vide est retournée.
   *
   * @param {string} id - L'ID de l'utilisateur sous forme de chaîne de caractères.
   *
   * @returns {Promise<Object|Array>} - Retourne une promesse qui se résout avec la dernière commande
   *                                    de l'utilisateur si elle existe, sinon une liste vide.
   *
   * @throws {Error} - Lance une erreur si une opération échoue.
   */
  async getLastCommande(id: string) {
    const lastCommande = prisma.commandeEntreprise.findFirst({
      where: {
        userID: parseInt(id),
      },
      orderBy: {
        dateCommande: 'desc',
      },
    });

    if (lastCommande) {
      return lastCommande;
    } else {
      return [];
    }
  }

  async createCv(data: any) {
    const userExist = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });

    if (userExist) {
      try {
        const createCv = await prisma.cvUser.create({
          data: {
            userID: data.id,
            cvName: data.cvName,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            summary: data.summary,
            experiences: data.experiences,
            educations: data.educations,
            softSkills: data.softSkills,
            technicalSkills: data.technicalSkills,
            activate: data.activated ?? false,
          },
        });
        if (createCv) {
          return HttpStatus.CREATED;
        }
      } catch (error) {
        console.error('Erreur lors de la création du CV :', error);
        throw error;
      }
    } else {
      return [];
    }
  }

  async getCv(id: string) {
    const cv: any[] = await prisma.cvUser.findMany({
      where: {
        userID: parseInt(id),
      },
    });
    if (cv) {
      return cv;
    } else {
      return [];
    }
  }

  async getNbCv(userId: any) {
    const nbCv = await prisma.cvUser.count({
      where: {
        userID: userId,
      },
    });
    return nbCv;
  }

  async deleteCv(idElementToDelete: any, userId: any) {
    const cvExist = await prisma.cvUser.findFirst({
      where: {
        id: idElementToDelete,
        userID: userId,
      },
    });

    if (cvExist) {
      try {
        const deleteCv = await prisma.cvUser.delete({
          where: {
            id: idElementToDelete,
          },
        });
        if (deleteCv) {
          return HttpStatus.OK;
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du CV :', error);
        throw error;
      }
    } else {
      return [];
    }
  }

  async generateCvPDF(id: string, idCv: string, isEntreprise: boolean) {
    let cv;
    if (isEntreprise) {
      cv = await prisma.cvUser.findFirst({
        where: {
          id: parseInt(idCv),
        },
      });
    } else {
      cv = await prisma.cvUser.findFirst({
        where: {
          id: parseInt(idCv),
          userID: parseInt(id),
        },
      });
    }
    return await this.pdfService.generateCvPDF(cv as unknown as CvUser);
  }

  async activateCv(idCv: any, userId: any) {
    const cvExist = await prisma.cvUser.findFirst({
      where: {
        id: idCv,
        userID: userId,
      },
    });

    if (cvExist) {
      try {
        const desactivAllCv = await prisma.cvUser.updateMany({
          where: {
            userID: userId,
          },
          data: {
            activate: false,
          },
        });

        if (desactivAllCv && cvExist.activate === false) {
          const activateCv = await prisma.cvUser.update({
            where: {
              id: idCv,
            },
            data: {
              activate: true,
            },
          });
          if (activateCv) {
            return HttpStatus.OK;
          }
        } else {
          return HttpStatus.ACCEPTED;
        }
      } catch (error) {
        console.error("Erreur lors de l'activation du CV :", error);
        throw error;
      }
    } else {
      return [];
    }
  }
}
