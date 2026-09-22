import { User, UserProps } from '../entities/User.js';
import { EmailAddress } from '../value-objects/EmailAddress.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  existsByEmail(email: EmailAddress): Promise<boolean>;
  existsByGoogleId(googleId: string): Promise<boolean>;
  count(): Promise<number>;
}