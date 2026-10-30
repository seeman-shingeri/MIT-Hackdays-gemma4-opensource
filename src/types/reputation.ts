import type { UserRole } from './auth';

export type PointEventType = 
  | 'VALID_REPORT'
  | 'EVIDENCE_BONUS'
  | 'RESOLUTION_COMPLETED'
  | 'RESOLUTION_EVIDENCE_BONUS'
  | 'REVERSAL';

export interface PointsConfig {
  VALID_REPORT: number;
  EVIDENCE_BONUS: number;
  RESOLUTION_COMPLETED: number;
  RESOLUTION_EVIDENCE_BONUS: number;
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  VALID_REPORT: 10,
  EVIDENCE_BONUS: 5,
  RESOLUTION_COMPLETED: 20,
  RESOLUTION_EVIDENCE_BONUS: 5,
};

export interface PointTransaction {
  id: string;
  userId: string;
  reportId: string;
  eventType: PointEventType;
  points: number;
  category: 'IDENTIFICATION' | 'RESOLUTION';
  reason: string;
  createdAt: string;
  awardedBy: string; // Actor user ID or 'SYSTEM'
}

export type RatingCategory = 
  | 'REPORT_ACCURACY'
  | 'RESOLUTION_QUALITY'
  | 'COMMUNICATION_CLARITY';

export interface ReportRating {
  id: string;
  reportId: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  category: RatingCategory;
  score: number; // 1 to 5
  comment?: string;
  createdAt: string;
}

export type ActivityActionType = 
  | 'REPORT_CREATED'
  | 'REPORT_UPDATED'
  | 'REPORT_ASSIGNED'
  | 'REPAIR_STARTED'
  | 'REPORT_RESOLVED'
  | 'RESOLUTION_VERIFIED'
  | 'REPORT_DELETED'
  | 'RATING_SUBMITTED'
  | 'POINTS_AWARDED'
  | 'POINTS_REVERSED';

export interface ReportActivityItem {
  id: string;
  reportId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  actionType: ActivityActionType;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ContributorRanking {
  rank: number;
  userId: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  totalPoints: number;
  identificationPoints: number;
  resolutionPoints: number;
  verifiedContributions: number;
  averageRating: number;
  ratingsCount: number;
  joinedAt: string;
}

export type LeaderboardPeriod = 'all-time' | 'this-month';
export type LeaderboardFilter = 'all' | 'reporters' | 'resolvers' | 'highest-rated';

export interface BadgeProgressInfo {
  badgeName: string;
  description: string;
  earned: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
}

