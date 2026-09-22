export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  jti: string;
}

export interface IJwtService {
  generateAccessToken(payload: JwtPayload): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): JwtPayload | null;
  verifyRefreshToken(token: string): string | null; // Returns token hash
  decodeToken(token: string): JwtPayload | null;
}