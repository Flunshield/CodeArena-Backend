import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthController } from '../../src/controlleur/auth/auth.controller';
import { RefreshTokenService } from '../../src/services/authentificationService/RefreshTokenService';
import { AuthService } from '../../src/services/authentificationService/auth.service';
import { UserConnect } from '../../src/interfaces/userInterface';

describe('AuthController (E2E)', () => {
  let authController: AuthController;
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let refreshTokenService: RefreshTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, RefreshTokenService],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  describe('login', () => {
    it('should authenticate user and return a refreshToken', async () => {
      // Mock dependencies
      const userLogin: UserConnect = {
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

      jest.spyOn(authService, 'connect').mockResolvedValue('mockRefreshToken');

      // Execute the login method
      await authController.login(userLogin, requestMock, responseMock);

      // Assertions
      expect(authService.connect).toHaveBeenCalledWith(
        userLogin,
        responseMock,
        'mockToken',
      );
      expect(responseMock.send).toHaveBeenCalledWith('mockRefreshToken');
    });

    it('should handle NotFoundException and return 404 status', async () => {
      // Mock dependencies
      const userLogin: UserConnect = {
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
        .mockRejectedValue(new NotFoundException('User not found'));

      // Execute the login method
      await authController.login(userLogin, requestMock, responseMock);

      // Assertions
      expect(responseMock.status).toHaveBeenCalledWith(404);
      expect(responseMock.json).toHaveBeenCalledWith({
        message: 'User not found',
      });
    });
  });
});
