import { describe, it, expect } from 'vitest';
import { calculateCaseSla, getTargetSlaHours } from '../services/sla';
import type { CivicCase } from '../types/case';

describe('slaCalculation service', () => {
  const baseCase: CivicCase = {
    id: 'CIV-SLA-1',
    title: 'Faulty Emergency Lighting',
    category: 'Electrical',
    severity: 'Critical',
    status: 'WORK_ORDER_ISSUED',
    zone: 'Engineering Wing',
    landmark: 'Stairwell B',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    priorityScore: 90,
    evidence: [],
    clarificationAnswers: [],
    mergeHistory: [],
  };

  it('maps severity levels to appropriate municipal response SLA hours', () => {
    expect(getTargetSlaHours('Critical')).toBe(4);
    expect(getTargetSlaHours('High')).toBe(12);
    expect(getTargetSlaHours('Medium')).toBe(24);
    expect(getTargetSlaHours('Low')).toBe(72);
  });

  it('calculates ON_TRACK when well within SLA window', () => {
    // 1 hour after creation (3 hours remaining out of 4)
    const refDate = new Date('2026-10-25T11:00:00Z');
    const sla = calculateCaseSla(baseCase, refDate);

    expect(sla.status).toBe('ON_TRACK');
    expect(sla.slaHoursTarget).toBe(4);
    expect(sla.elapsedHours).toBe(1);
    expect(sla.remainingHours).toBe(3);
    expect(sla.isOverdue).toBe(false);
  });

  it('calculates AT_RISK when remaining time is critical (<= 25% or <= 2h)', () => {
    // 3 hours after creation (1 hour remaining out of 4)
    const refDate = new Date('2026-10-25T13:00:00Z');
    const sla = calculateCaseSla(baseCase, refDate);

    expect(sla.status).toBe('AT_RISK');
    expect(sla.remainingHours).toBe(1);
    expect(sla.isOverdue).toBe(false);
    expect(sla.statusLabel).toContain('At Risk');
  });

  it('calculates BREACHED when deadline has elapsed without resolution', () => {
    // 6 hours after creation (2 hours past 4-hour SLA)
    const refDate = new Date('2026-10-25T16:00:00Z');
    const sla = calculateCaseSla(baseCase, refDate);

    expect(sla.status).toBe('BREACHED');
    expect(sla.isOverdue).toBe(true);
    expect(sla.remainingHours).toBe(0);
    expect(sla.statusLabel).toContain('Overdue by 2h');
  });

  it('calculates MET when resolved within SLA target', () => {
    const resolvedCase: CivicCase = {
      ...baseCase,
      status: 'RESOLVED',
      resolvedAt: '2026-10-25T12:30:00Z', // 2.5h after creation (within 4h)
    };

    const sla = calculateCaseSla(resolvedCase);
    expect(sla.status).toBe('MET');
    expect(sla.isOverdue).toBe(false);
    expect(sla.elapsedHours).toBe(2.5);
    expect(sla.statusLabel).toContain('Resolved in 2.5h');
  });

  it('calculates EXCEEDED when resolved past SLA target', () => {
    const lateResolvedCase: CivicCase = {
      ...baseCase,
      status: 'RESOLVED',
      resolvedAt: '2026-10-25T17:00:00Z', // 7h after creation (3h past 4h target)
    };

    const sla = calculateCaseSla(lateResolvedCase);
    expect(sla.status).toBe('EXCEEDED');
    expect(sla.isOverdue).toBe(true);
    expect(sla.statusLabel).toContain('past 4h target');
  });
});
