import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as cookie from 'cookie';
import { Response } from 'express';

export function createToken(
  res: Response,
  userName: string,
): { access_token: string } {
  const privateKey = fs.readFileSync('private_key.pem', 'utf-8');

  // Génération du token JWT
  const token = jwt.sign({ username: userName }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '9m',
  });

  if (res && res.setHeader) {
    const cookies = cookie.serialize('frenchcodeareatoken', token, {
      httpOnly: true,
      maxAge: 3600000,
    });

    res.setHeader('Set-Cookie', cookies);
  }

  return { access_token: token };
}
