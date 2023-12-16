/*
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RefreshTokenService } from '../../src/services/authentificationService/RefreshTokenService';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenService],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and return HttpException', async () => {
      const userId = 1;
      const mockResponse = {
        setHeader: jest.fn(),
      } as any;

      const result = await service.generateRefreshToken(userId, mockResponse);

      expect(result).toBeInstanceOf(HttpException);
      expect(result.getResponse()).toEqual('Utilisateur connecté');
      expect(result.getStatus()).toEqual(HttpStatus.OK);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.any(String),
      );
    });
  });

  describe('generateAccessTokenFromRefreshToken', () => {
    it('should generate an access token from a valid refresh token', () => {
      const privateKey = fs.readFileSync('private_key.pem', 'utf-8');
      const payload = { id: 1 };
      const validRefreshToken = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
      });
      const result =
        service.generateAccessTokenFromRefreshToken(validRefreshToken);

      expect(result).toEqual(expect.any(String));
    });

    it('should throw an error for an invalid refresh token', () => {
      const refreshToken = 'invalid_refresh_token';

      expect(() => {
        service.generateAccessTokenFromRefreshToken(refreshToken);
      }).toThrow('Invalid refresh token');
    });
  });
});
*/
