'use client';

import React, { useState, useEffect } from 'react';
import { ReviewStation } from './ReviewStation';
import { HumanOverrideModal } from './legacy/HumanOverrideModal';
import { PRELOADED_SCENARIOS, TestScenario } from '@/lib/lab/scenarios/testScenarios';
import {
  evaluatePrepReview,
  PrepReviewOutput,
  RULE_SET_VERSION,
  DetectedEntity,
} from '@/lib/lab/rules/ruleEngine';

export function ScenariosLabView() {
  const [currentScenario, setCurrentScenario] = useState<TestScenario>(PRELOADED_SCENARIOS[0]);
  const [reviewResult, setReviewResult] = useState<PrepReviewOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const initial = evaluatePrepReview(
      currentScenario.id,
      currentScenario.category,
      currentScenario.evidence
    );
    setReviewResult(initial);
  }, [currentScenario]);

  const handleSelectScenario = (sc: TestScenario) => {
    setCurrentScenario(sc);
    setIsLoading(true);
    setTimeout(() => {
      const result = evaluatePrepReview(sc.id, sc.category, sc.evidence);
      setReviewResult(result);
      setIsLoading(false);
    }, 150);
  };

  const handleRunSyncEvaluation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/prep-review/evaluate-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: currentScenario.id,
          category: currentScenario.category,
          customEvidence: currentScenario.id.startsWith('custom_upload_')
            ? null
            : currentScenario.evidence,
          imageUrl: currentScenario.imageUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const labelMap: Record<string, DetectedEntity['type']> = {
          Polybag: 'polybag',
          FNSKU: 'fnsku',
          'Suffocation Warning': 'suffocation_warning',
          'Expiry Date': 'expiry_date',
          'Handling Mark': 'handling_mark',
          Seam: 'seam',
          'Mfg Barcode': 'mfg_barcode',
        };

        const perceptionDetections: DetectedEntity[] = (data.images?.[0]?.detections ?? []).map(
          (det: { label?: string; bbox?: number[] }, index: number) => ({
            id: `perception-${index}`,
            type: labelMap[det.label ?? ''] ?? 'seam',
            box: {
              ymin: det.bbox?.[0] ?? 0,
              xmin: det.bbox?.[1] ?? 0,
              ymax: det.bbox?.[2] ?? 0,
              xmax: det.bbox?.[3] ?? 0,
            },
            confidence: 0.95,
            label: det.label,
          })
        );

        const evidence = {
          ...currentScenario.evidence,
          detections:
            perceptionDetections.length > 0
              ? perceptionDetections
              : currentScenario.evidence.detections,
        };

        const result = evaluatePrepReview(
          currentScenario.id,
          currentScenario.category,
          evidence
        );
        if (data.overall_status) {
          result.overallStatus = data.overall_status;
        }
        if (data.review_id) {
          result.reviewId = data.review_id;
        }
        setReviewResult(result);
      } else {
        const fallback = evaluatePrepReview(
          currentScenario.id,
          currentScenario.category,
          currentScenario.evidence
        );
        setReviewResult(fallback);
      }
    } catch {
      const fallback = evaluatePrepReview(
        currentScenario.id,
        currentScenario.category,
        currentScenario.evidence
      );
      setReviewResult(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomImageUpload = (dataUrl: string, category: string) => {
    const customScenario: TestScenario = {
      id: `custom_upload_${Date.now()}`,
      name: 'Custom Inspection Upload',
      category,
      description: 'Image captured locally via workstation interface.',
      expectedOverallStatus: 'UNCERTAIN',
      imageUrl: dataUrl,
      evidence: {
        ...currentScenario.evidence,
        imageId: `custom_img_${Date.now()}`,
      },
    };
    setCurrentScenario(customScenario);
    const evalRes = evaluatePrepReview(
      customScenario.id,
      customScenario.category,
      customScenario.evidence
    );
    setReviewResult(evalRes);
  };

  return (
    <div>
      <ReviewStation
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        reviewResult={reviewResult}
        isLoading={isLoading}
        onRunSyncEvaluation={handleRunSyncEvaluation}
        onEnqueueAsyncTask={() => {}}
        onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
        onCustomImageUpload={handleCustomImageUpload}
      />

      {isOverrideModalOpen && reviewResult && (
        <HumanOverrideModal
          review={reviewResult}
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          onSuccess={(updated) => setReviewResult(updated)}
        />
      )}
    </div>
  );
}
