import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export class PasswordService {
  private static readonly BCRYPT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    // Use argon2id as primary, bcrypt as fallback
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    } catch {
      return bcrypt.hash(password, this.BCRYPT_ROUNDS);
    }
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    // Try argon2 first
    try {
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, password);
      }
    } catch {
      // Fall through to bcrypt
    }
    
    // Try bcrypt
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  static async needsRehash(hash: string): Promise<boolean> {
    if (hash.startsWith('$argon2')) {
      try {
        return argon2.needsRehash(hash, {
          memoryCost: 2 ** 16,
          timeCost: 3,
          parallelism: 1,
        });
      } catch {
        return true;
      }
    }
    // For bcrypt, check rounds
    const rounds = bcrypt.getRounds(hash);
    return rounds < this.BCRYPT_ROUNDS;
  }
}