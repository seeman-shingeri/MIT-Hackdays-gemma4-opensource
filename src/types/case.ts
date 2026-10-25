export type IssueCategory = 
  | 'Accessibility'
  | 'Electrical'
  | 'Plumbing'
  | 'Structural'
  | 'Pedestrian Safety';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type CaseStatus = 
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'WORK_ORDER_ISSUED'
  | 'REPAIR_IN_PROGRESS'
  | 'VISUALLY_VERIFIED'
  | 'RESOLVED'
  | 'CLOSED';

export type VerificationStatus = 
  | 'UNVERIFIED'
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'VISUALLY_VERIFIED'
  | 'NEEDS_REINSPECTION';

export type CampusZone = 
  | 'Main Library'
  | 'North Quad'
  | 'Engineering Wing'
  | 'Student Union'
  | 'Athletics Complex'
  | 'West Residence Hall'
  | 'Central Plaza';

export interface EvidenceItem {
  id: string;
  reportId: string;
  reporterLabel: string;
  imageUrl: string;
  timestamp: string;
  description: string;
  zone: CampusZone;
  landmark?: string;
  isPrimary?: boolean;
}

export interface ClarificationAnswer {
  questionId: string;
  question: string;
  answer: string;
  answeredAt: string;
  answeredBy: string;
}

export interface AiAnalysis {
  issueTitle: string;
  category: IssueCategory;
  severity: Severity;
  accessibilityImpact: string;
  detectedHazards: string[];
  confidenceScore: number; // 0.0 - 1.0
  uncertaintyFlags: string[];
  clarifyingQuestions: string[];
  urgencyRationale: string;
  recommendedAction: string;
  analyzedAt: string;
  modelUsed: string;
  isSimulated?: boolean;
}

export interface VisualVerification {
  verificationStatus: VerificationStatus;
  visualChangesObserved: string[];
  remainingConcerns: string[];
  confidenceScore: number;
  beforeImageUrl: string;
  afterImageUrl: string;
  verifiedAt: string;
  inspectorNotes?: string;
  isSimulated?: boolean;
  complianceDisclaimer: string;
}

export interface MergeLog {
  mergedReportId: string;
  reporterLabel: string;
  mergedAt: string;
  duplicateScore: number;
  scoreBreakdown: {
    zoneScore: number;
    categoryScore: number;
    keywordScore: number;
  };
  reason: string;
}

export interface CivicCase {
  id: string;
  title: string;
  category: IssueCategory;
  severity: Severity;
  status: CaseStatus;
  zone: CampusZone;
  landmark: string;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceItem[];
  aiAnalysis?: AiAnalysis;
  clarificationAnswers: ClarificationAnswer[];
  mergeHistory: MergeLog[];
  verification?: VisualVerification;
  assignedTeam?: string;
  estimatedResponseTarget?: string;
  priorityScore: number;
  // Authenticated attribution and resolution details
  createdBy?: string;
  createdByName?: string;
  assignedTo?: string;
  assignedToId?: string;
  resolvedBy?: string;
  resolvedById?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionEvidenceUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
