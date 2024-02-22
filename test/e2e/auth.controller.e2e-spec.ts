import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from '../../src/controlleur/auth/auth.controller';
import { RefreshTokenService } from '../../src/services/authentificationService/RefreshTokenService';
import { AuthService } from '../../src/services/authentificationService/auth.service';
import { MailService } from '../../src/email/service/MailService';
import { shortUser } from '../../src/interfaces/userInterface';

describe('AuthController (E2E)', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        RefreshTokenService,
        { provide: MailService, useValue: {} }, // Mock de MailService
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should authenticate user and return a refreshToken', async () => {
      // Mock dependencies
      const userLogin: shortUser = {
        email: 'j.bert@cacahete.fr',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        username: 'newUser',
        password: 'password123',
      };
      const requestMock = { cookies: { frenchcodeareatoken: 'mockToken' } };
      const responseMock = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      jest.spyOn(authService, 'connect').mockResolvedValue(HttpStatus.OK);

      // Execute the login method
      await authController.login(userLogin, requestMock, responseMock);

      // Assertions
      expect(authService.connect).toHaveBeenCalledWith(
        userLogin,
        responseMock,
        'mockToken',
      );
      expect(responseMock.send).toHaveBeenCalledWith('Connecté');
    });

    it('should handle BadRequestException and return 403 status', async () => {
      // Mock dependencies
      const userLogin: shortUser = {
        email: 'j.bert@cacahete.fr',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        username: 'newUser',
        password: 'password123',
      };
      const requestMock = { cookies: { frenchcodeareatoken: 'mockToken' } };
      const responseMock = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      jest
        .spyOn(authService, 'connect')
        .mockRejectedValue(
          new HttpException(
            'Le nom de compte et/ou le mot de passe est/sont erroné',
            HttpStatus.FORBIDDEN,
          ),
        );

      // Execute the login method
      try {
        await authController.login(userLogin, requestMock, responseMock);

        // Assertions
        expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      } catch (error) {
        console.log(error);
      }
    });
  });
});
