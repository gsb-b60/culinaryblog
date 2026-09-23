import { UserRole } from '../../domain/enums/UserRole.js';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  isActive: boolean;
}

export interface ICurrentUserService {
  getCurrentUser(): CurrentUser | null;
  setCurrentUser(user: CurrentUser): void;
  clearCurrentUser(): void;
}