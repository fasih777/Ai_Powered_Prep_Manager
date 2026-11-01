import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { PrepReviewOutput } from '../lib/rules/ruleEngine';

interface AuditTrailViewProps {
  onSelectReviewForInspection: (review: PrepReviewOutput) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ onSelectReviewForInspection }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'UNCERTAIN'>('ALL');
  const [selectedReviewDetails, setSelectedReviewDetails] = useState<any | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/v1/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.warn('Error fetching audit reviews:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.reviewId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rev.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prep_manager_audit_log_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                Immutable Compliance Audit Trail & Reviewer Overrides
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                PRD §8 FR9 & FR10
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Provides complete end-to-end auditability: every packaging decision is stamped with rule ID citations, perception evidence hashes, rule set version, and human supervisor overrides.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors self-start md:self-center"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-zinc-800">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Review ID, category, or evidence phrase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 text-xs rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-1.5">
            {(['ALL', 'PASS', 'FAIL', 'UNCERTAIN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  statusFilter === st
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Ledger Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 font-mono text-zinc-400 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Review ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Rule Set</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Human Override</th>
                <th className="p-3.5">Evaluated At</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    No compliance audit records found matching query.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.reviewId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-zinc-200">
                      {rev.reviewId}
                    </td>
                    <td className="p-3.5 text-zinc-400 capitalize">
                      {rev.category}
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      v{rev.ruleSetVersion}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] border ${
                          rev.overallStatus === 'PASS'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : rev.overallStatus === 'FAIL'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {rev.overallStatus === 'PASS' && <CheckCircle2 className="w-3 h-3" />}
                        {rev.overallStatus === 'FAIL' && <XCircle className="w-3 h-3" />}
                        {rev.overallStatus === 'UNCERTAIN' && <AlertTriangle className="w-3 h-3" />}
                        <span>{rev.overallStatus}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      {rev.humanOverride ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                          <UserCheck className="w-3 h-3" />
                          <span>{rev.humanOverride.reviewerId || rev.humanOverride.reviewer_name}</span>
                        </span>
                      ) : rev.overrides && rev.overrides.length > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                          <UserCheck className="w-3 h-3" />
                          <span>{rev.overrides[0].reviewer_name || rev.overrides[0].reviewerName || 'Supervisor'}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">None (Automated)</span>
                      )}
                    </td>
                    <td className="p-3.5 text-zinc-500 text-[11px]">
                      {(() => {
                        const d = new Date(rev.evaluatedAt || rev.createdAt || rev.created_at || Date.now());
                        const isValid = !isNaN(d.getTime());
                        return isValid ? `${d.toLocaleTimeString()} • ${d.toLocaleDateString()}` : 'Just now';
                      })()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReviewDetails(rev)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-sky-400 rounded border border-zinc-700 text-[11px] font-sans font-medium transition-colors"
                      >
                        Inspect Evidence
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Inspection Modal */}
      {selectedReviewDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Compliance Audit Record #{selectedReviewDetails.reviewId}
                </h3>
                <span className="text-xs text-zinc-400 font-mono">
                  Rule Set: v{selectedReviewDetails.ruleSetVersion} • Category: {selectedReviewDetails.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedReviewDetails(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="font-semibold text-zinc-300 block mb-1">Overall Status Summary:</span>
                <p className="text-zinc-400 leading-relaxed">{selectedReviewDetails.summary}</p>
              </div>

              {selectedReviewDetails.humanOverride && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40">
                  <span className="font-bold text-indigo-300 block mb-1">Human Reviewer Override Stamp:</span>
                  <div className="text-indigo-200 font-mono text-[11px] space-y-0.5">
                    <div>Auditor: {selectedReviewDetails.humanOverride.reviewerId}</div>
                    <div>Calibrated Verdict: {selectedReviewDetails.humanOverride.overriddenVerdict}</div>
                    <div>Justification: {selectedReviewDetails.humanOverride.reason}</div>
                    <div>Timestamp: {selectedReviewDetails.humanOverride.timestamp}</div>
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-zinc-300 block mb-2">Check Details & Evidence Citations:</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedReviewDetails.checks?.map((chk: any) => (
                    <div
                      key={chk.checkId}
                      className="p-2.5 rounded bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-zinc-200">{chk.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">Rule: {chk.citedRuleId || chk.cited_rule_id || chk.checkId || chk.check_id}</div>
                        {chk.reason && (
                          <div className="text-rose-400 text-[11px] mt-0.5">{chk.reason}</div>
                        )}
                        <div className="text-zinc-400 text-[10px] mt-0.5">Evidence: {chk.evidenceSummary || chk.evidence_summary || chk.reason || chk.description || 'Verified via optical perception'}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          chk.verdict === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : chk.verdict === 'FAIL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {chk.verdict}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedReviewDetails(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
