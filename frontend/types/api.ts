// Shared TypeScript types matching FastAPI backend models

export type Verdict = 'PASS' | 'FAIL' | 'UNCERTAIN';
export type OverallStatus = 'PASS' | 'FAIL' | 'UNCERTAIN';

export interface DetectionBox {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  text?: string | null;
  value?: any;
}

export interface ReviewImage {
  id: string;
  url?: string | null;
  angle?: string | null;
  detections?: DetectionBox[];
}

export interface CheckResult {
  check_id: string;
  name: string;
  verdict: Verdict;
  reason: string;
  evidence_key: string;
  evidence: Record<string, any> | null;
  rule_set_version: string;
  visually_verifiable: boolean;
  description: string;
}

export interface MetricsSummary {
  total_checks: number;
  passed: number;
  failed: number;
  uncertain: number;
  visually_verifiable_count: number;
}

export interface HumanOverride {
  id: string;
  check_id: string;
  original_verdict: Verdict;
  corrected_verdict: Verdict;
  note: string;
  reviewer_name: string;
  created_at: string;
}

export interface PrepReviewResponse {
  review_id: string;
  rule_set_id: string | null;
  rule_set_version: string;
  category: string;
  work_order_ref?: string | null;
  checks: CheckResult[];
  overall_status: OverallStatus;
  metrics?: MetricsSummary;
  images: ReviewImage[];
  overrides: HumanOverride[];
  created_at: string;
}

export interface CategoryCheckInfo {
  check_id: string;
  name: string;
  visually_verifiable: boolean;
  min_confidence: number;
}

export interface CategoryInfo {
  category: string;
  rule_set_id: string;
  version: string;
  description: string;
  checks_count: number;
  checks: CategoryCheckInfo[];
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  expected_status: OverallStatus;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  payload: Record<string, any>;
}
