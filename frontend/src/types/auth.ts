export interface RegisterPayload {
  fullName: string
  email: string
  userName: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  userName: string
  avatarUrl?: string
  roles: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  bio?: string
  role: string
  emailVerified: boolean
  isActive: boolean
  createdAt: string
}

export interface UpdateProfilePayload {
  displayName?: string
  avatarUrl?: string
  bio?: string
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
