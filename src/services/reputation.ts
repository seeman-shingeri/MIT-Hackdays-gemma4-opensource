import type { 
  PointTransaction, 
  PointEventType, 
  ContributorRanking, 
  LeaderboardPeriod, 
  LeaderboardFilter,
  BadgeProgressInfo
} from '../types/reputation';
import { DEFAULT_POINTS_CONFIG } from '../types/reputation';
import type { PublicUserProfile } from '../types/auth';
import { loadAllUsers, maskEmail } from './auth';
import { calculateUserRatingStats } from './ratings';
import { logActivity } from './activity';

const STORAGE_TRANSACTIONS_KEY = 'repair_ai_point_transactions_v2';

export function loadAllTransactions(): PointTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: PointTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save point transactions:', err);
  }
}

/**
 * Awards points to a user with strict duplicate check.
 * Prevents multiple awards for the exact same event on the same report.
 */
export function awardPoints(
  userId: string,
  reportId: string,
  eventType: PointEventType,
  customPoints?: number,
  awardedBy = 'SYSTEM',
  customReason?: string
): { success: boolean; transaction?: PointTransaction; error?: string } {
  if (!userId) {
    return { success: false, error: 'User ID is required to award points.' };
  }

  const transactions = loadAllTransactions();

  // Prevent duplicate awards for the same user, report, and eventType (unless it's a REVERSAL)
  if (eventType !== 'REVERSAL') {
    const existing = transactions.find(
      t => t.userId === userId && t.reportId === reportId && t.eventType === eventType
    );
    if (existing) {
      return { success: false, error: `Points already awarded for ${eventType} on this report.` };
    }
  }

  let points = 0;
  let category: 'IDENTIFICATION' | 'RESOLUTION' = 'IDENTIFICATION';
  let defaultReason = '';

  switch (eventType) {
    case 'VALID_REPORT':
      points = customPoints ?? DEFAULT_POINTS_CONFIG.VALID_REPORT;
      category = 'IDENTIFICATION';
      defaultReason = 'Report accepted as valid civic infrastructure fault (+10)';
      break;
    case 'EVIDENCE_BONUS':
      points = customPoints ?? DEFAULT_POINTS_CONFIG.EVIDENCE_BONUS;
      category = 'IDENTIFICATION';
      defaultReason = 'High-utility evidence photograph confirmed by reviewer (+5)';
      break;
    case 'RESOLUTION_COMPLETED':
      points = customPoints ?? DEFAULT_POINTS_CONFIG.RESOLUTION_COMPLETED;
      category = 'RESOLUTION';
      defaultReason = 'Authorized repair resolution completed and confirmed (+20)';
      break;
    case 'RESOLUTION_EVIDENCE_BONUS':
      points = customPoints ?? DEFAULT_POINTS_CONFIG.RESOLUTION_EVIDENCE_BONUS;
      category = 'RESOLUTION';
      defaultReason = 'Confirmed photographic resolution evidence verified (+5)';
      break;
    case 'REVERSAL':
      points = customPoints ? -Math.abs(customPoints) : -10;
      category = 'IDENTIFICATION';
      defaultReason = 'Point deduction: report invalidated upon re-inspection';
      break;
  }

  const newTx: PointTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    reportId,
    eventType,
    points,
    category,
    reason: customReason || defaultReason,
    createdAt: new Date().toISOString(),
    awardedBy,
  };

  saveTransactions([newTx, ...transactions]);

  // Log activity
  logActivity(
    eventType === 'REVERSAL' ? 'POINTS_REVERSED' : 'POINTS_AWARDED',
    reportId,
    null,
    `${points > 0 ? '+' : ''}${points} pts awarded to user: ${newTx.reason}`,
    { userId, points, eventType }
  );

  return { success: true, transaction: newTx };
}

/**
 * Reverses points previously awarded if an accepted report is later invalidated.
 */
export function reversePoints(
  userId: string,
  reportId: string,
  pointsToDeduct: number,
  reason: string,
  actorId = 'SYSTEM'
): { success: boolean; transaction?: PointTransaction } {
  return awardPoints(userId, reportId, 'REVERSAL', pointsToDeduct, actorId, reason);
}

/**
 * Computes earned badges based strictly on actual user activity records.
 */
export function calculateEarnedBadges(
  validReportsCount: number,
  verifiedResolutionsCount: number,
  evidenceBonusCount: number,
  totalPoints: number
): string[] {
  const badges: string[] = [];

  if (validReportsCount >= 1) {
    badges.push('First Valid Report');
  }
  if (evidenceBonusCount >= 1) {
    badges.push('Evidence Expert');
  }
  if (validReportsCount >= 5) {
    badges.push('Five Verified Reports');
  }
  if (verifiedResolutionsCount >= 1) {
    badges.push('First Confirmed Repair');
  }
  if (totalPoints >= 50) {
    badges.push('Community Helper');
  }

  return badges;
}

/**
 * Computes progress counters and percentages toward each milestone badge.
 */
