import { describe, it, expect, beforeEach } from 'vitest';
import { 
  awardPoints, 
  loadAllTransactions, 
  getLeaderboard, 
  getPublicProfile,
  calculateEarnedBadges 
} from '../services/reputation';
import { submitRating, calculateUserRatingStats, loadAllRatings } from '../services/ratings';
import { registerUser } from '../services/auth';
import type { CivicCase } from '../types/case';
import type { UserAccount } from '../types/auth';

describe('Reputation, Scoring, Ratings & Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('awards valid report points (+10) and prevents duplicate awards for same event', () => {
    const userId = 'usr_test_reporter';
    const reportId = 'CIV-TEST-PT-1';

    // First award succeeds
    const first = awardPoints(userId, reportId, 'VALID_REPORT');
    expect(first.success).toBe(true);
    expect(first.transaction?.points).toBe(10);
    expect(first.transaction?.category).toBe('IDENTIFICATION');

    // Duplicate award fails
    const second = awardPoints(userId, reportId, 'VALID_REPORT');
    expect(second.success).toBe(false);
    expect(second.error).toContain('already awarded');

    // Total transactions should be exactly 1
    const txs = loadAllTransactions();
    expect(txs.filter(t => t.userId === userId && t.reportId === reportId).length).toBe(1);
  });

  it('awards resolution points (+20) and resolution evidence bonus (+5) separately', () => {
    const resolverId = 'usr_test_resolver';
    const reportId = 'CIV-TEST-RES-1';

    const res1 = awardPoints(resolverId, reportId, 'RESOLUTION_COMPLETED');
    expect(res1.success).toBe(true);
    expect(res1.transaction?.points).toBe(20);
    expect(res1.transaction?.category).toBe('RESOLUTION');

    const res2 = awardPoints(resolverId, reportId, 'RESOLUTION_EVIDENCE_BONUS');
    expect(res2.success).toBe(true);
    expect(res2.transaction?.points).toBe(5);

    const txs = loadAllTransactions().filter(t => t.userId === resolverId);
    expect(txs.length).toBe(2);
    const total = txs.reduce((sum, t) => sum + t.points, 0);
    expect(total).toBe(25);
  });

  it('prevents users from rating their own contributions', () => {
    const userA: UserAccount = {
      id: 'usr_user_a',
      email: 'a@mit.edu',
      displayName: 'Alice',
      role: 'citizen',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const report: CivicCase = {
      id: 'CIV-RATE-1',
      title: 'Pothole Ingress',
      category: 'Pedestrian Safety',
      severity: 'Medium',
      status: 'REPORTED',
      zone: 'North Quad',
      landmark: 'Gate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 70,
      createdBy: 'usr_user_a',
      createdByName: 'Alice',
    };

    // User A rates their own report accuracy -> BLOCKED
    const rateRes = submitRating(report, userA, userA.id, 'REPORT_ACCURACY', 5);
    expect(rateRes.success).toBe(false);
    expect(rateRes.error).toContain('cannot rate');
    expect(rateRes.error).toContain('own');
  });

  it('records valid ratings and prevents duplicate ratings by same reviewer on same category', () => {
    const reviewer: UserAccount = {
      id: 'usr_reviewer_1',
      email: 'rev@mit.edu',
      displayName: 'Reviewer Bob',
      role: 'maintenance',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const report: CivicCase = {
      id: 'CIV-RATE-2',
      title: 'Broken Handrail',
      category: 'Accessibility',
      severity: 'High',
      status: 'UNDER_REVIEW',
      zone: 'Main Library',
      landmark: 'Stairs',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 80,
      createdBy: 'usr_creator_x',
      createdByName: 'Creator X',
    };

    // First rating succeeds
    const firstRate = submitRating(report, reviewer, 'usr_creator_x', 'REPORT_ACCURACY', 4, 'Very clear photo');
    expect(firstRate.success).toBe(true);

    // Duplicate rating fails
    const dupRate = submitRating(report, reviewer, 'usr_creator_x', 'REPORT_ACCURACY', 5);
    expect(dupRate.success).toBe(false);
    expect(dupRate.error).toContain('already submitted a rating');

    // Rating stats
    const stats = calculateUserRatingStats('usr_creator_x');
    expect(stats.count).toBe(1);
    expect(stats.average).toBe(4);
  });

  it('calculates deterministic leaderboard rankings with documented tie-breakers', async () => {
    // Register three real users
    const u1 = await registerUser('alice@mit.edu', 'pass123', 'Alice', 'citizen');
    const u2 = await registerUser('bob@mit.edu', 'pass123', 'Bob', 'maintenance');
    const u3 = await registerUser('carol@mit.edu', 'pass123', 'Carol', 'citizen');

    // Alice gets 20 pts
    awardPoints(u1.user!.id, 'C-1', 'VALID_REPORT', 10);
    awardPoints(u1.user!.id, 'C-2', 'VALID_REPORT', 10);

    // Bob gets 25 pts
    awardPoints(u2.user!.id, 'C-3', 'RESOLUTION_COMPLETED', 20);
    awardPoints(u2.user!.id, 'C-3', 'RESOLUTION_EVIDENCE_BONUS', 5);

    // Carol gets 10 pts
    awardPoints(u3.user!.id, 'C-4', 'VALID_REPORT', 10);

    const rankings = getLeaderboard('all-time', 'all');
    expect(rankings.length).toBe(3);

    // Bob is #1 (25 pts)
    expect(rankings[0].userId).toBe(u2.user?.id);
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].totalPoints).toBe(25);

    // Alice is #2 (20 pts)
    expect(rankings[1].userId).toBe(u1.user?.id);
    expect(rankings[1].rank).toBe(2);
    expect(rankings[1].totalPoints).toBe(20);

    // Carol is #3 (10 pts)
    expect(rankings[2].userId).toBe(u3.user?.id);
    expect(rankings[2].rank).toBe(3);
    expect(rankings[2].totalPoints).toBe(10);
  });

  it('shows zero fake entries on an empty leaderboard', () => {
    // When no users exist
    const emptyRankings = getLeaderboard('all-time', 'all');
    expect(emptyRankings).toEqual([]);
  });

  it('awards earned badges strictly when actual activity thresholds are met', () => {
    // 0 reports -> 0 badges
    expect(calculateEarnedBadges(0, 0, 0, 0)).toEqual([]);

    // 1 valid report -> 'First Valid Report'
    expect(calculateEarnedBadges(1, 0, 0, 10)).toEqual(['First Valid Report']);

    // Evidence bonus -> 'Evidence Expert'
    expect(calculateEarnedBadges(1, 0, 1, 15)).toEqual(['First Valid Report', 'Evidence Expert']);

    // 5 reports, 1 confirmed repair, 55 total points -> all badges
    const all = calculateEarnedBadges(5, 1, 1, 55);
    expect(all).toContain('First Valid Report');
    expect(all).toContain('Evidence Expert');
    expect(all).toContain('Five Verified Reports');
    expect(all).toContain('First Confirmed Repair');
    expect(all).toContain('Community Helper');
  });

  it('retrieves accurate public contributor profile with masked email and points breakdown', async () => {
    const reg = await registerUser('dan.miller@mit.edu', 'secret123', 'Dan Miller', 'maintenance');
    const userId = reg.user!.id;

    awardPoints(userId, 'CIV-D-1', 'VALID_REPORT', 10);
    awardPoints(userId, 'CIV-D-2', 'RESOLUTION_COMPLETED', 20);

    const profile = getPublicProfile(userId);
    expect(profile).not.toBeNull();
    expect(profile?.displayName).toBe('Dan Miller');
    expect(profile?.maskedEmail).toBe('d***r@mit.edu');
    expect(profile?.identificationPoints).toBe(10);
    expect(profile?.resolutionPoints).toBe(20);
    expect(profile?.totalPoints).toBe(30);
    expect(profile?.validReportsCount).toBe(1);
    expect(profile?.verifiedResolutionsCount).toBe(1);

    expect(loadAllRatings()).toEqual([]);
  });
});
