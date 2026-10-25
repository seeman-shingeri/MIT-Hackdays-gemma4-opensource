export type UserRole = 'citizen' | 'maintenance' | 'admin';

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  passwordHash: string; // SHA-256 hashed password
  salt: string;
  createdAt: string;
  lastActiveAt: string;
  emailVerified: boolean;
}

export interface SessionInfo {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  maskedEmail: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  totalPoints: number;
  identificationPoints: number;
  resolutionPoints: number;
  validReportsCount: number;
  verifiedResolutionsCount: number;
  averageRating: number;
  ratingsCount: number;
  badges: string[];
}