export function calculateBadgeProgress(
  validReportsCount: number,
  verifiedResolutionsCount: number,
  evidenceBonusCount: number,
  totalPoints: number
): BadgeProgressInfo[] {
  const criteria = [
    {
      badgeName: 'First Valid Report',
      description: 'Submit your first verified civic infrastructure issue report.',
      currentValue: validReportsCount,
      targetValue: 1,
    },
    {
      badgeName: 'Evidence Expert',
      description: 'Submit high-utility evidence photograph verified by dispatch.',
      currentValue: evidenceBonusCount,
      targetValue: 1,
    },
    {
      badgeName: 'Five Verified Reports',
      description: 'Submit 5 corroborated infrastructure reports.',
      currentValue: validReportsCount,
      targetValue: 5,
    },
    {
      badgeName: 'First Confirmed Repair',
      description: 'Complete and verify your first on-site repair resolution.',
      currentValue: verifiedResolutionsCount,
      targetValue: 1,
    },
    {
      badgeName: 'Community Helper',
      description: 'Accumulate 50 reputation points across reports and repairs.',
      currentValue: totalPoints,
      targetValue: 50,
    },
  ];

  return criteria.map(c => {
    const earned = c.currentValue >= c.targetValue;
    const progressPercent = Math.min(100, Math.round((c.currentValue / c.targetValue) * 100));
    return {
      badgeName: c.badgeName,
      description: c.description,
      earned,
      currentValue: c.currentValue,
      targetValue: c.targetValue,
      progressPercent,
    };
  });
}


/**
 * Retrieves full public contributor profile for a user ID.
 */
export function getPublicProfile(userId: string): PublicUserProfile | null {
  const users = loadAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const transactions = loadAllTransactions().filter(t => t.userId === userId);

  let identificationPoints = 0;
  let resolutionPoints = 0;
  let validReportsCount = 0;
  let verifiedResolutionsCount = 0;
  let evidenceBonusCount = 0;

  for (const t of transactions) {
    if (t.category === 'IDENTIFICATION') {
      identificationPoints += t.points;
      if (t.eventType === 'VALID_REPORT') validReportsCount++;
      if (t.eventType === 'EVIDENCE_BONUS') evidenceBonusCount++;
    } else if (t.category === 'RESOLUTION') {
      resolutionPoints += t.points;
      if (t.eventType === 'RESOLUTION_COMPLETED') verifiedResolutionsCount++;
    }
  }

  // Ensure non-negative
  identificationPoints = Math.max(0, identificationPoints);
  resolutionPoints = Math.max(0, resolutionPoints);
  const totalPoints = identificationPoints + resolutionPoints;

  const ratingStats = calculateUserRatingStats(userId);
  const badges = calculateEarnedBadges(
    validReportsCount,
    verifiedResolutionsCount,
    evidenceBonusCount,
    totalPoints
  );

  return {
    id: user.id,
    displayName: user.displayName,
    maskedEmail: maskEmail(user.email),
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    totalPoints,
    identificationPoints,
    resolutionPoints,
    validReportsCount,
    verifiedResolutionsCount,
    averageRating: ratingStats.average,
    ratingsCount: ratingStats.count,
    badges,
  };
}

/**
 * Computes deterministic leaderboard rankings across all real users.
 * Tie-breaking hierarchy:
 * 1. Points DESC
 * 2. Verified contributions DESC
 * 3. Average rating DESC
 * 4. Joined date ASC (seniority)
 */
export function getLeaderboard(
  period: LeaderboardPeriod = 'all-time',
  filter: LeaderboardFilter = 'all'
): ContributorRanking[] {
  const users = loadAllUsers();
  if (users.length === 0) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let allTransactions = loadAllTransactions();
  if (period === 'this-month') {
    allTransactions = allTransactions.filter(
      t => new Date(t.createdAt).getTime() >= startOfMonth
    );
  }

  const rankings: ContributorRanking[] = [];

  for (const user of users) {
    const userTx = allTransactions.filter(t => t.userId === user.id);

    let identPts = 0;
    let resPts = 0;
    let verifiedReports = 0;
    let verifiedResolutions = 0;

    for (const t of userTx) {
      if (t.category === 'IDENTIFICATION') {
        identPts += t.points;
        if (t.eventType === 'VALID_REPORT') verifiedReports++;
      } else if (t.category === 'RESOLUTION') {
        resPts += t.points;
        if (t.eventType === 'RESOLUTION_COMPLETED') verifiedResolutions++;
      }
    }

    identPts = Math.max(0, identPts);
    resPts = Math.max(0, resPts);
    const totalPts = identPts + resPts;
    const verifiedContributions = verifiedReports + verifiedResolutions;
    const ratingStats = calculateUserRatingStats(user.id);

    // Filter rules
    if (filter === 'reporters' && identPts === 0) continue;
    if (filter === 'resolvers' && resPts === 0) continue;
    if (filter === 'highest-rated' && ratingStats.count < 2) continue; // Minimum 2 reviews threshold

    // Skip users with 0 activity if we are filtering or in this-month
    if (period === 'this-month' && totalPts === 0 && ratingStats.count === 0) continue;

    rankings.push({
      rank: 0,
      userId: user.id,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      totalPoints: totalPts,
      identificationPoints: identPts,
      resolutionPoints: resPts,
      verifiedContributions,
      averageRating: ratingStats.average,
      ratingsCount: ratingStats.count,
      joinedAt: user.createdAt,
    });
  }

  // Deterministic Sort
  rankings.sort((a, b) => {
    if (filter === 'highest-rated') {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.ratingsCount !== a.ratingsCount) return b.ratingsCount - a.ratingsCount;
      return b.totalPoints - a.totalPoints;
    }

    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.verifiedContributions !== a.verifiedContributions) {
      return b.verifiedContributions - a.verifiedContributions;
    }
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  // Assign 1-based ranks
  return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
}
