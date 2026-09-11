import { useState } from 'react';
import type { Verification } from '../types/verification';
import ConfidenceGauge from './ConfidenceGauge';
import {
  VERIFICATION_STATUS_COLORS,
  REPORT_STATUS_COLORS,
  QUALITY_COLORS,
  RULE_SEVERITY_BADGE,
  CATEGORY_LABELS,
  anomalySeverityLabel,
  anomalySeverityBadge,
} from '../utils/statusStyles';

export default function VerificationDetails({ verification }: { verification: Verification }) {
  const [showOcr, setShowOcr] = useState(false);

  // The AI service mirrors the rule-engine findings into `issues`, so anything
  // already listed in the verification report would otherwise render twice.
  // What's left here are issues raised outside the rule engine — an unreadable
  // document, or the AI service being unavailable.
  const reportMessages = new Set(
    verification.verificationReport?.findings?.map((f) => f.message) ?? []
  );
  const unreportedIssues = (verification.issues ?? []).filter((i) => !reportMessages.has(i));

  return (
    <div className="space-y-5">
      {/* Status + confidence */}
      <div className="flex items-center gap-4">
        <ConfidenceGauge confidence={verification.confidence} size={88} />
        <div className="space-y-1.5">
          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${
              VERIFICATION_STATUS_COLORS[verification.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {verification.status}
          </span>
          <p className="text-sm text-gray-500">
            Document type:{' '}
            <span className="font-medium text-gray-700 capitalize">
              {verification.documentType?.replace(/_/g, ' ') || 'Unknown'}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {new Date(verification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* AI Analysis */}
      {verification.aiAnalysis && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            AI Analysis
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Quality</p>
              <p
                className={`text-sm font-semibold ${
                  QUALITY_COLORS[verification.aiAnalysis.documentQuality] ?? 'text-gray-600'
                }`}
              >
                {verification.aiAnalysis.documentQuality}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Tampering</p>
              <p
                className={`text-sm font-semibold ${
                  verification.aiAnalysis.tamperingDetected ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {verification.aiAnalysis.tamperingDetected ? 'Detected' : 'None'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                risk {Math.round((verification.aiAnalysis.riskScore ?? 0) * 100)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Consistency</p>
              <p
                className={`text-sm font-semibold ${
                  verification.aiAnalysis.dataConsistency ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {verification.aiAnalysis.dataConsistency ? 'OK' : 'Issues'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extracted fields */}
      {verification.extractedData && Object.keys(verification.extractedData).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Extracted Fields
          </p>
          <div className="space-y-1.5">
            {Object.entries(verification.extractedData).map(([key, value]) => (
              <div key={key} className="flex gap-3 text-sm">
                <span className="text-gray-400 w-36 shrink-0 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {verification.aiAnalysis?.anomalies?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Anomalies Detected
          </p>
          <ul className="space-y-1.5">
            {verification.aiAnalysis.anomalies.map((anomaly) => (
              <li key={anomaly.code + anomaly.message} className="flex items-start gap-2 text-sm">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${anomalySeverityBadge(
                    anomaly.severity
                  )}`}
                >
                  {anomalySeverityLabel(anomaly.severity)}
                </span>
                <span className="text-gray-700">{anomaly.message}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-2">
            Anomalies are indicators for review, not proof of forgery.
          </p>
        </div>
      )}

      {/* Verification Report */}
      {verification.verificationReport && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Verification Report
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  REPORT_STATUS_COLORS[verification.verificationReport.verificationStatus] ??
                  'bg-gray-100 text-gray-600'
                }`}
              >
                {verification.verificationReport.verificationStatus}
              </span>
              <span className="text-[11px] text-gray-400">
                {verification.verificationReport.passedChecks}/
                {verification.verificationReport.totalChecks} checks passed
              </span>
            </div>
          </div>
          {verification.verificationReport.findings.length === 0 ? (
            <p className="text-sm text-green-600">All verification rules passed.</p>
          ) : (
            <ul className="space-y-1.5">
              {verification.verificationReport.findings.map((finding, i) => (
                <li key={finding.code + i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                      RULE_SEVERITY_BADGE[finding.severity] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="text-gray-700">
                    <span className="text-gray-400">
                      [{CATEGORY_LABELS[finding.category] ?? finding.category}]{' '}
                    </span>
                    {finding.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Issues raised outside the rule engine */}
      {unreportedIssues.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Issues
          </p>
          <ul className="space-y-1 list-disc list-inside">
            {unreportedIssues.map((issue, i) => (
              <li key={i} className="text-sm text-red-600">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw OCR text (collapsible) */}
      <div>
        <button onClick={() => setShowOcr((p) => !p)} className="text-xs text-blue-600 hover:underline">
          {showOcr ? 'Hide' : 'Show'} raw OCR text ({verification.charCount.toLocaleString()} chars)
        </button>
        {showOcr && (
          <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 max-h-44 overflow-auto">
            {verification.ocrText || 'No text extracted.'}
          </pre>
        )}
      </div>
    </div>
  );
}
