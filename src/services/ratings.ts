import type { ReportRating, RatingCategory } from '../types/reputation';
import type { UserAccount } from '../types/auth';
import type { CivicCase } from '../types/case';
import { canUserRateReport } from './auth';
import { logActivity } from './activity';

const STORAGE_RATINGS_KEY = 'repair_ai_ratings_v2';

export function loadAllRatings(): ReportRating[] {
  try {
    const raw = localStorage.getItem(STORAGE_RATINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRatings(ratings: ReportRating[]): void {
  try {
    localStorage.setItem(STORAGE_RATINGS_KEY, JSON.stringify(ratings));
  } catch (err) {
    console.error('Failed to save ratings:', err);
  }
}

/**
 * Submits a rating with strict validation:
 * - Reviewer cannot rate their own contribution
 * - One rating per reviewer per report per category
 * - Valid star score 1 to 5
 */
export function submitRating(
  report: CivicCase,
  reviewer: UserAccount,
  targetUserId: string,
  category: RatingCategory,
  score: number,
  comment?: string
): { success: boolean; rating?: ReportRating; error?: string } {
  // Validate score
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { success: false, error: 'Rating must be a whole number between 1 and 5 stars.' };
  }

  // Permission check
  const perm = canUserRateReport(reviewer, report, category);
  if (!perm.allowed) {
    return { success: false, error: perm.reason || 'Not authorized to rate this contribution.' };
  }

  if (reviewer.id === targetUserId) {
    return { success: false, error: 'You cannot rate your own contribution.' };
  }

  const allRatings = loadAllRatings();

  // Prevent duplicate rating by same reviewer on same report for same category
  const existing = allRatings.find(
    r => r.reportId === report.id && r.reviewerId === reviewer.id && r.category === category
  );

  if (existing) {
    return {
      success: false,
      error: `You have already submitted a rating for this report under ${category.replace(/_/g, ' ')}.`,
    };
  }

  const newRating: ReportRating = {
    id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reportId: report.id,
    reviewerId: reviewer.id,
    reviewerName: reviewer.displayName,
    targetUserId,
    category,
    score,
    comment: comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  saveRatings([newRating, ...allRatings]);

  // Log activity
  logActivity(
    'RATING_SUBMITTED',
    report.id,
    reviewer,
    `Submitted ${score}-star rating for ${category.replace(/_/g, ' ')}`,
    { score, category, targetUserId }
  );

  return { success: true, rating: newRating };
}

/**
 * Retrieves all ratings associated with a specific report.
 */
export function getRatingsForReport(reportId: string): ReportRating[] {
  const all = loadAllRatings();
  return all.filter(r => r.reportId === reportId);
}

/**
 * Retrieves all ratings awarded to a specific user.
 */
export function getRatingsForUser(userId: string): ReportRating[] {
  const all = loadAllRatings();
  return all.filter(r => r.targetUserId === userId);
}

/**
 * Calculates rating statistics for a user (average and count).
 */
export function calculateUserRatingStats(userId: string): { average: number; count: number } {
  const userRatings = getRatingsForUser(userId);
  if (userRatings.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = userRatings.reduce((acc, r) => acc + r.score, 0);
  const average = Number((sum / userRatings.length).toFixed(1));

  return { average, count: userRatings.length };
}
