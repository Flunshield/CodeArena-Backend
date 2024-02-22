// noinspection SpellCheckingInspection

/**
 * @fileoverview Tests pour UserController
 * @module controllers
 * @preferred
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../src/controlleur/user/user.controller';
import { UserService } from '../../src/services/user/user.service';
import { CreateUserDto } from '../../src/dto/CreateUserDto';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Tests pour le UserController.
 *
 * @group UserController
 */
describe('UserController', () => {
  let controller: UserController;
  let userServiceMock: jest.Mocked<UserService>;

  /**
   * Met en place l'environnement de test avant chaque test.
   *
   * @async
   */
  beforeEach(async () => {
    // Simule le UserService
    userServiceMock = {
      create: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    // Crée un module de test
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    }).compile();

    // Obtient l'instance de UserController
    controller = module.get<UserController>(UserController);
  });

  /**
   * Nettoie l'environnement de test après chaque test.
   *
   */
  afterEach(() => {
    // Efface tous les mocks
    jest.clearAllMocks();
  });

  /**
   * Cas de test : UserController doit être défini.
   *
   */
  it('should be defined', () => {
    // Assert
    expect(controller).toBeDefined();
  });

  /**
   * Groupe de tests : create
   *
   * @group create
   */
  describe('create', () => {
    /**
     * Cas de test : doit créer un nouvel utilisateur lorsque l'utilisateur n'existe pas.
     *
     * @async
     */
    it('should create a new user when user does not exist', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'j.bert@cacahete.fr',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        username: 'newUser',
        password: 'password123' /* ...other user properties */,
      };
      userServiceMock.create.mockResolvedValue(true);

      // Act
      const result = await controller.create(createUserDto);

      // Assert
      expect(result).toBeInstanceOf(HttpException);
      expect(result.getStatus()).toEqual(HttpStatus.OK);
      expect(result.getResponse()).toEqual('Utilisateur créé avec succès');
    });

    /**
     * Cas de test : doit renvoyer BadRequest lorsque l'utilisateur existe déjà.
     *
     * @async
     */
    it('should return BadRequest when user already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'j.bert@cacahete.fr',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        username: 'existingUser',
        password: 'password123' /* ...other user properties */,
      };
      userServiceMock.create.mockResolvedValue(false);

      // Act
      try {
        await controller.create(createUserDto);
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
        expect(error.getResponse()).toEqual(
          "Le nom de compte n'est pas disponnible",
        );
      }
    });

    /**
     * Cas de test : doit renvoyer InternalServerError en cas d'erreur de service.
     *
     * @async
     */
    it('should return InternalServerError on service error', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'j.bert@cacahete.fr',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        username: 'newUser',
        password: 'password123',
      };
      userServiceMock.create.mockRejectedValue(
        new HttpException(
          'Erreur de base de données',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      // Act
      try {
        await controller.create(createUserDto);
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });
});
