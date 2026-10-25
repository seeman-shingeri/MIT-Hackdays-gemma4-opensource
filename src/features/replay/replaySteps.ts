export interface ReplayStep {
  stepNumber: number;
  timeLabel: string;
  reporter: string;
  title: string;
  badge: string;
  summary: string;
  technicalHighlights: string[];
}

export const REPLAY_STEPS: ReplayStep[] = [
  {
    stepNumber: 1,
    timeLabel: '09:14 AM',
    reporter: 'Student Reporter 1 (Access Committee)',
    title: 'Initial Incident Report Captured',
    badge: 'STAGE 1 & 2 • REALITY CAPTURE & GEMMA ANALYSIS',
    summary:
      'Student Reporter 1 reports severe concrete fracture and vertical lip displacement blocking wheelchair transit at the Main Library West Ramp.',
    technicalHighlights: [
      'Gemma structured JSON extraction identifies ADA non-compliance (vertical lip > 1/4")',
      'Epistemic uncertainty flagged: Handrail stability & subsurface voiding cannot be verified from visual photo alone',
      'Initial Priority Score calculated: 90 / 100',
    ],
  },
  {
    stepNumber: 2,
    timeLabel: '10:02 AM',
    reporter: 'Student Reporter 2 (Architecture Student)',
    title: 'Second Photo & Duplicate Detection',
    badge: 'STAGE 3 • EXPLAINABLE DUPLICATE CLUSTERING',
    summary:
      'Student Reporter 2 takes a close-up photo showing exposed rusted rebar lattice inside the spalled concrete cavity.',
    technicalHighlights: [
      'Duplicate matching service scores 88% match: Zone (+40 pts) + Category (+35 pts) + Keywords (+13 pts)',
      'Deterministic duplicate threshold (≥70%) triggered',
      '1-click merge preserves original report IDs, timestamps, and photos into Master Case CIV-8492-A',
    ],
  },
  {
    stepNumber: 3,
    timeLabel: '10:45 AM',
    reporter: 'Student Reporter 3 (Campus Commuter)',
    title: 'Third Report Under Rain Conditions',
    badge: 'STAGE 4 • CORROBORATION & REPAIR DOSSIER',
    summary:
      'Student Reporter 3 captures the same ramp during heavy rain; standing water puddle creates an immediate slip & fall hazard.',
    technicalHighlights: [
      '3 independent reports converged onto a single master work order',
      'Priority score boosted to 98 / 100 with 3 corroborating evidence photos',
      'Actionable Maintenance Dossier generated with SLA target, assigned concrete division, and Markdown export',
    ],
  },
  {
    stepNumber: 4,
    timeLabel: '15:30 PM',
    reporter: 'Campus Facilities Contractor',
    title: 'Repair Evidence Submitted',
    badge: 'STAGE 5 • AFTER-REPAIR EVIDENCE CAPTURE',
    summary:
      'Facilities concrete crew submits photo of newly poured, leveled concrete ramp with yellow detectable warning strip and re-anchored handrails.',
    technicalHighlights: [
      'Submitted repair evidence loaded into verification queue',
      'Clearly labeled as submitted contractor evidence (not certified safety proof)',
      'Side-by-side & split comparison slider prepared for inspection',
    ],
  },
  {
    stepNumber: 5,
    timeLabel: '16:00 PM',
    reporter: 'REPAIR.AI Visual Inspector',
    title: 'Multimodal Visual Verification & Statutory Sign-Off',
    badge: 'STAGE 5 • VISUAL DIFFERENCE VERIFICATION',
    summary:
      'Multimodal comparison inspects before/after conditions, confirms crack abatement and leveling, notes 28-day cure caution, and updates case to VISUALLY_VERIFIED.',
    technicalHighlights: [
      'Visual changes confirmed: Transversal crack sealed, smooth transition restored, tactile domes added',
      'Residual safety flags: 28-day compressive cure caution prior to motorized transit',
      'Statutory Disclaimer enforced: Visual verification does not replace certified structural code inspection',
    ],
  },
];
