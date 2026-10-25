import type { UserAccount, UserRole, SessionInfo } from '../types/auth';
import type { CivicCase } from '../types/case';
import type { RatingCategory } from '../types/reputation';

const STORAGE_USERS_KEY = 'repair_ai_users_v2';
const STORAGE_SESSION_KEY = 'repair_ai_active_session_v2';

/**
 * Computes SHA-256 hash using native Web Crypto API.
 * Never stores plaintext passwords in tables, localStorage, or logs.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomHex(byteCount = 16): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Loads all user accounts from storage.
 */
export function loadAllUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves user accounts to storage.
 */
function saveAllUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

/**
 * Retrieves the currently active session from storage.
 */
export function getCurrentSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: SessionInfo = JSON.parse(raw);
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      // Expired session
      localStorage.removeItem(STORAGE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user.
 */
export function getCurrentUser(): UserAccount | null {
  const session = getCurrentSession();
  if (!session) return null;
  const users = loadAllUsers();
  return users.find(u => u.id === session.userId) || null;
}

/**
 * Registers a new user account.
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'citizen'
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim();

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  if (!trimmedName) {
    return { success: false, error: 'Display name is required.' };
  }

  const existing = loadAllUsers();
  if (existing.some(u => u.email === trimmedEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const salt = generateRandomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const userId = `usr_${Date.now()}_${generateRandomHex(4)}`;

  const newUser: UserAccount = {
    id: userId,
    email: trimmedEmail,
    displayName: trimmedName,
    role,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    emailVerified: true,
  };

  const updatedUsers = [...existing, newUser];
  saveAllUsers(updatedUsers);

  // Automatically start persistent session
  const sessionToken = generateRandomHex(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const session: SessionInfo = {
    token: sessionToken,
    userId: newUser.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

  return { success: true, user: newUser };
}

/**
 * Authenticates user credentials and starts a session.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const users = loadAllUsers();
  const user = users.find(u => u.email === trimmedEmail);

  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password.' };
  }

  // Update last active
  user.lastActiveAt = new Date().toISOString();
  saveAllUsers(users);

  // Set session
  const sessionToken = generateRandomHex(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const session: SessionInfo = {
    token: sessionToken,
    userId: user.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

  return { success: true, user };
}

/**
 * Ends the authenticated session safely.
 */
export function logoutUser(): void {
  localStorage.removeItem(STORAGE_SESSION_KEY);
}

/**
 * Resets user password securely.
 */
export async function resetPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const users = loadAllUsers();
  const userIndex = users.findIndex(u => u.email === trimmedEmail);
  if (userIndex === -1) {
    return { success: false, error: 'No account found with that email address.' };
  }

  const salt = generateRandomHex(16);
  const passwordHash = await hashPassword(newPassword, salt);
  users[userIndex].salt = salt;
  users[userIndex].passwordHash = passwordHash;
  users[userIndex].lastActiveAt = new Date().toISOString();

  saveAllUsers(users);
  return { success: true };
}

/**
 * Checks whether a user has permission to delete a specific report.
 * - Report creator can delete if not yet assigned to maintenance or in-progress repair.
 * - Authorized admin can delete anytime.
 * - Arbitrary users cannot delete another person's report.
 */
export function canUserDeleteReport(
  user: UserAccount | null,
  civicCase: CivicCase
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'You must be signed in to manage or delete reports.' };
  }

  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Creator check
  const isCreator = civicCase.createdBy && civicCase.createdBy === user.id;
  if (!isCreator) {
    return { allowed: false, reason: 'You can only delete reports that you personally created.' };
  }

  // Restricted administrative workflow check:
  // Cannot delete if active repair is already in progress, work order issued, or visually verified
  const restrictedStatuses = ['WORK_ORDER_ISSUED', 'REPAIR_IN_PROGRESS', 'VISUALLY_VERIFIED', 'RESOLVED'];
  if (restrictedStatuses.includes(civicCase.status)) {
    return {
      allowed: false,
      reason: `Report cannot be deleted because it has entered the active administrative workflow (${civicCase.status.replace(/_/g, ' ')}). Contact municipal operations.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks whether a user has permission to resolve an incident.
 * - Maintenance resolvers or Administrators can resolve incidents.
 */
export function canUserResolveReport(
  user: UserAccount | null,
  _civicCase: CivicCase
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Sign in with a verified maintenance or administrator account to resolve cases.' };
  }

  if (user.role === 'maintenance' || user.role === 'admin') {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Only authorized maintenance personnel or administrators can certify and record official repairs.',
  };
}

/**
 * Checks whether a user can submit a rating on a report.
 * - Cannot rate own contribution.
 * - Must be authenticated.
 */
export function canUserRateReport(
  user: UserAccount | null,
  civicCase: CivicCase,
  category: RatingCategory
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Please sign in to submit a community rating.' };
  }

  if (category === 'REPORT_ACCURACY') {
    if (civicCase.createdBy && civicCase.createdBy === user.id) {
      return { allowed: false, reason: 'You cannot rate the accuracy of your own report.' };
    }
  }

  if (category === 'RESOLUTION_QUALITY') {
    if (civicCase.resolvedById && civicCase.resolvedById === user.id) {
      return { allowed: false, reason: 'You cannot rate the quality of your own repair resolution.' };
    }
    if (civicCase.status !== 'RESOLVED' && civicCase.status !== 'VISUALLY_VERIFIED') {
      return { allowed: false, reason: 'Resolution quality can only be reviewed once repair work is submitted.' };
    }
  }

  return { allowed: true };
}

/**
 * Generates a masked email for privacy protection in public profile views.
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}
