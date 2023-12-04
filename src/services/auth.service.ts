import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Service responsable de la gestion de l'authentification et du hachage des mots de passe.
 *
 * @remarks
 * Ce service utilise la bibliothèque bcrypt pour fournir des fonctionnalités de hachage sécurisé des mots de passe.
 *
 * @example
 * ```typescript
 * // Exemple d'utilisation dans un autre module NestJS
 * const authService = new AuthService();
 * const hashedPassword = await authService.hashPassword('mySecurePassword');
 * console.log('Mot de passe haché:', hashedPassword);
 * ```
 */
@Injectable()
export class AuthService {
  /**
   * Hache le mot de passe fourni en utilisant la bibliothèque bcrypt.
   *
   * @param password - Le mot de passe à hacher.
   * @returns Une promesse résolue avec le mot de passe haché.
   * @throws {Error} Une erreur si le hachage échoue.
   *
   * @example
   * ```typescript
   * // Exemple d'appel de la fonction de hachage de mot de passe
   * const hashedPassword = await AuthService.hashPassword('mySecurePassword');
   * console.log('Mot de passe haché:', hashedPassword);
   * ```
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // Le coût du hachage

    // Génère un sel (salt)
    const salt = await bcrypt.genSalt(saltRounds);

    // Hache le mot de passe avec le sel
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare un mot de passe en texte brut avec un mot de passe haché.
   *
   * @param plainTextPassword - Le mot de passe en texte brut à comparer.
   * @param hashedPassword - Le mot de passe haché à comparer.
   * @returns Une promesse résolue avec un boolean indiquant si les mots de passe correspondent.
   * @throws {Error} Une erreur si la comparaison échoue.
   *
   * @example
   * ```typescript
   * // Exemple d'appel de la fonction de comparaison de mots de passe
   * const passwordsMatch = await authService.comparePasswords('userPassword', 'hashedPasswordFromDatabase');
   * console.log('Les mots de passe correspondent ?', passwordsMatch);
   * ```
   */
  async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
