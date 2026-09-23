import { UserRole } from '../enums/UserRole.js';
import { EmailAddress } from '../value-objects/EmailAddress.js';

export interface UserProps {
  id: string;
  email: EmailAddress;
  passwordHash?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  googleId?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'email' | 'emailVerified' | 'role' | 'isActive' | 'twoFactorEnabled' | 'lockoutEnabled' | 'accessFailedCount'> & { email: string }): User {
    const now = new Date();
    return new User({
      ...props,
      id: crypto.randomUUID(),
      email: EmailAddress.create(props.email),
      role: UserRole.AUTHOR,
      emailVerified: false,
      isActive: true,
      twoFactorEnabled: false,
      lockoutEnabled: false,
      accessFailedCount: 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: UserProps): User {
    return new User(props);
  }

  get id(): string { return this.props.id; }

  get email(): EmailAddress { return this.props.email; }

  get passwordHash(): string | undefined { return this.props.passwordHash; }

  get displayName(): string { return this.props.displayName; }

  get avatarUrl(): string | undefined { return this.props.avatarUrl; }

  get bio(): string | undefined { return this.props.bio; }

  get googleId(): string | undefined { return this.props.googleId; }

  get role(): UserRole { return this.props.role; }

  get emailVerified(): boolean { return this.props.emailVerified; }

  get isActive(): boolean { return this.props.isActive; }

  get twoFactorEnabled(): boolean { return this.props.twoFactorEnabled; }

  get lockoutEnabled(): boolean { return this.props.lockoutEnabled; }

  get accessFailedCount(): number { return this.props.accessFailedCount; }

  get createdAt(): Date { return this.props.createdAt; }

  get updatedAt(): Date { return this.props.updatedAt; }

  get isDeleted(): boolean { return this.props.isDeleted; }

  get version(): number { return this.props.version; }

  setPasswordHash(hash: string): void {
    this.props.passwordHash = hash;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  verifyEmail(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  updateProfile(data: Partial<Pick<UserProps, 'displayName' | 'avatarUrl' | 'bio'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  recordFailedAccess(): void {
    this.props.accessFailedCount += 1;
    if (this.props.accessFailedCount >= 5 && this.props.lockoutEnabled) {
      this.props.isActive = false;
    }
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  resetAccessFailedCount(): void {
    this.props.accessFailedCount = 0;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): UserProps {
    return { ...this.props };
  }
}