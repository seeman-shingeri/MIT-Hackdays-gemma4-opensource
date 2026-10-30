import type { CivicCase, Severity } from '../types/case';

export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET' | 'EXCEEDED';

export interface SlaCalculationResult {
  slaHoursTarget: number;
  deadline: Date;
  elapsedHours: number;
  remainingHours: number;
  status: SlaStatus;
  statusLabel: string;
  isOverdue: boolean;
}

/**
 * Returns the target SLA window in hours based on case severity.
 */
export function getTargetSlaHours(severity: Severity): number {
  switch (severity) {
    case 'Critical':
      return 4; // 4 hour rapid emergency response
    case 'High':
      return 12; // 12 hour priority response
    case 'Medium':
      return 24; // 24 hour standard municipal response
    case 'Low':
    default:
      return 72; // 72 hour routine response
  }
}

/**
 * Evaluates the SLA status and remaining / overdue duration for a civic infrastructure case.
 */
export function calculateCaseSla(
  civicCase: CivicCase,
  referenceDate: Date = new Date()
): SlaCalculationResult {
  const targetHours = getTargetSlaHours(civicCase.severity);
  const createdTime = new Date(civicCase.createdAt).getTime();
  const deadlineTime = createdTime + targetHours * 3600 * 1000;
  const deadline = new Date(deadlineTime);

  const isResolved = 
    civicCase.status === 'RESOLVED' || 
    civicCase.status === 'CLOSED' || 
    civicCase.verification?.verificationStatus === 'VISUALLY_VERIFIED';

  const endTime = isResolved && civicCase.resolvedAt 
    ? new Date(civicCase.resolvedAt).getTime() 
    : referenceDate.getTime();

  const elapsedMillis = Math.max(0, endTime - createdTime);
  const elapsedHours = Math.round((elapsedMillis / (3600 * 1000)) * 10) / 10;
  const remainingMillis = deadlineTime - endTime;
  const remainingHours = Math.round((remainingMillis / (3600 * 1000)) * 10) / 10;

  if (isResolved) {
    if (endTime <= deadlineTime) {
      return {
        slaHoursTarget: targetHours,
        deadline,
        elapsedHours,
        remainingHours: Math.max(0, remainingHours),
        status: 'MET',
        statusLabel: `Resolved in ${elapsedHours}h (Target: ${targetHours}h)`,
        isOverdue: false,
      };
    } else {
      const overdueBy = Math.round(((endTime - deadlineTime) / (3600 * 1000)) * 10) / 10;
      return {
        slaHoursTarget: targetHours,
        deadline,
        elapsedHours,
        remainingHours: 0,
        status: 'EXCEEDED',
        statusLabel: `Resolved (${overdueBy}h past ${targetHours}h target)`,
        isOverdue: true,
      };
    }
  }

  // Open / In-progress case
  if (remainingHours <= 0) {
    const overdueBy = Math.abs(remainingHours);
    return {
      slaHoursTarget: targetHours,
      deadline,
      elapsedHours,
      remainingHours: 0,
      status: 'BREACHED',
      statusLabel: `Overdue by ${overdueBy}h (${targetHours}h SLA breached)`,
      isOverdue: true,
    };
  }

  // At risk if remaining is under 25% of target or under 2 hours
  if (remainingHours <= targetHours * 0.25 || remainingHours <= 2) {
    return {
      slaHoursTarget: targetHours,
      deadline,
      elapsedHours,
      remainingHours,
      status: 'AT_RISK',
      statusLabel: `At Risk: ${remainingHours}h remaining of ${targetHours}h SLA`,
      isOverdue: false,
    };
  }

  return {
    slaHoursTarget: targetHours,
    deadline,
    elapsedHours,
    remainingHours,
    status: 'ON_TRACK',
    statusLabel: `${remainingHours}h remaining (${targetHours}h SLA)`,
    isOverdue: false,
  };
}
