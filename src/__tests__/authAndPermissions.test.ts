import { describe, it, expect, beforeEach } from 'vitest';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  getCurrentSession,
  canUserDeleteReport,
  canUserResolveReport,
  hashPassword,
  maskEmail
} from '../services/auth';
import { deleteCase, saveOrUpdateCase, loadCases } from '../services/storage';
import { getActivitiesForReport } from '../services/activity';
import type { CivicCase } from '../types/case';
import type { UserAccount } from '../types/auth';

describe('Authentication & Access Control Permissions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('hashes passwords using SHA-256 with salt and does not store plaintext', async () => {
    const salt = 'random_test_salt_123';
    const hash1 = await hashPassword('mySecretPass123', salt);
    const hash2 = await hashPassword('mySecretPass123', salt);
    const hashDiff = await hashPassword('differentPass', salt);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe('mySecretPass123');
    expect(hash1).not.toBe(hashDiff);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it('registers a new user, saves persistent session, and restores session', async () => {
    const res = await registerUser('alice@mit.edu', 'securePass1', 'Alice Rivera', 'citizen');
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe('alice@mit.edu');
    expect(res.user?.role).toBe('citizen');

    const session = getCurrentSession();
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(res.user?.id);

    const activeUser = getCurrentUser();
    expect(activeUser).not.toBeNull();
    expect(activeUser?.displayName).toBe('Alice Rivera');

    // Logout ends the session
    logoutUser();
    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();

    // User can login again
    const loginRes = await loginUser('alice@mit.edu', 'securePass1');
    expect(loginRes.success).toBe(true);
    expect(getCurrentUser()?.id).toBe(res.user?.id);
  });

  it('allows a report creator to delete their eligible report (REPORTED state)', () => {
    const creator: UserAccount = {
      id: 'usr_creator_1',
      email: 'creator@mit.edu',
      displayName: 'Creator One',
      role: 'citizen',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const eligibleCase: CivicCase = {
      id: 'CIV-TEST-DEL-1',
      title: 'Broken Handrail',
      category: 'Accessibility',
      severity: 'Medium',
      status: 'REPORTED',
      zone: 'Main Library',
      landmark: 'North Entry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 70,
      createdBy: 'usr_creator_1',
      createdByName: 'Creator One',
    };

    saveOrUpdateCase(eligibleCase);

    // Permission check
    const perm = canUserDeleteReport(creator, eligibleCase);
    expect(perm.allowed).toBe(true);

    // Execute deletion
    const delRes = deleteCase(eligibleCase.id, creator);
    expect(delRes.success).toBe(true);

    const reloaded = loadCases();
    expect(reloaded.find(c => c.id === eligibleCase.id)).toBeUndefined();

    // Verify immutable audit history was preserved
    const activities = getActivitiesForReport(eligibleCase.id);
    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0].actionType).toBe('REPORT_DELETED');
  });

  it('prevents a creator from deleting a report once in restricted workflow (WORK_ORDER_ISSUED)', () => {
    const creator: UserAccount = {
      id: 'usr_creator_1',
      email: 'creator@mit.edu',
      displayName: 'Creator One',
      role: 'citizen',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const inProgressCase: CivicCase = {
      id: 'CIV-TEST-RESTRICTED-1',
      title: 'Shattered Step',
      category: 'Pedestrian Safety',
      severity: 'High',
      status: 'WORK_ORDER_ISSUED',
      zone: 'Central Plaza',
      landmark: 'Main Steps',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 85,
      createdBy: 'usr_creator_1',
      createdByName: 'Creator One',
    };

    saveOrUpdateCase(inProgressCase);

    const perm = canUserDeleteReport(creator, inProgressCase);
    expect(perm.allowed).toBe(false);
    expect(perm.reason).toContain('active administrative workflow');

    const delRes = deleteCase(inProgressCase.id, creator);
    expect(delRes.success).toBe(false);
  });

  it('prevents an unauthorized user from deleting another persons report', () => {
    const otherUser: UserAccount = {
      id: 'usr_other_99',
      email: 'other@mit.edu',
      displayName: 'Other User',
      role: 'citizen',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const targetCase: CivicCase = {
      id: 'CIV-TEST-OTHER-1',
      title: 'Water Leak',
      category: 'Plumbing',
      severity: 'Low',
      status: 'REPORTED',
      zone: 'Engineering Wing',
      landmark: 'Basement Room 12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 50,
      createdBy: 'usr_original_creator',
      createdByName: 'Original Creator',
    };

    saveOrUpdateCase(targetCase);

    const perm = canUserDeleteReport(otherUser, targetCase);
    expect(perm.allowed).toBe(false);
    expect(perm.reason).toContain('personally created');

    const delRes = deleteCase(targetCase.id, otherUser);
    expect(delRes.success).toBe(false);
  });

  it('allows an administrator to delete reports and restricts resolution to maintenance/admin', () => {
    const admin: UserAccount = {
      id: 'usr_admin_1',
      email: 'admin@mit.edu',
      displayName: 'System Admin',
      role: 'admin',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const citizen: UserAccount = {
      id: 'usr_citizen_2',
      email: 'citizen@mit.edu',
      displayName: 'Citizen Bob',
      role: 'citizen',
      passwordHash: 'hash',
      salt: 'salt',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    };

    const testCase: CivicCase = {
      id: 'CIV-TEST-ADMIN-1',
      title: 'Exposed Electrical Junction',
      category: 'Electrical',
      severity: 'Critical',
      status: 'WORK_ORDER_ISSUED',
      zone: 'Student Union',
      landmark: 'East Hallway',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
      priorityScore: 99,
      createdBy: 'someone_else',
    };

    // Admin can delete
    expect(canUserDeleteReport(admin, testCase).allowed).toBe(true);

    // Citizen cannot resolve
    expect(canUserResolveReport(citizen, testCase).allowed).toBe(false);

    // Admin can resolve
    expect(canUserResolveReport(admin, testCase).allowed).toBe(true);
  });

  it('masks emails properly for privacy in public contributor profiles', () => {
    expect(maskEmail('alex.rivera@mit.edu')).toBe('a***a@mit.edu');
    expect(maskEmail('jo@mit.edu')).toBe('jo***@mit.edu');
  });
});
