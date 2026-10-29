import type { CivicCase } from '../../types/case';

export type StatusFilterOption = 'All' | 'Active' | 'Resolved' | 'My Reports';
export type SortOrderOption = 'priority' | 'newest' | 'oldest';

export interface FilterSortOptions {
  statusFilter: StatusFilterOption;
  categoryFilter: string;
  sortOrder: SortOrderOption;
  searchTerm?: string;
  currentUserId?: string | null;
}

export function filterAndSortCases(cases: CivicCase[], options: FilterSortOptions): CivicCase[] {
  const { statusFilter, categoryFilter, sortOrder, searchTerm = '', currentUserId } = options;
  const query = searchTerm.trim().toLowerCase();

  const filtered = cases.filter(c => {
    // Status / User filter
    if (statusFilter === 'My Reports') {
      if (!currentUserId || c.createdBy !== currentUserId) {
        return false;
      }
    } else if (statusFilter === 'Active') {
      if (c.status === 'RESOLVED' || c.status === 'CLOSED' || c.verification?.verificationStatus === 'VISUALLY_VERIFIED') {
        return false;
      }
    } else if (statusFilter === 'Resolved') {
      if (c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.verification?.verificationStatus !== 'VISUALLY_VERIFIED') {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== 'All' && c.category !== categoryFilter) {
      return false;
    }

    // Search query
    if (query) {
      const matchesId = c.id.toLowerCase().includes(query);
      const matchesTitle = c.title.toLowerCase().includes(query);
      const matchesZone = c.zone.toLowerCase().includes(query);
      const matchesLandmark = c.landmark?.toLowerCase().includes(query) || false;
      const matchesCategory = c.category.toLowerCase().includes(query);
      const matchesReporter = c.createdByName?.toLowerCase().includes(query) || false;
      return matchesId || matchesTitle || matchesZone || matchesLandmark || matchesCategory || matchesReporter;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortOrder === 'priority') {
      return b.priorityScore - a.priorityScore;
    }
    if (sortOrder === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
