import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';
import {AuthService} from '../authentificationService/auth.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {MailService} from '../../email/service/MailService';
import {ResponseCreateUser, User} from '../../interfaces/userInterface';
import {CreateUserDto} from '../../dto/CreateUserDto';
import {PAGE_SIZE} from '../../constantes/contante';

const prisma: PrismaClient = new PrismaClient();

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
    constructor(private readonly MailService: MailService) {
    }

    /**
     * Crée un nouvel utilisateur avec des vérifications d'existence et hachage sécurisé du mot de passe.
     *
     * @param data - Les détails de l'utilisateur à créer.
     * @returns Une promesse résolue avec un boolean indiquant si l'utilisateur a été créé avec succès.
     * @throws {Error} Une erreur si la création de l'utilisateur échoue.
     */
    public async create(data: CreateUserDto): Promise<ResponseCreateUser> {
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        try {
            if (!regexPassword.test(data.password)) {
                // Si le mot de passe n'est pas conforme.
                return {bool: false, type: "password"};
            }

            const userExist = await prisma.user.findFirst({
                where: {
                    OR: [{userName: data.userName}, {email: data.email}],
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
                    const responseSendMail = await this.MailService.prepareMail(
                        createUser.id,
                        data,
                        1,
                    );
                    return {bool: createUser && newUserRanking && responseSendMail, type: "ok"};
                } catch (error) {
                    console.error("Erreur lors de la création de l'utilisateur :", error);
                    // Gérer l'erreur de création de l'utilisateur
                }
            } else {
                //Si l'utilisateur existe déja
                return {bool: false, type: "username"};
            }
        } catch (error) {
            throw new HttpException(
                'Erreur interne du serveur',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
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

    async getUsers(pageNumber: number) {
        try {
            const skip = pageNumber * PAGE_SIZE;
            return await prisma.user.findMany({
                take: PAGE_SIZE,
                skip: skip,
                include: {
                    userRanking: {
                        include: {
                            rankings: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            /**
             * Gère les erreurs survenues lors de la récupération des titres.
             */
            console.error('Erreur lors de la récupération des titres :', error);
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
     * @returns {Promise<Array<{
     *   user: {
     *     id: number;
     *     userName: string;
     *     avatar: string;
     *   };
     *   rankings: {
     *     title: string;
     *   }[];
     *   points: number;
     * }>>} Une promesse qui résout avec un tableau des dix meilleurs classements d'utilisateurs.
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

    async attributeEntrepriseRole(user: User) {
        return prisma.user.update({
            where: {
                userName: user.userName,
                id: user.id,
            },
            data: {
                groupsId: 3,
            },
        });
    }
}
