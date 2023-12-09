import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/controlleur/auth/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import { UserConnect } from '../../src/interfaces/userInterface';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a valid response on login', async () => {
    const userLogin: UserConnect = {
      userName: 'newUser',
      password: 'password123',
    };
    const request = { cookies: { frenchcodeareatoken: null } };
    const response = { send: jest.fn() };

    // Mock de la méthode connect pour qu'elle renvoie un objet contenant la clé 'access_token'
    jest.spyOn(controller['AuthService'], 'connect').mockResolvedValueOnce({
      access_token: generateTestToken(userLogin.userName),
    });

    // Appel de la méthode login du contrôleur
    await controller.login(userLogin, request, response);

    // Assurez-vous que la méthode connect a été appelée avec les bons paramètres
    expect(controller['AuthService'].connect).toHaveBeenCalledWith(
      userLogin,
      response,
      null,
    );

    // Assurez-vous que la réponse contient la chaîne "frenchcodeareatoken"
    expect(response.send).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: expect.any(String) }),
    );
  });
});

// Fonction de test pour générer un token de test
export function generateTestToken(userName: string): string {
  // Chargement de la clé privée pour la signature du token
  const privateKey = fs.readFileSync('private_key.pem', 'utf-8');

  // Génération du token JWT
  const token = jwt.sign({ username: userName }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h', // Spécifiez la durée de validité du token, par exemple, 1 heure
  });

  return token;
}
