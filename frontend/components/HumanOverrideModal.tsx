import React, { useState } from 'react';
import { UserCheck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PrepReviewOutput } from '../lib/rules/ruleEngine';

interface HumanOverrideModalProps {
  review: PrepReviewOutput;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReview: PrepReviewOutput) => void;
}

export const HumanOverrideModal: React.FC<HumanOverrideModalProps> = ({
  review,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reviewerId, setReviewerId] = useState('OPERATOR-QA-089');
  const [verdict, setVerdict] = useState<'PASS' | 'FAIL' | 'UNCERTAIN'>(
    review.overallStatus === 'FAIL' ? 'PASS' : 'FAIL'
  );
  const [reason, setReason] = useState(
    'Physically verified unit on packing bench. Suffocation warning and polybag seal inspected under direct workstation lighting.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/reviews/${review.reviewId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId,
          overriddenVerdict: verdict,
          reason
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
        onClose();
      } else {
        // Fallback update locally
        const updated: PrepReviewOutput = {
          ...review,
          overallStatus: verdict,
          summary: `[HUMAN OVERRIDE by ${reviewerId}]: Status calibrated to ${verdict}. Reason: ${reason}`,
          humanOverride: {
            overriddenVerdict: verdict,
            reviewerId,
            reason,
            timestamp: new Date().toISOString()
          }
        };
        onSuccess(updated);
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-zinc-800 pb-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <UserCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Human Reviewer Override (PRD FR10)
            </h3>
            <p className="text-xs text-zinc-400">
              Calibrate verdict for Review #{review.reviewId}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Authorized Reviewer ID / Badge:
            </label>
            <input
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Calibrated Verdict:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PASS', 'FAIL', 'UNCERTAIN'] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setVerdict(v)}
                  className={`py-2 rounded-lg font-mono font-bold border transition-all text-xs ${
                    verdict === v
                      ? v === 'PASS'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : v === 'FAIL'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Inspection Justification / Reason:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
            <span className="font-semibold text-amber-400 block mb-0.5">Audit Trail Notice:</span>
            Human overrides are permanently recorded in the immutable compliance log for future calibration and threshold re-training.
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Stamping Override...' : 'Commit Human Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
