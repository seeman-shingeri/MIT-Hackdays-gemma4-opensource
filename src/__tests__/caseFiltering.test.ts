import { describe, it, expect } from 'vitest';
import { filterAndSortCases } from '../features/cases/caseFilters';
import type { CivicCase } from '../types/case';

describe('filterAndSortCases', () => {
  const sampleCases: CivicCase[] = [
    {
      id: 'CIV-001',
      title: 'Broken Handrail at Entrance',
      category: 'Accessibility',
      severity: 'High',
      status: 'REPORTED',
      zone: 'Main Library',
      landmark: 'West Ramp',
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
      priorityScore: 75,
      createdBy: 'user-1',
      createdByName: 'Alice Inspector',
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
    },
    {
      id: 'CIV-002',
      title: 'Exposed Electrical Wiring in Hallway',
      category: 'Electrical',
      severity: 'Critical',
      status: 'WORK_ORDER_ISSUED',
      zone: 'Engineering Wing',
      landmark: 'Room 204 Corridor',
      createdAt: '2026-10-22T14:30:00Z',
      updatedAt: '2026-10-22T14:30:00Z',
      priorityScore: 95,
      createdBy: 'user-2',
      createdByName: 'Bob Electrician',
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
    },
    {
      id: 'CIV-003',
      title: 'Water Pipe Leaking in Restroom',
      category: 'Plumbing',
      severity: 'Medium',
      status: 'RESOLVED',
      zone: 'Student Union',
      landmark: '1st Floor Restroom',
      createdAt: '2026-10-18T08:15:00Z',
      updatedAt: '2026-10-19T11:00:00Z',
      priorityScore: 50,
      createdBy: 'user-1',
      createdByName: 'Alice Inspector',
      evidence: [],
      clarificationAnswers: [],
      mergeHistory: [],
    },
  ];

  it('filters accurately by category', () => {
    const electricalOnly = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'Electrical',
      sortOrder: 'priority',
    });
    expect(electricalOnly).toHaveLength(1);
    expect(electricalOnly[0].id).toBe('CIV-002');

    const allCategories = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'priority',
    });
    expect(allCategories).toHaveLength(3);
  });

  it('filters active vs resolved incidents', () => {
    const active = filterAndSortCases(sampleCases, {
      statusFilter: 'Active',
      categoryFilter: 'All',
      sortOrder: 'priority',
    });
    expect(active.map(c => c.id)).toEqual(['CIV-002', 'CIV-001']);

    const resolved = filterAndSortCases(sampleCases, {
      statusFilter: 'Resolved',
      categoryFilter: 'All',
      sortOrder: 'priority',
    });
    expect(resolved.map(c => c.id)).toEqual(['CIV-003']);
  });

  it('filters user specific reports with My Reports', () => {
    const user1Reports = filterAndSortCases(sampleCases, {
      statusFilter: 'My Reports',
      categoryFilter: 'All',
      sortOrder: 'priority',
      currentUserId: 'user-1',
    });
    expect(user1Reports.map(c => c.id)).toEqual(['CIV-001', 'CIV-003']);

    const user2Reports = filterAndSortCases(sampleCases, {
      statusFilter: 'My Reports',
      categoryFilter: 'All',
      sortOrder: 'priority',
      currentUserId: 'user-2',
    });
    expect(user2Reports.map(c => c.id)).toEqual(['CIV-002']);
  });

  it('sorts cases deterministically by priority, newest, and oldest', () => {
    const byPriority = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'priority',
    });
    expect(byPriority.map(c => c.id)).toEqual(['CIV-002', 'CIV-001', 'CIV-003']);

    const byNewest = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'newest',
    });
    expect(byNewest.map(c => c.id)).toEqual(['CIV-002', 'CIV-001', 'CIV-003']);

    const byOldest = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'oldest',
    });
    expect(byOldest.map(c => c.id)).toEqual(['CIV-003', 'CIV-001', 'CIV-002']);
  });

  it('searches cases by text across title, zone, landmark, and reporter', () => {
    const byLandmark = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'priority',
      searchTerm: 'Corridor',
    });
    expect(byLandmark.map(c => c.id)).toEqual(['CIV-002']);

    const byReporter = filterAndSortCases(sampleCases, {
      statusFilter: 'All',
      categoryFilter: 'All',
      sortOrder: 'priority',
      searchTerm: 'Alice',
    });
    expect(byReporter.map(c => c.id)).toEqual(['CIV-001', 'CIV-003']);
  });
});
